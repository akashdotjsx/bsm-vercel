-- Create asset_types table
CREATE TABLE IF NOT EXISTS public.asset_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    icon TEXT,
    color TEXT DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_tag TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    asset_type_id UUID REFERENCES public.asset_types(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    location TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    organization_id UUID REFERENCES public.organizations(id),
    purchase_date DATE,
    warranty_expiry DATE,
    purchase_cost DECIMAL(10,2),
    current_value DECIMAL(10,2),
    serial_number TEXT,
    model TEXT,
    manufacturer TEXT,
    specifications JSONB,
    maintenance_schedule JSONB,
    last_maintenance DATE,
    next_maintenance DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for asset_types
CREATE POLICY "asset_types_select_policy" ON public.asset_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "asset_types_insert_policy" ON public.asset_types
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "asset_types_update_policy" ON public.asset_types
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "asset_types_delete_policy" ON public.asset_types
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for assets
CREATE POLICY "assets_select_policy" ON public.assets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "assets_insert_policy" ON public.assets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "assets_update_policy" ON public.assets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "assets_delete_policy" ON public.assets
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample asset types
INSERT INTO public.asset_types (name, description, category, icon, color) VALUES
    ('Laptop', 'Portable computers for employees', 'Hardware', 'laptop', '#3b82f6'),
    ('Desktop', 'Desktop computers and workstations', 'Hardware', 'monitor', '#10b981'),
    ('Server', 'Physical and virtual servers', 'Infrastructure', 'server', '#f59e0b'),
    ('Network Equipment', 'Routers, switches, and network devices', 'Infrastructure', 'network', '#7c3aed'),
    ('Mobile Device', 'Smartphones and tablets', 'Hardware', 'smartphone', '#ef4444'),
    ('Software License', 'Software applications and licenses', 'Software', 'code', '#06b6d4'),
    ('Printer', 'Printers and scanning equipment', 'Hardware', 'printer', '#84cc16'),
    ('Monitor', 'Display monitors and screens', 'Hardware', 'monitor', '#f97316')
ON CONFLICT DO NOTHING;

-- Insert sample assets
INSERT INTO public.assets (asset_tag, name, description, asset_type_id, status, location, serial_number, model, manufacturer, purchase_cost, current_value) 
SELECT 
    'LT-' || LPAD((ROW_NUMBER() OVER())::TEXT, 4, '0'),
    'Laptop ' || ROW_NUMBER() OVER(),
    'Employee laptop computer',
    (SELECT id FROM public.asset_types WHERE name = 'Laptop' LIMIT 1),
    CASE WHEN RANDOM() < 0.8 THEN 'active' ELSE 'maintenance' END,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'Office Floor 1'
        WHEN RANDOM() < 0.6 THEN 'Office Floor 2'
        ELSE 'Remote'
    END,
    'SN' || LPAD((ROW_NUMBER() OVER())::TEXT, 8, '0'),
    CASE 
        WHEN RANDOM() < 0.4 THEN 'ThinkPad X1'
        WHEN RANDOM() < 0.7 THEN 'MacBook Pro'
        ELSE 'Dell XPS'
    END,
    CASE 
        WHEN RANDOM() < 0.4 THEN 'Lenovo'
        WHEN RANDOM() < 0.7 THEN 'Apple'
        ELSE 'Dell'
    END,
    1200.00 + (RANDOM() * 800)::DECIMAL(10,2),
    800.00 + (RANDOM() * 400)::DECIMAL(10,2)
FROM generate_series(1, 25);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_asset_type_id ON public.assets(asset_type_id);
CREATE INDEX IF NOT EXISTS idx_assets_assigned_to ON public.assets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assets_organization_id ON public.assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_asset_tag ON public.assets(asset_tag);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_asset_types_updated_at BEFORE UPDATE ON public.asset_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
