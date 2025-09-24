-- Insert default departments if they don't exist
INSERT INTO departments (name, description) VALUES
('Information Technology', 'IT infrastructure, support, and technology services'),
('Human Resources', 'Employee relations, recruitment, and HR services'),
('Finance', 'Financial planning, analysis, and accounting'),
('Customer Support', 'Customer service and technical support'),
('Marketing', 'Marketing campaigns, branding, and communications'),
('Sales', 'Sales operations and customer acquisition'),
('Operations', 'Business operations and process management')
ON CONFLICT (name) DO NOTHING;
