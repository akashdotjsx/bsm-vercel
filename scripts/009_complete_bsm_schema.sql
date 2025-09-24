-- Complete BSM Platform Database Schema
-- This script creates all necessary tables for the BSM platform functionality

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS ticket_attachments CASCADE;
DROP TABLE IF EXISTS ticket_history CASCADE;
DROP TABLE IF EXISTS workflow_executions CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS knowledge_base_articles CASCADE;
DROP TABLE IF EXISTS knowledge_base_categories CASCADE;
DROP TABLE IF EXISTS asset_assignments CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS asset_types CASCADE;
DROP TABLE IF EXISTS sla_policies CASCADE;
DROP TABLE IF EXISTS escalation_rules CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    tier TEXT DEFAULT 'standard' CHECK (tier IN ('basic', 'standard', 'premium', 'enterprise')),
    health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    manager_id UUID, -- Will reference profiles(id) after profiles table is created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (enhanced)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'agent', 'user')),
    department_id UUID REFERENCES departments(id),
    organization_id UUID REFERENCES organizations(id),
    timezone TEXT DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for department manager
ALTER TABLE departments ADD CONSTRAINT fk_department_manager 
    FOREIGN KEY (manager_id) REFERENCES profiles(id);

-- Organization members table
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'agent', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Asset types table
CREATE TABLE asset_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Hardware', 'Software', 'Network', 'Cloud', etc.
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table (comprehensive)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id TEXT UNIQUE NOT NULL, -- Human readable ID like AST-001
    name TEXT NOT NULL,
    asset_type_id UUID REFERENCES asset_types(id),
    category TEXT NOT NULL,
    subcategory TEXT,
    hostname TEXT,
    ip_address INET,
    mac_address MACADDR,
    serial_number TEXT,
    model TEXT,
    manufacturer TEXT,
    operating_system TEXT,
    cpu TEXT,
    memory TEXT,
    storage TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired', 'disposed')),
    criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('critical', 'high', 'medium', 'low')),
    location TEXT,
    owner_id UUID REFERENCES profiles(id),
    department_id UUID REFERENCES departments(id),
    organization_id UUID REFERENCES organizations(id),
    purchase_date DATE,
    warranty_expiry DATE,
    cost DECIMAL(10,2),
    vendor TEXT,
    notes TEXT,
    metadata JSONB, -- For flexible additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset assignments table
CREATE TABLE asset_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    returned_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true
);

-- SLA policies table
CREATE TABLE sla_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    response_time_minutes INTEGER NOT NULL,
    resolution_time_minutes INTEGER NOT NULL,
    escalation_time_minutes INTEGER,
    business_hours_only BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'incident' CHECK (type IN ('incident', 'request', 'problem', 'change', 'general_query')),
    category TEXT,
    subcategory TEXT,
    item TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('high', 'medium', 'low')),
    impact TEXT DEFAULT 'medium' CHECK (impact IN ('high', 'medium', 'low')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'open', 'in_progress', 'pending_approval', 'under_investigation', 'scheduled', 'resolved', 'closed', 'cancelled', 'on_hold')),
    severity TEXT CHECK (severity IN ('critical', 'major', 'minor', 'cosmetic')),
    
    -- Relationships
    requester_id UUID REFERENCES profiles(id),
    assignee_id UUID REFERENCES profiles(id),
    organization_id UUID REFERENCES organizations(id),
    department_id UUID REFERENCES departments(id),
    parent_ticket_id UUID REFERENCES tickets(id),
    sla_policy_id UUID REFERENCES sla_policies(id),
    
    -- Business context
    business_impact TEXT,
    affected_services TEXT[],
    workaround TEXT,
    root_cause TEXT,
    resolution_summary TEXT,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- SLA tracking
    sla_breached BOOLEAN DEFAULT false,
    first_response_at TIMESTAMP WITH TIME ZONE,
    
    -- Communication
    channel TEXT DEFAULT 'web' CHECK (channel IN ('web', 'email', 'phone', 'chat', 'api')),
    
    -- AI and automation
    ai_confidence NUMERIC(3,2),
    escalation_level INTEGER DEFAULT 0,
    
    -- Additional metadata
    tags TEXT[],
    custom_fields JSONB,
    
    CONSTRAINT valid_priority_urgency_impact CHECK (
        priority IN ('critical', 'high', 'medium', 'low') AND
        urgency IN ('high', 'medium', 'low') AND
        impact IN ('high', 'medium', 'low')
    )
);

-- Ticket comments table
CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket attachments table
CREATE TABLE ticket_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    file_path TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket history table for audit trail
CREATE TABLE ticket_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES profiles(id),
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_type TEXT DEFAULT 'update' CHECK (change_type IN ('create', 'update', 'delete', 'comment', 'assignment')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base categories
CREATE TABLE knowledge_base_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES knowledge_base_categories(id),
    organization_id UUID REFERENCES organizations(id),
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base articles
CREATE TABLE knowledge_base_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category_id UUID REFERENCES knowledge_base_categories(id),
    author_id UUID REFERENCES profiles(id),
    organization_id UUID REFERENCES organizations(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'automatic', 'scheduled', 'webhook')),
    trigger_conditions JSONB,
    steps JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions table
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id),
    status TEXT DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    current_step INTEGER DEFAULT 0,
    execution_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Service requests table (enhanced)
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id TEXT UNIQUE NOT NULL,
    request_name TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_category TEXT NOT NULL,
    description TEXT NOT NULL,
    business_justification TEXT,
    additional_requirements TEXT,
    
    -- Request details
    requestor_id UUID REFERENCES profiles(id),
    requestor_name TEXT, -- Denormalized for performance
    department_id UUID REFERENCES departments(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Approval workflow
    approver_id UUID REFERENCES profiles(id),
    approver_email TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and priority
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected', 'on_hold', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('high', 'medium', 'low')),
    
    -- Financial
    cost_center TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    
    -- Timing
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_delivery DATE,
    actual_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escalation rules table
CREATE TABLE escalation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    severity_level TEXT CHECK (severity_level IN ('critical', 'high', 'medium', 'low')),
    time_threshold_minutes INTEGER NOT NULL,
    escalate_to_role TEXT,
    escalate_to_user_id UUID REFERENCES profiles(id),
    notification_channels TEXT[] DEFAULT ARRAY['email'],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX idx_tickets_requester ON tickets(requester_id);
CREATE INDEX idx_tickets_organization ON tickets(organization_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_due_date ON tickets(due_date);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE INDEX idx_assets_asset_id ON assets(asset_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_owner ON assets(owner_id);
CREATE INDEX idx_assets_organization ON assets(organization_id);

CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_requestor ON service_requests(requestor_id);
CREATE INDEX idx_service_requests_organization ON service_requests(organization_id);

CREATE INDEX idx_kb_articles_category ON knowledge_base_articles(category_id);
CREATE INDEX idx_kb_articles_status ON knowledge_base_articles(status);
CREATE INDEX idx_kb_articles_organization ON knowledge_base_articles(organization_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kb_articles_updated_at BEFORE UPDATE ON knowledge_base_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default asset types
INSERT INTO asset_types (name, category, icon, color) VALUES
('Server', 'Hardware', 'server', 'bg-blue-500'),
('Workstation', 'Hardware', 'monitor', 'bg-green-500'),
('Laptop', 'Hardware', 'laptop', 'bg-purple-500'),
('Mobile Device', 'Hardware', 'smartphone', 'bg-pink-500'),
('Network Equipment', 'Hardware', 'wifi', 'bg-orange-500'),
('Storage', 'Hardware', 'hard-drive', 'bg-yellow-500'),
('Software Application', 'Software', 'package', 'bg-indigo-500'),
('Cloud Resource', 'Cloud', 'cloud', 'bg-cyan-500'),
('Database', 'Software', 'database', 'bg-red-500'),
('Virtual Machine', 'Virtual', 'cpu', 'bg-teal-500');

-- Insert default SLA policies
INSERT INTO sla_policies (name, priority, response_time_minutes, resolution_time_minutes, escalation_time_minutes) VALUES
('Critical Priority SLA', 'critical', 15, 240, 60),
('High Priority SLA', 'high', 60, 480, 120),
('Medium Priority SLA', 'medium', 240, 1440, 480),
('Low Priority SLA', 'low', 480, 2880, 960);

-- Insert default knowledge base categories
INSERT INTO knowledge_base_categories (name, slug, description, icon, color) VALUES
('Getting Started', 'getting-started', 'Basic guides and tutorials', 'play-circle', 'bg-green-500'),
('Troubleshooting', 'troubleshooting', 'Common issues and solutions', 'wrench', 'bg-red-500'),
('How-to Guides', 'how-to-guides', 'Step-by-step instructions', 'book-open', 'bg-blue-500'),
('FAQ', 'faq', 'Frequently asked questions', 'help-circle', 'bg-yellow-500'),
('Policies', 'policies', 'Company policies and procedures', 'shield', 'bg-purple-500'),
('IT Services', 'it-services', 'Information about IT services', 'monitor', 'bg-indigo-500');

COMMENT ON TABLE organizations IS 'Organizations using the BSM platform';
COMMENT ON TABLE profiles IS 'User profiles with enhanced fields for BSM functionality';
COMMENT ON TABLE tickets IS 'Comprehensive ticket management with full ITSM capabilities';
COMMENT ON TABLE assets IS 'Complete asset management with detailed tracking';
COMMENT ON TABLE service_requests IS 'Service catalog requests with approval workflow';
COMMENT ON TABLE knowledge_base_articles IS 'Knowledge base for self-service and documentation';
COMMENT ON TABLE workflows IS 'Automated workflows for ticket processing';
