-- Seed script to populate the BSM database with sample data for testing
-- This script creates realistic test data for all major entities

-- Insert sample organizations
INSERT INTO organizations (id, name, domain, status, tier, health_score) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'acme.com', 'active', 'enterprise', 95),
('550e8400-e29b-41d4-a716-446655440002', 'TechStart Inc', 'techstart.io', 'active', 'premium', 88),
('550e8400-e29b-41d4-a716-446655440003', 'Global Systems', 'globalsys.com', 'active', 'standard', 92);

-- Insert sample departments
INSERT INTO departments (id, organization_id, name, description) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Information Technology', 'IT operations and support'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Engineering', 'Software development and engineering'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Marketing', 'Marketing and communications'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Sales', 'Sales and business development'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Finance', 'Finance and accounting'),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Operations', 'Business operations'),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Development', 'Software development'),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Support', 'Customer support');

-- Insert sample user profiles
INSERT INTO profiles (id, email, first_name, last_name, display_name, role, department_id, organization_id, is_active) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'john.smith@acme.com', 'John', 'Smith', 'John Smith', 'admin', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', true),
('750e8400-e29b-41d4-a716-446655440002', 'sarah.wilson@acme.com', 'Sarah', 'Wilson', 'Sarah Wilson', 'agent', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', true),
('750e8400-e29b-41d4-a716-446655440003', 'mike.chen@acme.com', 'Mike', 'Chen', 'Mike Chen', 'agent', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', true),
('750e8400-e29b-41d4-a716-446655440004', 'lisa.anderson@acme.com', 'Lisa', 'Anderson', 'Lisa Anderson', 'manager', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', true),
('750e8400-e29b-41d4-a716-446655440005', 'robert.taylor@acme.com', 'Robert', 'Taylor', 'Robert Taylor', 'agent', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', true),
('750e8400-e29b-41d4-a716-446655440006', 'emma.davis@acme.com', 'Emma', 'Davis', 'Emma Davis', 'agent', '650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', true),
('750e8400-e29b-41d4-a716-446655440007', 'richard.jeffries@gmail.com', 'Richard', 'Jeffries', 'Richard Jeffries', 'user', null, '550e8400-e29b-41d4-a716-446655440001', true),
('750e8400-e29b-41d4-a716-446655440008', 'robert.eng@walmart.com', 'Robert', 'Eng', 'Robert Eng', 'user', null, '550e8400-e29b-41d4-a716-446655440002', true),
('750e8400-e29b-41d4-a716-446655440009', 'lebron.james@scale.com', 'Lebron', 'James', 'Lebron James', 'user', null, '550e8400-e29b-41d4-a716-446655440003', true),
('750e8400-e29b-41d4-a716-446655440010', 'brian.chesky@brex.com', 'Brian', 'Chesky', 'Brian Chesky', 'user', null, '550e8400-e29b-41d4-a716-446655440002', true);

-- Insert sample tickets
INSERT INTO tickets (
  id, ticket_number, title, description, type, category, subcategory, priority, urgency, impact, status,
  requester_id, assignee_id, organization_id, department_id, channel, created_at, due_date
) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'INC-2025-001', 'Inability to Save Changes in Profile Settings', 
 'I''ve encountered an issue where changes made to profile settings are not being saved properly. When I update my information and click save, the page refreshes but the changes are not reflected.', 
 'incident', 'IT Services', 'User Account', 'medium', 'medium', 'medium', 'new',
 '750e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'email',
 NOW() - INTERVAL '24 minutes', NOW() + INTERVAL '7 days'),

('850e8400-e29b-41d4-a716-446655440002', 'REQ-2025-001', 'Upcoming subscription renewal discussion',
 'Hi there, I wanted to discuss our upcoming subscription renewal. Can you help me review the renewal options and pricing for the next year?',
 'request', 'Billing', 'Subscription', 'low', 'low', 'low', 'new',
 '750e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440004', 'phone',
 NOW() - INTERVAL '29 minutes', NOW() + INTERVAL '5 days'),

('850e8400-e29b-41d4-a716-446655440003', 'REQ-2025-002', 'Dark Mode for the Dashboard',
 'I would love to see a dark mode option for the dashboard. It would make it easier on the eyes during long work sessions, especially in low-light environments.',
 'request', 'Feature Request', 'UI Enhancement', 'medium', 'low', 'medium', 'in_progress',
 '750e8400-e29b-41d4-a716-446655440009', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'web',
 NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '12 days'),

('850e8400-e29b-41d4-a716-446655440004', 'GEN-2025-001', 'Cancellation of Zendesk Subscription',
 'I hope this message finds you well. I am writing to request the cancellation of our Zendesk subscription. We have decided to move to a different platform.',
 'general_query', 'Billing', 'Cancellation', 'high', 'high', 'medium', 'in_progress',
 '750e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440004', 'email',
 NOW() - INTERVAL '33 minutes', NOW() + INTERVAL '3 days'),

('850e8400-e29b-41d4-a716-446655440005', 'PRB-2025-001', 'When is the Salesforce integration released?',
 'We''re facing some issues with our current setup and need to know when the Salesforce integration will be available. This is blocking several of our workflows.',
 'problem', 'Integration', 'Salesforce', 'high', 'high', 'high', 'under_investigation',
 '750e8400-e29b-41d4-a716-446655440010', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440007', 'web',
 NOW() - INTERVAL '1 hour', NOW() + INTERVAL '10 days'),

('850e8400-e29b-41d4-a716-446655440006', 'INC-2025-002', 'Issues with article publishing',
 'We''re facing some issues with articles and making their members visible. The publish button seems to be unresponsive and articles are not going live.',
 'incident', 'Content Management', 'Publishing', 'high', 'high', 'high', 'open',
 '750e8400-e29b-41d4-a716-446655440009', '750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'chat',
 NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '8 days');

-- Insert sample assets
INSERT INTO assets (
  id, asset_id, name, category, subcategory, hostname, ip_address, operating_system, cpu, memory, 
  status, criticality, location, owner_id, department_id, organization_id, serial_number, model, manufacturer
) VALUES
('950e8400-e29b-41d4-a716-446655440001', 'SRV-001', 'Web Server 01', 'Hardware', 'Server', 'web01.acme.com', '192.168.1.10', 'Ubuntu 20.04 LTS', 'Intel Xeon E5-2680', '32 GB',
 'active', 'high', 'Data Center A', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'WS001234', 'PowerEdge R740', 'Dell'),

('950e8400-e29b-41d4-a716-446655440002', 'SRV-002', 'Database Server', 'Hardware', 'Server', 'db01.acme.com', '192.168.1.20', 'Red Hat Enterprise Linux 8', 'Intel Xeon Gold 6248', '64 GB',
 'active', 'critical', 'Data Center A', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'DB001234', 'PowerEdge R750', 'Dell'),

('950e8400-e29b-41d4-a716-446655440003', 'WKS-001', 'Developer Workstation 1', 'Hardware', 'Workstation', 'dev-ws-001', '192.168.1.101', 'Windows 11 Pro', 'Intel Core i7-12700K', '32GB DDR4',
 'active', 'medium', 'Office Floor 2', '750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'WK001234', 'OptiPlex 7090', 'Dell'),

('950e8400-e29b-41d4-a716-446655440004', 'WKS-002', 'Designer Workstation', 'Hardware', 'Workstation', 'design-ws-002', '192.168.1.102', 'macOS Ventura', 'Apple M2 Pro', '64GB Unified',
 'active', 'high', 'Office Floor 3', '750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'MAC001234', 'Mac Studio', 'Apple'),

('950e8400-e29b-41d4-a716-446655440005', 'MOB-001', 'iPhone 14 Pro', 'Hardware', 'Mobile Device', 'iphone-001', '192.168.1.201', 'iOS 16.5', 'A16 Bionic', '256GB',
 'active', 'medium', 'Remote', '750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'IP001234', 'iPhone 14 Pro', 'Apple'),

('950e8400-e29b-41d4-a716-446655440006', 'CLD-001', 'Production Web Server', 'Cloud', 'Virtual Machine', 'prod-web-01', '10.0.1.10', 'Ubuntu 22.04 LTS', '4 vCPUs', '16GB',
 'active', 'critical', 'AWS us-east-1', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'AWS-VM-001', 't3.xlarge', 'Amazon'),

('950e8400-e29b-41d4-a716-446655440007', 'NET-001', 'Core Switch 01', 'Hardware', 'Network Equipment', 'switch-core-01', '192.168.1.1', 'Cisco IOS', 'Cisco ASIC', '2GB',
 'active', 'critical', 'Data Center A', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'CSW001234', 'Catalyst 9300', 'Cisco'),

('950e8400-e29b-41d4-a716-446655440008', 'STO-001', 'Primary Storage Array', 'Hardware', 'Storage', 'storage-01', '192.168.1.50', 'NetApp ONTAP', 'NetApp Controller', '128GB',
 'maintenance', 'critical', 'Data Center A', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'STO001234', 'FAS8300', 'NetApp');

-- Insert sample service requests
INSERT INTO service_requests (
  id, request_id, request_name, service_name, service_category, description, business_justification,
  requestor_id, requestor_name, department_id, organization_id, status, priority, urgency,
  request_date, expected_delivery
) VALUES
('a50e8400-e29b-41d4-a716-446655440001', 'SR-2025-001', 'MacBook Pro for New Developer', 'Laptop Request', 'IT Services',
 'Need MacBook Pro 16-inch for new senior developer starting next week. Required for development work and client meetings.',
 'Critical for onboarding new team member to meet project deadlines',
 '750e8400-e29b-41d4-a716-446655440003', 'Mike Chen', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001',
 'approved', 'high', 'high', NOW() - INTERVAL '1 day', NOW() + INTERVAL '5 days'),

('a50e8400-e29b-41d4-a716-446655440002', 'SR-2025-002', 'VPN Access for Remote Work', 'VPN Access', 'IT Services',
 'Need VPN access for working from home setup. Require secure connection to company resources.',
 'Remote work policy requires secure connection for data protection',
 '750e8400-e29b-41d4-a716-446655440002', 'Sarah Wilson', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001',
 'in_progress', 'medium', 'medium', NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day'),

('a50e8400-e29b-41d4-a716-446655440003', 'SR-2025-003', 'Employment Verification Letter', 'Employment Letter', 'HR Services',
 'Need employment verification for mortgage application. Require official letter with salary and employment details.',
 'Required by bank for home loan approval process',
 '750e8400-e29b-41d4-a716-446655440005', 'Robert Taylor', '650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001',
 'completed', 'low', 'low', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),

('a50e8400-e29b-41d4-a716-446655440004', 'SR-2025-004', 'Security Access Card Replacement', 'Access Request', 'Security Services',
 'Lost security access card, need immediate replacement to access secure areas and continue work.',
 'Cannot access secure areas without proper credentials, blocking daily work',
 '750e8400-e29b-41d4-a716-446655440004', 'Lisa Anderson', '650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001',
 'on_hold', 'high', 'high', NOW() - INTERVAL '3 days', NOW() + INTERVAL '2 days');

-- Insert sample knowledge base articles
INSERT INTO knowledge_base_articles (
  id, title, slug, content, excerpt, category_id, author_id, organization_id, status, featured, tags
) VALUES
('b50e8400-e29b-41d4-a716-446655440001', 'How to Reset Your Password', 'how-to-reset-password',
 'This guide will walk you through the steps to reset your password if you''ve forgotten it or need to change it for security reasons.

## Step 1: Navigate to Login Page
Go to the login page and click on "Forgot Password" link.

## Step 2: Enter Your Email
Enter the email address associated with your account.

## Step 3: Check Your Email
You will receive a password reset link in your email within 5 minutes.

## Step 4: Create New Password
Click the link in the email and create a new secure password.

## Tips for Secure Passwords
- Use at least 12 characters
- Include uppercase and lowercase letters
- Add numbers and special characters
- Avoid common words or personal information',
 'Learn how to reset your password quickly and securely',
 (SELECT id FROM knowledge_base_categories WHERE slug = 'getting-started' LIMIT 1),
 '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'published', true,
 ARRAY['password', 'security', 'login', 'account']),

('b50e8400-e29b-41d4-a716-446655440002', 'Troubleshooting Email Issues', 'troubleshooting-email-issues',
 'Common email problems and their solutions.

## Email Not Sending
1. Check your internet connection
2. Verify email server settings
3. Check if your mailbox is full
4. Contact IT support if issues persist

## Email Not Receiving
1. Check spam/junk folder
2. Verify sender is not blocked
3. Check email filters and rules
4. Ensure mailbox has sufficient storage

## Slow Email Performance
1. Clear email cache
2. Reduce number of emails in inbox
3. Check for large attachments
4. Restart email client

## Contact Support
If these steps don''t resolve your issue, please contact IT support with:
- Error messages (if any)
- When the problem started
- What you were doing when it occurred',
 'Solutions for common email problems and connectivity issues',
 (SELECT id FROM knowledge_base_categories WHERE slug = 'troubleshooting' LIMIT 1),
 '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'published', false,
 ARRAY['email', 'troubleshooting', 'connectivity', 'support']),

('b50e8400-e29b-41d4-a716-446655440003', 'VPN Setup Guide', 'vpn-setup-guide',
 'Complete guide to setting up VPN access for remote work.

## Prerequisites
- Approved VPN access request
- Company-issued device or approved personal device
- Stable internet connection

## Windows Setup
1. Download the VPN client from the IT portal
2. Install using administrator privileges
3. Enter your credentials when prompted
4. Connect to the company network

## macOS Setup
1. Open System Preferences > Network
2. Click the + button to add new connection
3. Select VPN as interface type
4. Enter server details provided by IT
5. Save and connect

## Mobile Setup
Download the company VPN app from:
- iOS: App Store
- Android: Google Play Store

## Troubleshooting
- Ensure firewall allows VPN traffic
- Check with IT if connection fails
- Verify credentials are correct
- Try different server locations if available

## Security Best Practices
- Always connect via VPN when working remotely
- Disconnect when not in use
- Never share VPN credentials
- Report any suspicious activity',
 'Step-by-step guide to set up VPN access for secure remote work',
 (SELECT id FROM knowledge_base_categories WHERE slug = 'how-to-guides' LIMIT 1),
 '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'published', true,
 ARRAY['vpn', 'remote-work', 'security', 'setup', 'guide']);

-- Insert sample ticket comments
INSERT INTO ticket_comments (ticket_id, author_id, content, is_internal, created_at) VALUES
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'Thank you for reporting this issue. I''ve assigned this to our development team for investigation.', false, NOW() - INTERVAL '20 minutes'),
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440007', 'I''ve tried clearing my browser cache as suggested, but the issue persists. The save button appears to work but changes don''t stick.', false, NOW() - INTERVAL '15 minutes'),
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'We''ve identified a potential database synchronization issue. Working on a fix now.', true, NOW() - INTERVAL '10 minutes'),

('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', 'Great suggestion! We''ve added this to our UI enhancement backlog. I''ll keep you updated on progress.', false, NOW() - INTERVAL '12 minutes'),
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440009', 'Awesome! Would it be possible to also include a system-wide dark mode that affects all pages?', false, NOW() - INTERVAL '8 minutes');

-- Update department manager references now that profiles exist
UPDATE departments SET manager_id = '750e8400-e29b-41d4-a716-446655440001' WHERE name = 'Information Technology';
UPDATE departments SET manager_id = '750e8400-e29b-41d4-a716-446655440003' WHERE name = 'Engineering';
UPDATE departments SET manager_id = '750e8400-e29b-41d4-a716-446655440004' WHERE name = 'Marketing';

-- Insert organization memberships
INSERT INTO organization_members (organization_id, user_id, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'admin'),
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', 'agent'),
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', 'agent'),
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440004', 'manager'),
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440005', 'agent'),
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440006', 'agent'),
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440007', 'member'),
('550e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440008', 'member'),
('550e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440009', 'member'),
('550e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440010', 'member');

-- Create some sample workflows
INSERT INTO workflows (id, name, description, trigger_type, trigger_conditions, steps, organization_id, created_by) VALUES
('c50e8400-e29b-41d4-a716-446655440001', 'Auto-assign Critical Tickets', 'Automatically assign critical priority tickets to senior agents',
 'automatic', '{"priority": "critical"}',
 '[{"type": "assign", "assignee_role": "manager"}, {"type": "notify", "channels": ["email", "slack"]}]',
 '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001'),

('c50e8400-e29b-41d4-a716-446655440002', 'SLA Breach Escalation', 'Escalate tickets that are approaching SLA breach',
 'scheduled', '{"sla_threshold": "80%"}',
 '[{"type": "escalate", "escalate_to": "manager"}, {"type": "notify", "message": "SLA breach warning"}]',
 '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001');

COMMENT ON TABLE organizations IS 'Sample organizations for testing BSM functionality';
COMMENT ON TABLE profiles IS 'Sample user profiles with various roles and departments';
COMMENT ON TABLE tickets IS 'Sample tickets representing different types and statuses';
COMMENT ON TABLE assets IS 'Sample IT assets across different categories';
COMMENT ON TABLE service_requests IS 'Sample service requests in various states';
COMMENT ON TABLE knowledge_base_articles IS 'Sample knowledge base content for self-service';
