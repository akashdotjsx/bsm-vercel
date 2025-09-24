-- Create roles table with proper structure
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the name column for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- Insert default roles
INSERT INTO public.roles (name, description, permissions) VALUES
    ('Super Admin', 'Full system access with all permissions', '["all"]'::jsonb),
    ('Admin', 'Administrative access with most permissions', '["user_management", "system_settings", "reports"]'::jsonb),
    ('Manager', 'Management level access', '["team_management", "reports", "approve_requests"]'::jsonb),
    ('Team Lead', 'Team leadership responsibilities', '["team_coordination", "task_assignment"]'::jsonb),
    ('Senior Analyst', 'Senior level analyst with advanced permissions', '["advanced_analysis", "data_export"]'::jsonb),
    ('Analyst', 'Standard analyst role', '["basic_analysis", "data_view"]'::jsonb),
    ('Support Agent', 'Customer support representative', '["ticket_management", "customer_interaction"]'::jsonb),
    ('User', 'Basic user access', '["basic_access"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

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
