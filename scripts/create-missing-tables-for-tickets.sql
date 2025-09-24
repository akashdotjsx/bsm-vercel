-- Create missing tables for ticket tray functionality

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(id),
    team_lead_id UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Categories table
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6B7280',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Types table
CREATE TABLE IF NOT EXISTS service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    service_category_id UUID REFERENCES service_categories(id),
    sla_hours INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Priority Matrix table
CREATE TABLE IF NOT EXISTS priority_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    level INTEGER NOT NULL, -- 1=Low, 2=Medium, 3=High, 4=Urgent
    color TEXT DEFAULT '#6B7280',
    description TEXT,
    response_time_hours INTEGER,
    resolution_time_hours INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table (for organizations/companies)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    industry TEXT,
    account_status_id UUID,
    primary_contact_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account Status table
CREATE TABLE IF NOT EXISTS account_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table (for people within accounts)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    title TEXT,
    department TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE accounts ADD CONSTRAINT fk_accounts_status 
    FOREIGN KEY (account_status_id) REFERENCES account_status(id);
    
ALTER TABLE accounts ADD CONSTRAINT fk_accounts_primary_contact 
    FOREIGN KEY (primary_contact_id) REFERENCES contacts(id);

-- Insert default data
INSERT INTO service_categories (name, description, icon, color) VALUES
    ('Hardware', 'Hardware-related services and support', 'HardDrive', '#EF4444'),
    ('Software', 'Software applications and licensing', 'Code', '#3B82F6'),
    ('Network', 'Network infrastructure and connectivity', 'Wifi', '#10B981'),
    ('Security', 'Security and access management', 'Shield', '#F59E0B'),
    ('General', 'General IT support and services', 'HelpCircle', '#6B7280')
ON CONFLICT DO NOTHING;

INSERT INTO service_types (name, description, service_category_id, sla_hours) VALUES
    ('Incident', 'Unplanned interruption or reduction in quality of service', 
     (SELECT id FROM service_categories WHERE name = 'General'), 4),
    ('Request', 'Formal request for something new or change to existing service', 
     (SELECT id FROM service_categories WHERE name = 'General'), 24),
    ('Problem', 'Root cause of one or more incidents', 
     (SELECT id FROM service_categories WHERE name = 'General'), 72),
    ('Change', 'Addition, modification or removal of service components', 
     (SELECT id FROM service_categories WHERE name = 'General'), 168)
ON CONFLICT DO NOTHING;

INSERT INTO priority_matrix (name, level, color, description, response_time_hours, resolution_time_hours) VALUES
    ('Low', 1, '#10B981', 'Low impact, can be scheduled', 48, 168),
    ('Medium', 2, '#F59E0B', 'Moderate impact, normal priority', 24, 72),
    ('High', 3, '#EF4444', 'High impact, urgent attention needed', 4, 24),
    ('Urgent', 4, '#DC2626', 'Critical impact, immediate attention required', 1, 8)
ON CONFLICT DO NOTHING;

INSERT INTO teams (name, description) VALUES
    ('IT Support', 'General IT support and helpdesk services'),
    ('Development', 'Software development and engineering'),
    ('Security', 'Information security and compliance'),
    ('Infrastructure', 'Network and system infrastructure'),
    ('Database', 'Database administration and management')
ON CONFLICT DO NOTHING;

INSERT INTO account_status (name, color, description) VALUES
    ('Active', '#10B981', 'Account is active and in good standing'),
    ('Inactive', '#6B7280', 'Account is temporarily inactive'),
    ('Suspended', '#EF4444', 'Account is suspended due to issues'),
    ('Pending', '#F59E0B', 'Account setup is pending completion')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_department ON teams(department_id);
CREATE INDEX IF NOT EXISTS idx_service_types_category ON service_types(service_category_id);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(account_status_id);
CREATE INDEX IF NOT EXISTS idx_priority_matrix_level ON priority_matrix(level);
