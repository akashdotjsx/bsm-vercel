-- Migration to remove 'select' and 'multiselect' from custom column types
-- This migration updates the CHECK constraint to only allow 'text', 'number', and 'date' types

-- First, update any existing columns with 'select' or 'multiselect' types to 'text'
UPDATE public.custom_column_definitions 
SET type = 'text' 
WHERE type IN ('select', 'multiselect');

-- Drop the existing CHECK constraint
ALTER TABLE public.custom_column_definitions 
DROP CONSTRAINT IF EXISTS custom_column_definitions_type_check;

-- Add the new CHECK constraint with only allowed types
ALTER TABLE public.custom_column_definitions 
ADD CONSTRAINT custom_column_definitions_type_check 
CHECK (type IN ('text', 'number', 'date'));
