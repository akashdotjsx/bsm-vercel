-- Drop existing roles table if it exists to start fresh
DROP TABLE IF EXISTS public.roles CASCADE;

-- Create roles table with proper structure
CREATE TABLE public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    color TEXT DEFAULT 'blue',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the name column for faster lookups
CREATE INDEX idx_roles_name ON public.roles(name);

-- Insert the roles that are actually used across the application
INSERT INTO public.roles (name, description, permissions, color) VALUES
    ('System Administrator', 'Full system access and administration', '{"dashboard": "Full Access", "service_catalog": "Full Access", "incident_management": "Full Access", "change_management": "Full Access", "asset_management": "Full Access", "knowledge_base": "Full Access", "analytics_reports": "Full Access", "user_management": "Full Access", "workflow_builder": "Full Access", "sla_management": "Full Access", "integrations": "Full Access", "security_access": "Full Access", "system_settings": "Full Access"}'::jsonb, 'red'),
    ('Admin', 'Administrative access with most permissions', '{"dashboard": "Full Access", "service_catalog": "Full Access", "incident_management": "Full Access", "change_management": "Can Edit", "asset_management": "Full Access", "knowledge_base": "Full Access", "analytics_reports": "Full Access", "user_management": "Can Edit", "workflow_builder": "Can Edit", "sla_management": "Can Edit", "integrations": "Can View", "security_access": "Can View", "system_settings": "Can View"}'::jsonb, 'blue'),
    ('IT Manager', 'IT management and infrastructure oversight', '{"dashboard": "Full Access", "service_catalog": "Can Edit", "incident_management": "Full Access", "change_management": "Can Edit", "asset_management": "Full Access", "knowledge_base": "Can Edit", "analytics_reports": "Can Edit", "user_management": "Can View", "workflow_builder": "Can Edit", "sla_management": "Can Edit", "integrations": "Can View", "security_access": "Can View", "system_settings": "Can View"}'::jsonb, 'purple'),
    ('HR Manager', 'Human resources and employee management', '{"dashboard": "Can View", "service_catalog": "Can View", "incident_management": "Can View", "change_management": "Can View", "asset_management": "Can View", "knowledge_base": "Can Edit", "analytics_reports": "Can View", "user_management": "Full Access", "workflow_builder": "Can View", "sla_management": "Can View", "integrations": "Can View", "security_access": "Can View", "system_settings": "Can View"}'::jsonb, 'green'),
    ('Team Lead', 'Team leadership and coordination', '{"dashboard": "Can View", "service_catalog": "Can View", "incident_management": "Can Edit", "change_management": "Can View", "asset_management": "Can View", "knowledge_base": "Can Edit", "analytics_reports": "Can View", "user_management": "Can View", "workflow_builder": "Can View", "sla_management": "Can View", "integrations": "Can View", "security_access": "Can View", "system_settings": "Can View"}'::jsonb, 'yellow'),
    ('Service Agent', 'Customer service and support representative', '{"dashboard": "Can View", "service_catalog": "Can View", "incident_management": "Can Edit", "change_management": "Can View", "asset_management": "Can View", "knowledge_base": "Can View", "analytics_reports": "Can View", "user_management": "Can View", "workflow_builder": "Can View", "sla_management": "Can View", "integrations": "Can View", "security_access": "Can View", "system_settings": "Can View"}'::jsonb, 'orange'),
    ('Department Manager', 'Department-level management and oversight', '{"dashboard": "Can View", "service_catalog": "Can View", "incident_management": "Can Edit", "change_management": "Can View", "asset_management": "Can View", "knowledge_base": "Can Edit", "analytics_reports": "Can Edit", "user_management": "Can View", "workflow_builder": "Can View", "sla_management": "Can View", "integrations": "Can View", "security_access": "Can View", "system_settings": "Can View"}'::jsonb, 'indigo'),
    ('Employee', 'Standard employee access', '{"dashboard": "Can View", "service_catalog": "Can View", "incident_management": "Can View", "change_management": "Can View", "asset_management": "Can View", "knowledge_base": "Can View", "analytics_reports": "Can View", "user_management": "Can View", "workflow_builder": "Can View", "sla_management": "Can View", "integrations": "Can View", "security_access": "Can View", "system_settings": "Can View"}'::jsonb, 'gray'),
    ('End User', 'Basic end user access', '{"dashboard": "Can View", "service_catalog": "Can View", "incident_management": "Can View", "change_management": "Can View", "asset_management": "Can View", "knowledge_base": "Can View", "analytics_reports": "Can View", "user_management": "Can View", "workflow_builder": "Can View", "sla_management": "Can View", "integrations": "Can View", "security_access": "Can View", "system_settings": "Can View"}'::jsonb, 'slate');

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON public.roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
