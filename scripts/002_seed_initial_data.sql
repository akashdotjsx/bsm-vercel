-- Seed initial data for BSM system

-- Insert sample services
INSERT INTO services (name, description, category, subcategory, sla_response_time, sla_resolution_time, cost, approval_required) VALUES
('Email Support', 'Email account setup and troubleshooting', 'IT Services', 'Email & Communication', '4 hours', '24 hours', 50.00, false),
('Software Installation', 'Installation of approved software applications', 'IT Services', 'Software', '2 hours', '8 hours', 75.00, true),
('Hardware Request', 'Request for new hardware equipment', 'IT Services', 'Hardware', '1 day', '5 days', 500.00, true),
('Password Reset', 'Reset forgotten passwords', 'IT Services', 'Account Management', '30 minutes', '2 hours', 25.00, false),
('VPN Access', 'Setup VPN access for remote work', 'IT Services', 'Network', '2 hours', '4 hours', 100.00, true),
('Office Supplies', 'Request for office supplies and materials', 'General Services', 'Supplies', '1 day', '3 days', 30.00, false),
('Meeting Room Booking', 'Reserve meeting rooms and conference facilities', 'Facilities', 'Booking', '15 minutes', '30 minutes', 0.00, false),
('Parking Pass', 'Request for parking access', 'Facilities', 'Access', '1 day', '2 days', 50.00, true);

-- Insert sample assets
INSERT INTO assets (name, asset_tag, category, type, model, manufacturer, location, status, purchase_date, cost) VALUES
('Dell Laptop - Marketing', 'LAP001', 'IT Equipment', 'Laptop', 'Latitude 7420', 'Dell', 'Marketing Floor 2', 'active', '2023-01-15', 1200.00),
('HP Printer - Reception', 'PRT001', 'IT Equipment', 'Printer', 'LaserJet Pro 404n', 'HP', 'Reception Desk', 'active', '2023-02-20', 300.00),
('Conference Room TV', 'TV001', 'AV Equipment', 'Display', '55" Smart TV', 'Samsung', 'Conference Room A', 'active', '2023-03-10', 800.00),
('Network Switch - Floor 1', 'NET001', 'Network Equipment', 'Switch', 'Catalyst 2960', 'Cisco', 'Server Room', 'active', '2023-01-05', 500.00),
('Server - Database', 'SRV001', 'IT Equipment', 'Server', 'PowerEdge R740', 'Dell', 'Data Center', 'active', '2022-12-01', 5000.00);

-- Insert sample SLA definitions
INSERT INTO sla_definitions (name, priority, response_time, resolution_time, business_hours_only) VALUES
('Critical Priority SLA', 'critical', '15 minutes', '4 hours', false),
('High Priority SLA', 'high', '1 hour', '8 hours', true),
('Medium Priority SLA', 'medium', '4 hours', '24 hours', true),
('Low Priority SLA', 'low', '1 day', '5 days', true);

-- Insert sample knowledge articles
INSERT INTO knowledge_articles (title, content, summary, category, tags, status) VALUES
('How to Reset Your Password', 
'To reset your password, follow these steps:
1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your email for reset instructions
5. Follow the link in the email to create a new password

If you continue to have issues, please contact the IT helpdesk.',
'Step-by-step guide for password reset',
'Account Management',
ARRAY['password', 'reset', 'login', 'account'],
'published'),

('VPN Setup Guide',
'Setting up VPN access:
1. Download the VPN client from the company portal
2. Install the application
3. Use your company credentials to log in
4. Select the appropriate server location
5. Connect to establish secure access

For troubleshooting, ensure your firewall allows VPN traffic.',
'Complete guide for VPN setup and configuration',
'Network Access',
ARRAY['vpn', 'remote', 'access', 'security'],
'published'),

('Printer Troubleshooting',
'Common printer issues and solutions:
- Paper jams: Check for stuck paper in all compartments
- Print quality issues: Clean print heads and check ink levels
- Connection problems: Verify network connection and drivers
- Slow printing: Check print queue and restart print spooler

Contact IT if issues persist after trying these steps.',
'Solutions for common printer problems',
'Hardware Support',
ARRAY['printer', 'troubleshooting', 'hardware'],
'published');
