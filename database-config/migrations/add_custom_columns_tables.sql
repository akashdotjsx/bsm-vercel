-- Custom Column Definitions Migration
-- This migration adds support for custom columns stored in tickets.custom_fields JSONB column

-- Create custom_column_definitions table (metadata only)
CREATE TABLE IF NOT EXISTS public.custom_column_definitions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'multiselect')),
    options JSONB DEFAULT '[]'::jsonb,
    default_value TEXT,
    visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_column_definitions_organization_id ON public.custom_column_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_column_definitions_user_id ON public.custom_column_definitions(user_id);

-- Enable RLS
ALTER TABLE public.custom_column_definitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custom_column_definitions
CREATE POLICY "Users can view custom column definitions in their organization" ON public.custom_column_definitions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert custom column definitions in their organization" ON public.custom_column_definitions
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        ) AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own custom column definitions" ON public.custom_column_definitions
    FOR UPDATE USING (
        user_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own custom column definitions" ON public.custom_column_definitions
    FOR DELETE USING (
        user_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );