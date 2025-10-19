-- Custom Columns Tables Migration
-- This migration adds support for custom columns in tickets

-- Create custom_columns table
CREATE TABLE IF NOT EXISTS public.custom_columns (
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

-- Create custom_column_values table for storing actual values
CREATE TABLE IF NOT EXISTS public.custom_column_values (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES public.custom_columns(id) ON DELETE CASCADE,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticket_id, column_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_columns_organization_id ON public.custom_columns(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_columns_user_id ON public.custom_columns(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_column_values_ticket_id ON public.custom_column_values(ticket_id);
CREATE INDEX IF NOT EXISTS idx_custom_column_values_column_id ON public.custom_column_values(column_id);
CREATE INDEX IF NOT EXISTS idx_custom_column_values_organization_id ON public.custom_column_values(organization_id);

-- Enable RLS
ALTER TABLE public.custom_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_column_values ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custom_columns
CREATE POLICY "Users can view custom columns in their organization" ON public.custom_columns
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert custom columns in their organization" ON public.custom_columns
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        ) AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own custom columns" ON public.custom_columns
    FOR UPDATE USING (
        user_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own custom columns" ON public.custom_columns
    FOR DELETE USING (
        user_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Create RLS policies for custom_column_values
CREATE POLICY "Users can view custom column values in their organization" ON public.custom_column_values
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert custom column values in their organization" ON public.custom_column_values
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update custom column values in their organization" ON public.custom_column_values
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete custom column values in their organization" ON public.custom_column_values
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );
