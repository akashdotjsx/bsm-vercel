-- Create asset_types table
CREATE TABLE IF NOT EXISTS public.asset_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT DEFAULT 'Server',
    color TEXT DEFAULT 'bg-blue-500',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id TEXT UNIQUE NOT NULL DEFAULT 'AST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    name TEXT NOT NULL,
    hostname TEXT,
    ip_address INET,
    operating_system TEXT,
    cpu TEXT,
    memory TEXT,
    owner_id UUID REFERENCES public.profiles(id),
    category TEXT NOT NULL,
    subcategory TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive', 'retired', 'disposed')),
    criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('critical', 'high', 'medium', 'low')),
    location TEXT,
    serial_number TEXT,
    model TEXT,
    manufacturer TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    cost DECIMAL(10,2),
    vendor TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create departments table (referenced in the assets page)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default asset types
INSERT INTO public.asset_types (name, category, icon, color) VALUES
    ('Servers', 'server', 'Server', 'bg-blue-500'),
    ('Workstations', 'workstation', 'Monitor', 'bg-green-500'),
    ('Laptops', 'laptop', 'Monitor', 'bg-purple-500'),
    ('Mobile Devices', 'mobile', 'Smartphone', 'bg-orange-500'),
    ('Network Equipment', 'network', 'Wifi', 'bg-cyan-500'),
    ('Storage', 'storage', 'HardDrive', 'bg-yellow-500'),
    ('Software', 'software', 'Package', 'bg-pink-500'),
    ('Cloud Services', 'cloud', 'Cloud', 'bg-indigo-500'),
    ('Databases', 'database', 'Database', 'bg-red-500')
ON CONFLICT DO NOTHING;

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
    ('IT', 'Information Technology Department'),
    ('HR', 'Human Resources Department'),
    ('Finance', 'Finance Department'),
    ('Operations', 'Operations Department'),
    ('Marketing', 'Marketing Department'),
    ('Sales', 'Sales Department')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_criticality ON public.assets(criticality);
CREATE INDEX IF NOT EXISTS idx_assets_owner_id ON public.assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at);

-- Enable Row Level Security
ALTER TABLE public.asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now - should be restricted based on user roles)
CREATE POLICY "Allow all operations on asset_types" ON public.asset_types FOR ALL USING (true);
CREATE POLICY "Allow all operations on assets" ON public.assets FOR ALL USING (true);
CREATE POLICY "Allow all operations on departments" ON public.departments FOR ALL USING (true);
