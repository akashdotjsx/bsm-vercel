-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to update updated_at column
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

-- Insert default roles
INSERT INTO public.roles (name, description, permissions) VALUES
('Admin', 'Full system access with all permissions', '["all"]'::jsonb),
('Manager', 'Management level access with team oversight', '["manage_team", "view_reports", "approve_requests"]'::jsonb),
('Team Lead', 'Team leadership with limited management functions', '["manage_team", "view_reports"]'::jsonb),
('Senior Analyst', 'Senior level analyst with advanced permissions', '["create_reports", "manage_tickets", "view_analytics"]'::jsonb),
('Analyst', 'Standard analyst role with basic permissions', '["manage_tickets", "view_reports"]'::jsonb),
('Support Specialist', 'Customer support specialist role', '["manage_tickets", "view_customers"]'::jsonb),
('Developer', 'Software developer with technical access', '["manage_code", "deploy_apps", "view_logs"]'::jsonb),
('User', 'Basic user role with limited permissions', '["view_dashboard", "create_tickets"]'::jsonb)
ON CONFLICT (name) DO NOTHING;
