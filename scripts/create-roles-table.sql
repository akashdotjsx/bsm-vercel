-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('System Administrator', 'Full system access and administration', '["admin", "user_management", "system_config"]'),
('IT Administrator', 'IT infrastructure and support management', '["it_admin", "asset_management", "user_support"]'),
('HR Manager', 'Human resources and employee management', '["hr_admin", "user_management", "reporting"]'),
('Finance Analyst', 'Financial analysis and reporting', '["finance", "reporting", "asset_tracking"]'),
('Service Agent', 'Customer service and support', '["service_desk", "ticket_management"]'),
('Marketing Manager', 'Marketing campaigns and content management', '["marketing", "content_management"]'),
('Sales Representative', 'Sales activities and customer relations', '["sales", "customer_management"]'),
('Operations Manager', 'Operations oversight and process management', '["operations", "process_management", "reporting"]')
ON CONFLICT (name) DO NOTHING;
