-- BSM Database Schema Setup
-- This script creates all the necessary tables for the Business Service Management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'manager', 'customer');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'pending', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE ticket_type AS ENUM ('incident', 'service_request', 'change', 'problem');
CREATE TYPE change_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled');
CREATE TYPE change_priority AS ENUM ('low', 'medium', 'high', 'emergency');
CREATE TYPE asset_status AS ENUM ('active', 'inactive', 'maintenance', 'retired');
CREATE TYPE service_status AS ENUM ('active', 'inactive', 'maintenance', 'deprecated');

-- Update profiles table to include BSM-specific fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_role user_role DEFAULT 'customer';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cost_center text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id text;

-- Services table for service catalog
CREATE TABLE IF NOT EXISTS services (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    category text,
    subcategory text,
    service_owner_id uuid REFERENCES profiles(id),
    status service_status DEFAULT 'active',
    sla_response_time interval,
    sla_resolution_time interval,
    cost numeric(10,2),
    approval_required boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Assets table for CMDB
CREATE TABLE IF NOT EXISTS assets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    asset_tag text UNIQUE,
    category text,
    type text,
    model text,
    manufacturer text,
    serial_number text,
    location text,
    owner_id uuid REFERENCES profiles(id),
    status asset_status DEFAULT 'active',
    purchase_date date,
    warranty_expiry date,
    cost numeric(10,2),
    configuration jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Asset relationships for dependency mapping
CREATE TABLE IF NOT EXISTS asset_relationships (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
    child_asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
    relationship_type text NOT NULL, -- 'depends_on', 'connected_to', 'installed_on', etc.
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(parent_asset_id, child_asset_id, relationship_type)
);

-- Update tickets table with BSM-specific fields
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS affected_asset_id uuid REFERENCES assets(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS business_impact text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_notes text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS customer_satisfaction_rating integer CHECK (customer_satisfaction_rating >= 1 AND customer_satisfaction_rating <= 5);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_response_at timestamp with time zone;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_breach boolean DEFAULT false;

-- Changes table for change management
CREATE TABLE IF NOT EXISTS changes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_number text UNIQUE NOT NULL,
    title text NOT NULL,
    description text,
    justification text,
    implementation_plan text,
    rollback_plan text,
    testing_plan text,
    requester_id uuid REFERENCES profiles(id),
    assignee_id uuid REFERENCES profiles(id),
    approver_id uuid REFERENCES profiles(id),
    status change_status DEFAULT 'draft',
    priority change_priority DEFAULT 'medium',
    risk_level text,
    business_impact text,
    affected_services text[],
    affected_assets uuid[],
    scheduled_start timestamp with time zone,
    scheduled_end timestamp with time zone,
    actual_start timestamp with time zone,
    actual_end timestamp with time zone,
    approval_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Knowledge base articles
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    content text NOT NULL,
    summary text,
    category text,
    tags text[],
    author_id uuid REFERENCES profiles(id),
    status text DEFAULT 'draft',
    view_count integer DEFAULT 0,
    helpful_count integer DEFAULT 0,
    not_helpful_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- SLA definitions
CREATE TABLE IF NOT EXISTS sla_definitions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    service_id uuid REFERENCES services(id),
    priority ticket_priority,
    response_time interval NOT NULL,
    resolution_time interval NOT NULL,
    business_hours_only boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES profiles(id),
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info',
    read boolean DEFAULT false,
    related_entity_type text, -- 'ticket', 'change', 'asset', etc.
    related_entity_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Users can view all services" ON services FOR SELECT USING (true);
CREATE POLICY "Only admins and managers can modify services" ON services FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_role IN ('admin', 'manager')
    )
);

-- RLS Policies for assets
CREATE POLICY "Users can view all assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Only admins and managers can modify assets" ON assets FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_role IN ('admin', 'manager')
    )
);

-- RLS Policies for asset relationships
CREATE POLICY "Users can view asset relationships" ON asset_relationships FOR SELECT USING (true);
CREATE POLICY "Only admins and managers can modify asset relationships" ON asset_relationships FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_role IN ('admin', 'manager')
    )
);

-- RLS Policies for changes
CREATE POLICY "Users can view changes they created or are assigned to" ON changes FOR SELECT USING (
    requester_id = auth.uid() OR 
    assignee_id = auth.uid() OR 
    approver_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_role IN ('admin', 'manager', 'agent')
    )
);

CREATE POLICY "Users can create changes" ON changes FOR INSERT WITH CHECK (
    requester_id = auth.uid()
);

CREATE POLICY "Users can update their own changes or assigned changes" ON changes FOR UPDATE USING (
    requester_id = auth.uid() OR 
    assignee_id = auth.uid() OR 
    approver_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_role IN ('admin', 'manager')
    )
);

-- RLS Policies for knowledge articles
CREATE POLICY "Users can view published articles" ON knowledge_articles FOR SELECT USING (
    status = 'published' OR 
    author_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_role IN ('admin', 'manager', 'agent')
    )
);

CREATE POLICY "Users can create articles" ON knowledge_articles FOR INSERT WITH CHECK (
    author_id = auth.uid()
);

CREATE POLICY "Users can update their own articles" ON knowledge_articles FOR UPDATE USING (
    author_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_role IN ('admin', 'manager')
    )
);

-- RLS Policies for SLA definitions
CREATE POLICY "Users can view SLA definitions" ON sla_definitions FOR SELECT USING (true);
CREATE POLICY "Only admins and managers can modify SLA definitions" ON sla_definitions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_role IN ('admin', 'manager')
    )
);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (
    user_id = auth.uid()
);

CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (
    user_id = auth.uid()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_service_id ON tickets(service_id);
CREATE INDEX IF NOT EXISTS idx_tickets_affected_asset_id ON tickets(affected_asset_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_id ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_changes_status ON changes(status);
CREATE INDEX IF NOT EXISTS idx_changes_priority ON changes(priority);
CREATE INDEX IF NOT EXISTS idx_changes_requester_id ON changes(requester_id);
CREATE INDEX IF NOT EXISTS idx_changes_assignee_id ON changes(assignee_id);
CREATE INDEX IF NOT EXISTS idx_changes_scheduled_start ON changes(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_owner_id ON assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);

CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create functions for automatic change number generation
CREATE OR REPLACE FUNCTION generate_change_number()
RETURNS text AS $$
DECLARE
    next_num integer;
    change_num text;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(change_number FROM 'CHG(\d+)') AS integer)), 0) + 1
    INTO next_num
    FROM changes
    WHERE change_number ~ '^CHG\d+$';
    
    change_num := 'CHG' || LPAD(next_num::text, 6, '0');
    RETURN change_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate change numbers
CREATE OR REPLACE FUNCTION set_change_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.change_number IS NULL OR NEW.change_number = '' THEN
        NEW.change_number := generate_change_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_change_number
    BEFORE INSERT ON changes
    FOR EACH ROW
    EXECUTE FUNCTION set_change_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER trigger_update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_changes_updated_at
    BEFORE UPDATE ON changes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_knowledge_articles_updated_at
    BEFORE UPDATE ON knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
