-- Create tickets table (core of the BSM system)
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('incident', 'request', 'problem', 'change', 'query')),
  category TEXT,
  subcategory TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  impact TEXT DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled')),
  requester_id UUID REFERENCES public.profiles(id),
  assignee_id UUID REFERENCES public.profiles(id),
  organization_id UUID REFERENCES public.organizations(id),
  parent_ticket_id UUID REFERENCES public.tickets(id),
  channel TEXT DEFAULT 'portal' CHECK (channel IN ('portal', 'email', 'slack', 'whatsapp', 'phone', 'chat')),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  ai_confidence DECIMAL(3,2),
  due_date TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Allow users to see tickets they created or are assigned to
CREATE POLICY "tickets_select_involved" ON public.tickets FOR SELECT USING (
  auth.uid() = requester_id OR 
  auth.uid() = assignee_id OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Allow users to create tickets
CREATE POLICY "tickets_insert_authenticated" ON public.tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow assignees and admins to update tickets
CREATE POLICY "tickets_update_assigned" ON public.tickets FOR UPDATE USING (
  auth.uid() = assignee_id OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Create ticket comments table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for ticket comments
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Allow users to see comments on tickets they have access to
CREATE POLICY "comments_select_ticket_access" ON public.ticket_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets t 
    WHERE t.id = ticket_id AND (
      t.requester_id = auth.uid() OR 
      t.assignee_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  )
);

-- Create workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'automatic', 'scheduled')),
  trigger_conditions JSONB,
  steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view active workflows
CREATE POLICY "workflows_select_active" ON public.workflows FOR SELECT USING (is_active = true);

-- Allow admins to manage workflows
CREATE POLICY "workflows_admin_all" ON public.workflows FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create workflow executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id),
  ticket_id UUID REFERENCES public.tickets(id),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  current_step INTEGER DEFAULT 0,
  execution_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
