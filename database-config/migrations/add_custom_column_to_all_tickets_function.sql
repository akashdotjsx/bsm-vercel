-- Custom Column Management Functions
-- These functions manage custom columns stored in tickets.custom_fields JSONB column

-- Function to add a custom column to all tickets in an organization
CREATE OR REPLACE FUNCTION public.add_custom_column_to_tickets(
  p_organization_id uuid,
  p_column_title text,
  p_column_type text,
  p_default_value text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count bigint := 0;
  default_json_value jsonb;
BEGIN
  -- Convert default value to appropriate JSON type based on column type
  CASE p_column_type
    WHEN 'number' THEN
      default_json_value := COALESCE(p_default_value::numeric, 0)::jsonb;
    WHEN 'date' THEN
      default_json_value := COALESCE(p_default_value::timestamp with time zone, now())::jsonb;
    WHEN 'select', 'multiselect' THEN
      default_json_value := COALESCE(p_default_value::jsonb, 'null'::jsonb);
    ELSE -- text
      default_json_value := COALESCE(p_default_value::text, '')::jsonb;
  END CASE;

  -- Update all tickets in the organization to include the new custom field
  UPDATE public.tickets 
  SET 
    custom_fields = COALESCE(custom_fields, '{}'::jsonb) || 
    jsonb_build_object(p_column_title, default_json_value),
    updated_at = now()
  WHERE organization_id = p_organization_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to remove a custom column from all tickets in an organization
CREATE OR REPLACE FUNCTION public.remove_custom_column_from_tickets(
  p_organization_id uuid,
  p_column_title text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count bigint := 0;
BEGIN
  -- Remove the custom field from all tickets in the organization
  UPDATE public.tickets 
  SET 
    custom_fields = custom_fields - p_column_title,
    updated_at = now()
  WHERE organization_id = p_organization_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to get custom column values for a specific ticket
CREATE OR REPLACE FUNCTION public.get_ticket_custom_fields(
  p_ticket_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT custom_fields INTO result
  FROM public.tickets
  WHERE id = p_ticket_id;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function to update a custom field value for a specific ticket
CREATE OR REPLACE FUNCTION public.update_ticket_custom_field(
  p_ticket_id uuid,
  p_field_name text,
  p_field_value jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.tickets 
  SET 
    custom_fields = COALESCE(custom_fields, '{}'::jsonb) || 
    jsonb_build_object(p_field_name, p_field_value),
    updated_at = now()
  WHERE id = p_ticket_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_custom_column_to_tickets(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_custom_column_from_tickets(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ticket_custom_fields(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ticket_custom_field(uuid, text, jsonb) TO authenticated;
