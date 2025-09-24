-- 012_itsm_schema_refactor.sql
-- Safe, idempotent adjustments for RLS, sequences, regex, indexes, and a unified RPC

-- Extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_graphql;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================
-- SECURITY DEFINER HELPERS (hardened)
-- =====================================

-- JWT-scoped organization function (no fallback)
CREATE OR REPLACE FUNCTION public.jwt_org_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid;
BEGIN
  _org := NULLIF(current_setting('request.jwt.claims', true)::json->>'org_id','')::uuid;
  IF _org IS NULL THEN
    RAISE EXCEPTION 'Missing org_id in JWT claims' USING HINT = 'Add org_id to JWT custom claims.';
  END IF;
  RETURN _org;
END;
$$;

-- Remove legacy fallback org function to enforce JWT-only scoping
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'user_organization_id' AND pronamespace = 'public'::regnamespace
  ) THEN
    DROP FUNCTION public.user_organization_id();
  END IF;
END $$;

-- Keep team and admin helpers; harden with search_path
CREATE OR REPLACE FUNCTION public.user_team_ids()
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN ARRAY(
    SELECT tm.team_id
    FROM public.team_members tm
    WHERE tm.profile_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_organization_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.organization_id = public.jwt_org_id()
      AND p.is_admin = true
  );
END;
$$;

-- Prevent self privilege escalation (unchanged logic; hardened)
CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.id = NEW.id AND auth.uid() = NEW.id THEN
    IF NEW.is_admin != OLD.is_admin OR NEW.role_id != OLD.role_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = true
      ) THEN
        RAISE EXCEPTION 'Cannot modify own privileges';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- updated_at trigger (hardened)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Audit log with NULL-safe headers
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid;
  _headers json;
  _xff text;
  _ua text;
BEGIN
  _org := public.jwt_org_id();
  _headers := current_setting('request.headers', true)::json;
  _xff := COALESCE(_headers->>'x-forwarded-for', NULL);
  _ua := COALESCE(_headers->>'user-agent', NULL);

  INSERT INTO public.audit_logs (
    user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    _org,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    NULLIF(_xff,'')::inet,
    _ua
  );
END;
$$;

-- ======================================================
-- PER-ORGANIZATION COUNTERS AND NUMBER GENERATORS
-- ======================================================

CREATE TABLE IF NOT EXISTS public.org_counters (
  organization_id uuid NOT NULL,
  counter_name text NOT NULL,
  last_value bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, counter_name),
  CONSTRAINT org_counters_org_fk FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- atomically increments and returns next value for current org
CREATE OR REPLACE FUNCTION public.next_org_counter(p_counter_name text)
RETURNS bigint
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid := public.jwt_org_id();
  _val bigint;
BEGIN
  LOOP
    UPDATE public.org_counters
       SET last_value = last_value + 1
     WHERE organization_id = _org
       AND counter_name = p_counter_name
     RETURNING last_value INTO _val;

    IF FOUND THEN
      RETURN _val;
    END IF;

    BEGIN
      INSERT INTO public.org_counters(organization_id, counter_name, last_value)
      VALUES (_org, p_counter_name, 1)
      ON CONFLICT (organization_id, counter_name) DO NOTHING;
    EXCEPTION WHEN unique_violation THEN
      -- retry
    END;
  END LOOP;
END;
$$;

-- Generators for human-friendly numbers
CREATE OR REPLACE FUNCTION public.next_ticket_number()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n bigint; BEGIN
  n := public.next_org_counter('ticket');
  RETURN 'TKT-' || lpad(n::text, 8, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.next_sr_number()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n bigint; BEGIN
  n := public.next_org_counter('service_request');
  RETURN 'SR-' || lpad(n::text, 8, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.next_chg_number()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n bigint; BEGIN
  n := public.next_org_counter('change');
  RETURN 'CHG-' || lpad(n::text, 8, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.next_prb_number()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n bigint; BEGIN
  n := public.next_org_counter('problem');
  RETURN 'PRB-' || lpad(n::text, 8, '0');
END; $$;

-- Apply defaults (safe if columns exist)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tickets' AND column_name='ticket_number'
  ) THEN
    EXECUTE 'ALTER TABLE public.tickets ALTER COLUMN ticket_number SET DEFAULT public.next_ticket_number()';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='service_requests' AND column_name='request_number'
  ) THEN
    EXECUTE 'ALTER TABLE public.service_requests ALTER COLUMN request_number SET DEFAULT public.next_sr_number()';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='change_requests' AND column_name='change_number'
  ) THEN
    EXECUTE 'ALTER TABLE public.change_requests ALTER COLUMN change_number SET DEFAULT public.next_chg_number()';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='problem_records' AND column_name='problem_number'
  ) THEN
    EXECUTE 'ALTER TABLE public.problem_records ALTER COLUMN problem_number SET DEFAULT public.next_prb_number()';
  END IF;
END $$;

-- =====================================
-- REGEX / CHECK FIXES
-- =====================================

-- service_categories.color
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='service_categories' AND column_name='color'
  ) THEN
    ALTER TABLE public.service_categories
      DROP CONSTRAINT IF EXISTS service_categories_color_check;
    ALTER TABLE public.service_categories
      ADD CONSTRAINT service_categories_color_check CHECK (color ~ '^#[0-9a-fA-F]{6}$');
  END IF;
END $$;

-- kb_categories.color
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='kb_categories' AND column_name='color'
  ) THEN
    ALTER TABLE public.kb_categories
      DROP CONSTRAINT IF EXISTS kb_categories_color_check;
    ALTER TABLE public.kb_categories
      ADD CONSTRAINT kb_categories_color_check CHECK (color ~ '^#[0-9a-fA-F]{6}$');
  END IF;
END $$;

-- kb_articles.language
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='kb_articles' AND column_name='language'
  ) THEN
    ALTER TABLE public.kb_articles
      DROP CONSTRAINT IF EXISTS kb_articles_language_check;
    ALTER TABLE public.kb_articles
      ADD CONSTRAINT kb_articles_language_check CHECK (language ~ '^[a-z]{2}$');
  END IF;
END $$;

-- chat_conversations.visitor_email
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='chat_conversations' AND column_name='visitor_email'
  ) THEN
    ALTER TABLE public.chat_conversations
      DROP CONSTRAINT IF EXISTS chat_conversations_visitor_email_check;
    ALTER TABLE public.chat_conversations
      ADD CONSTRAINT chat_conversations_visitor_email_check CHECK (
        visitor_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
      );
  END IF;
END $$;

-- =====================================
-- RLS POLICIES USING jwt_org_id() (no fallback)
-- =====================================

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their organization" ON public.organizations;
CREATE POLICY "Users can only access their organization" ON public.organizations
  FOR SELECT USING (public.jwt_org_id() = id);

-- Departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access departments" ON public.departments;
CREATE POLICY "Org can read departments" ON public.departments
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org can change departments" ON public.departments
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org can insert departments" ON public.departments
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access roles" ON public.roles;
CREATE POLICY "Org read roles" ON public.roles
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change roles" ON public.roles
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert roles" ON public.roles
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view organization profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage organization profiles" ON public.profiles;

CREATE POLICY "Org read profiles" ON public.profiles
  FOR SELECT USING (organization_id = public.jwt_org_id());

CREATE POLICY "Self update profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = public.profiles.organization_id
        AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = public.profiles.organization_id
        AND p.is_admin = true
    )
  );

-- Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access teams" ON public.teams;
CREATE POLICY "Org read teams" ON public.teams
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change teams" ON public.teams
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert teams" ON public.teams
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Team members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see team memberships" ON public.team_members;
CREATE POLICY "Team membership read" ON public.team_members
  FOR SELECT USING (
    profile_id = auth.uid() OR team_id = ANY(public.user_team_ids())
  );
CREATE POLICY "Org insert team members" ON public.team_members
  FOR INSERT WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE organization_id = public.jwt_org_id())
  );

-- Asset types
ALTER TABLE public.asset_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access asset types" ON public.asset_types;
CREATE POLICY "Org read asset_types" ON public.asset_types
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change asset_types" ON public.asset_types
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert asset_types" ON public.asset_types
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access assets" ON public.assets;
CREATE POLICY "Org read assets" ON public.assets
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change assets" ON public.assets
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert assets" ON public.assets
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Asset relationships
ALTER TABLE public.asset_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access asset relationships" ON public.asset_relationships;
CREATE POLICY "Org read asset_relationships" ON public.asset_relationships
  FOR SELECT USING (
    parent_asset_id IN (SELECT id FROM public.assets WHERE organization_id = public.jwt_org_id())
  );
CREATE POLICY "Org change asset_relationships" ON public.asset_relationships
  FOR UPDATE, DELETE USING (
    parent_asset_id IN (SELECT id FROM public.assets WHERE organization_id = public.jwt_org_id())
  );
CREATE POLICY "Org insert asset_relationships" ON public.asset_relationships
  FOR INSERT WITH CHECK (
    parent_asset_id IN (SELECT id FROM public.assets WHERE organization_id = public.jwt_org_id())
  );

-- Asset history
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access asset history" ON public.asset_history;
CREATE POLICY "Org read asset_history" ON public.asset_history
  FOR SELECT USING (
    asset_id IN (SELECT id FROM public.assets WHERE organization_id = public.jwt_org_id())
  );

-- Ticket categories
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access categories" ON public.ticket_categories;
CREATE POLICY "Org read ticket_categories" ON public.ticket_categories
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change ticket_categories" ON public.ticket_categories
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert ticket_categories" ON public.ticket_categories
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access relevant tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets in their org" ON public.tickets;
DROP POLICY IF EXISTS "Users can update relevant tickets" ON public.tickets;

CREATE POLICY "Ticket read scoped" ON public.tickets
  FOR SELECT USING (
    organization_id = public.jwt_org_id()
    AND (
      requester_id = auth.uid()
      OR assignee_id = auth.uid()
      OR auth.uid() = ANY(watchers)
      OR team_id = ANY(public.user_team_ids())
      OR public.is_organization_admin()
    )
  );

CREATE POLICY "Ticket insert scoped" ON public.tickets
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

CREATE POLICY "Ticket update scoped" ON public.tickets
  FOR UPDATE USING (
    organization_id = public.jwt_org_id()
    AND (
      requester_id = auth.uid()
      OR assignee_id = auth.uid()
      OR auth.uid() = ANY(watchers)
      OR team_id = ANY(public.user_team_ids())
      OR public.is_organization_admin()
    )
  );

-- Ticket escalations
ALTER TABLE public.ticket_escalations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access escalations" ON public.ticket_escalations;
CREATE POLICY "Org read escalations" ON public.ticket_escalations
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM public.tickets WHERE organization_id = public.jwt_org_id())
  );
CREATE POLICY "Org change escalations" ON public.ticket_escalations
  FOR UPDATE, DELETE USING (
    ticket_id IN (SELECT id FROM public.tickets WHERE organization_id = public.jwt_org_id())
  );
CREATE POLICY "Org insert escalations" ON public.ticket_escalations
  FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM public.tickets WHERE organization_id = public.jwt_org_id())
  );

-- Workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access workflows" ON public.workflows;
CREATE POLICY "Org read workflows" ON public.workflows
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change workflows" ON public.workflows
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert workflows" ON public.workflows
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Workflow executions
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access workflow executions" ON public.workflow_executions;
CREATE POLICY "Org read workflow_executions" ON public.workflow_executions
  FOR SELECT USING (
    workflow_id IN (SELECT id FROM public.workflows WHERE organization_id = public.jwt_org_id())
  );
CREATE POLICY "Org change workflow_executions" ON public.workflow_executions
  FOR UPDATE, DELETE USING (
    workflow_id IN (SELECT id FROM public.workflows WHERE organization_id = public.jwt_org_id())
  );
CREATE POLICY "Org insert workflow_executions" ON public.workflow_executions
  FOR INSERT WITH CHECK (
    workflow_id IN (SELECT id FROM public.workflows WHERE organization_id = public.jwt_org_id())
  );

-- User skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their skills" ON public.user_skills;
CREATE POLICY "Self or admin manage skills" ON public.user_skills
  FOR SELECT, UPDATE, DELETE USING (
    user_id = auth.uid()
    OR public.is_organization_admin()
  );
CREATE POLICY "Insert own skills" ON public.user_skills
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Assignment rules
ALTER TABLE public.assignment_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization admins can manage assignment rules" ON public.assignment_rules;
CREATE POLICY "Admins manage assignment rules" ON public.assignment_rules
  FOR SELECT, UPDATE, DELETE USING (
    organization_id = public.jwt_org_id() AND public.is_organization_admin()
  );
CREATE POLICY "Admins insert assignment rules" ON public.assignment_rules
  FOR INSERT WITH CHECK (
    organization_id = public.jwt_org_id() AND public.is_organization_admin()
  );

-- SLA policies
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access SLA policies" ON public.sla_policies;
CREATE POLICY "Org read SLA" ON public.sla_policies
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change SLA" ON public.sla_policies
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert SLA" ON public.sla_policies
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Ticket SLAs
ALTER TABLE public.ticket_slas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access ticket SLAs" ON public.ticket_slas;
CREATE POLICY "Org read ticket_slas" ON public.ticket_slas
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM public.tickets WHERE organization_id = public.jwt_org_id())
  );
CREATE POLICY "Org change ticket_slas" ON public.ticket_slas
  FOR UPDATE, DELETE USING (
    ticket_id IN (SELECT id FROM public.tickets WHERE organization_id = public.jwt_org_id())
  );
CREATE POLICY "Org insert ticket_slas" ON public.ticket_slas
  FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM public.tickets WHERE organization_id = public.jwt_org_id())
  );

-- Service categories
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access service categories" ON public.service_categories;
CREATE POLICY "Org read service_categories" ON public.service_categories
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change service_categories" ON public.service_categories
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert service_categories" ON public.service_categories
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Service catalog
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access service catalog" ON public.service_catalog;
CREATE POLICY "Org read service_catalog" ON public.service_catalog
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change service_catalog" ON public.service_catalog
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert service_catalog" ON public.service_catalog
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Service requests
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access relevant service requests" ON public.service_requests;
CREATE POLICY "SR read scoped" ON public.service_requests
  FOR SELECT USING (
    organization_id = public.jwt_org_id()
    AND (
      requester_id = auth.uid() OR assigned_to = auth.uid() OR approved_by = auth.uid() OR public.is_organization_admin()
    )
  );
CREATE POLICY "SR insert scoped" ON public.service_requests
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());
CREATE POLICY "SR update scoped" ON public.service_requests
  FOR UPDATE USING (
    organization_id = public.jwt_org_id()
    AND (
      requester_id = auth.uid() OR assigned_to = auth.uid() OR approved_by = auth.uid() OR public.is_organization_admin()
    )
  );

-- Change requests
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access change requests" ON public.change_requests;
CREATE POLICY "Org read changes" ON public.change_requests
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change changes" ON public.change_requests
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert changes" ON public.change_requests
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Problem records
ALTER TABLE public.problem_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access problem records" ON public.problem_records;
CREATE POLICY "Org read problems" ON public.problem_records
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change problems" ON public.problem_records
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert problems" ON public.problem_records
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Notifications (per-user already)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their notifications" ON public.notifications;
CREATE POLICY "Self notifications" ON public.notifications
  FOR SELECT, UPDATE, DELETE USING (recipient_id = auth.uid());
CREATE POLICY "Insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (recipient_id = auth.uid());

-- Notification preferences (per-user)
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their notification preferences" ON public.notification_preferences;
CREATE POLICY "Self notification prefs" ON public.notification_preferences
  FOR SELECT, UPDATE, DELETE USING (user_id = auth.uid());
CREATE POLICY "Insert own notif prefs" ON public.notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization admins can manage integrations" ON public.integrations;
CREATE POLICY "Admins manage integrations" ON public.integrations
  FOR SELECT, UPDATE, DELETE USING (organization_id = public.jwt_org_id() AND public.is_organization_admin());
CREATE POLICY "Admins insert integrations" ON public.integrations
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id() AND public.is_organization_admin());

-- Webhook endpoints
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization admins can manage webhooks" ON public.webhook_endpoints;
CREATE POLICY "Admins manage webhooks" ON public.webhook_endpoints
  FOR SELECT, UPDATE, DELETE USING (organization_id = public.jwt_org_id() AND public.is_organization_admin());
CREATE POLICY "Admins insert webhooks" ON public.webhook_endpoints
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id() AND public.is_organization_admin());

-- Webhook deliveries
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization admins can view webhook deliveries" ON public.webhook_deliveries;
CREATE POLICY "Admins read webhook deliveries" ON public.webhook_deliveries
  FOR SELECT USING (
    webhook_endpoint_id IN (
      SELECT id FROM public.webhook_endpoints WHERE organization_id = public.jwt_org_id()
    ) AND public.is_organization_admin()
  );

-- Dashboards
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Dashboard access control" ON public.dashboards;
CREATE POLICY "Dashboard access" ON public.dashboards
  FOR SELECT USING (
    organization_id = public.jwt_org_id()
    AND (
      owner_id = auth.uid() OR visibility = 'organization' OR auth.uid() = ANY(shared_with) OR public.is_organization_admin()
    )
  );
CREATE POLICY "Org change dashboards" ON public.dashboards
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert dashboards" ON public.dashboards
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- KB categories
ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access KB categories" ON public.kb_categories;
CREATE POLICY "Org read kb_categories" ON public.kb_categories
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change kb_categories" ON public.kb_categories
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert kb_categories" ON public.kb_categories
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- KB articles
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Knowledge base article access" ON public.kb_articles;
CREATE POLICY "KB read scoped" ON public.kb_articles
  FOR SELECT USING (
    organization_id = public.jwt_org_id()
    AND (
      visibility = 'public' OR (visibility = 'internal' AND auth.uid() IS NOT NULL) OR (visibility = 'private' AND author_id = auth.uid()) OR public.is_organization_admin()
    )
  );
CREATE POLICY "Org change kb_articles" ON public.kb_articles
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert kb_articles" ON public.kb_articles
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Form definitions
ALTER TABLE public.form_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can access form definitions" ON public.form_definitions;
CREATE POLICY "Org read form_defs" ON public.form_definitions
  FOR SELECT USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org change form_defs" ON public.form_definitions
  FOR UPDATE, DELETE USING (organization_id = public.jwt_org_id());
CREATE POLICY "Org insert form_defs" ON public.form_definitions
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Form submissions
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access their form submissions" ON public.form_submissions;
CREATE POLICY "Form submissions read scoped" ON public.form_submissions
  FOR SELECT USING (
    organization_id = public.jwt_org_id()
    AND (submitted_by = auth.uid() OR processed_by = auth.uid() OR public.is_organization_admin())
  );
CREATE POLICY "Form submissions insert scoped" ON public.form_submissions
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());
CREATE POLICY "Form submissions update scoped" ON public.form_submissions
  FOR UPDATE USING (
    organization_id = public.jwt_org_id()
    AND (submitted_by = auth.uid() OR processed_by = auth.uid() OR public.is_organization_admin())
  );

-- Chat conversations
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat conversation access" ON public.chat_conversations;
CREATE POLICY "Chat conv scoped" ON public.chat_conversations
  FOR SELECT, UPDATE, DELETE USING (
    organization_id = public.jwt_org_id()
    AND (customer_id = auth.uid() OR agent_id = auth.uid() OR public.is_organization_admin())
  );
CREATE POLICY "Chat conv insert scoped" ON public.chat_conversations
  FOR INSERT WITH CHECK (organization_id = public.jwt_org_id());

-- Chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat message access" ON public.chat_messages;
CREATE POLICY "Chat msg scoped" ON public.chat_messages
  FOR SELECT, UPDATE, DELETE USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations
      WHERE organization_id = public.jwt_org_id()
        AND (customer_id = auth.uid() OR agent_id = auth.uid() OR public.is_organization_admin())
    )
  );
CREATE POLICY "Chat msg insert scoped" ON public.chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.chat_conversations WHERE organization_id = public.jwt_org_id()
    )
  );

-- Audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = public.audit_logs.organization_id
        AND p.is_admin = true
    )
  );

-- =====================================
-- INDEXES (GIN / COMPOSITE)
-- =====================================

-- Arrays
CREATE INDEX IF NOT EXISTS idx_tickets_watchers_gin ON public.tickets USING gin (watchers);
CREATE INDEX IF NOT EXISTS idx_assets_tags_gin ON public.assets USING gin (tags);

-- JSONB
CREATE INDEX IF NOT EXISTS idx_assets_configuration_gin ON public.assets USING gin (configuration);
CREATE INDEX IF NOT EXISTS idx_service_catalog_restricted_depts_gin ON public.service_catalog USING gin (restricted_to_departments);
CREATE INDEX IF NOT EXISTS idx_service_catalog_request_form_fields_gin ON public.service_catalog USING gin ((request_form_fields));
CREATE INDEX IF NOT EXISTS idx_assignment_rules_conditions_gin ON public.assignment_rules USING gin (conditions);
CREATE INDEX IF NOT EXISTS idx_assignment_rules_logic_gin ON public.assignment_rules USING gin (assignment_logic);

-- Trigram text search (pg_trgm)
CREATE INDEX IF NOT EXISTS idx_tickets_title_trgm ON public.tickets USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tickets_description_trgm ON public.tickets USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kb_articles_title_trgm ON public.kb_articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kb_articles_content_trgm ON public.kb_articles USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_catalog_name_trgm ON public.service_catalog USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_catalog_description_trgm ON public.service_catalog USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_assets_name_trgm ON public.assets USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_assets_asset_id_trgm ON public.assets USING gin (asset_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_assets_serial_number_trgm ON public.assets USING gin (serial_number gin_trgm_ops);

-- Composite / partials for common list views
CREATE INDEX IF NOT EXISTS idx_tickets_org_status_created_at ON public.tickets (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_org_assignee_created_at ON public.tickets (organization_id, assignee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_org_status_created_at ON public.service_requests (organization_id, status, created_at DESC);

-- =====================================
-- UNIFIED RPC (app_api)
-- =====================================

CREATE OR REPLACE FUNCTION public.app_api(p_action text, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _org uuid := public.jwt_org_id();
  _result jsonb;
BEGIN
  IF p_action = 'create_ticket' THEN
    INSERT INTO public.tickets (
      title, description, type, category_id, subcategory, priority, urgency, impact, severity,
      requester_id, assignee_id, organization_id, department_id, team_id, channel, due_date, tags, custom_fields
    ) VALUES (
      COALESCE(p_payload->>'title','Untitled'),
      p_payload->>'description',
      COALESCE(p_payload->>'type','incident'),
      (p_payload->>'category_id')::uuid,
      p_payload->>'subcategory',
      COALESCE(p_payload->>'priority','medium'),
      COALESCE(p_payload->>'urgency','medium'),
      COALESCE(p_payload->>'impact','medium'),
      NULLIF(p_payload->>'severity','') ,
      (p_payload->>'requester_id')::uuid,
      (p_payload->>'assignee_id')::uuid,
      _org,
      (p_payload->>'department_id')::uuid,
      (p_payload->>'team_id')::uuid,
      COALESCE(p_payload->>'channel','portal'),
      (p_payload->>'due_date')::timestamptz,
      COALESCE((SELECT array_agg(value::text) FROM jsonb_array_elements_text(p_payload->'tags')) , ARRAY[]::text[]),
      COALESCE(p_payload->'custom_fields', '{}'::jsonb)
    ) RETURNING to_jsonb(public.tickets.*) INTO _result;
    RETURN jsonb_build_object('ok', true, 'ticket', _result);

  ELSIF p_action = 'list_tickets' THEN
    RETURN (
      SELECT jsonb_build_object(
        'ok', true,
        'tickets', COALESCE(jsonb_agg(t), '[]'::jsonb)
      )
      FROM (
        SELECT t.*
        FROM public.tickets t
        WHERE t.organization_id = _org
          AND (p_payload->>'status' IS NULL OR t.status = p_payload->>'status')
        ORDER BY t.created_at DESC
        LIMIT COALESCE((p_payload->>'limit')::int, 50)
        OFFSET COALESCE((p_payload->>'offset')::int, 0)
      ) s(t)
    );

  ELSE
    RAISE EXCEPTION 'Unknown action: %', p_action USING HINT = 'Supported: create_ticket, list_tickets';
  END IF;
END;
$$;

-- =====================================
-- GRANTS (tighten anon)
-- =====================================

REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;