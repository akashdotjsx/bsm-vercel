-- Create service catalog table
CREATE TABLE IF NOT EXISTS public.service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL CHECK (department IN ('IT', 'HR', 'Finance', 'Legal', 'Facilities', 'Admin', 'Security', 'Procurement')),
  category TEXT NOT NULL,
  subcategory TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  sla_hours INTEGER,
  approval_required BOOLEAN DEFAULT false,
  form_fields JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for service catalog
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view active services
CREATE POLICY "service_catalog_select_active" ON public.service_catalog FOR SELECT USING (is_active = true);

-- Allow admins to manage service catalog
CREATE POLICY "service_catalog_admin_all" ON public.service_catalog FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create assets table (CMDB-lite)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hardware', 'software', 'service', 'facility')),
  category TEXT,
  model TEXT,
  serial_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
  owner_id UUID REFERENCES public.profiles(id),
  location TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  vendor TEXT,
  cost DECIMAL(10,2),
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Allow users to view assets they own or admins to view all
CREATE POLICY "assets_select_owner_or_admin" ON public.assets FOR SELECT USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Create asset dependencies table for service mapping
CREATE TABLE IF NOT EXISTS public.asset_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  child_asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'depends_on' CHECK (dependency_type IN ('depends_on', 'supports', 'connects_to')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_asset_id, child_asset_id)
);

-- Create SLA policies table
CREATE TABLE IF NOT EXISTS public.sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  response_time_hours INTEGER NOT NULL,
  resolution_time_hours INTEGER NOT NULL,
  business_hours_only BOOLEAN DEFAULT true,
  escalation_rules JSONB,
  applies_to JSONB, -- conditions for when this SLA applies
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for SLA policies
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view active SLA policies
CREATE POLICY "sla_policies_select_active" ON public.sla_policies FOR SELECT USING (is_active = true);
