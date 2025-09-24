-- Added Postgres functions for complex operations
-- Function to get ticket statistics
CREATE OR REPLACE FUNCTION get_ticket_statistics(user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_tickets', COUNT(*),
    'open_tickets', COUNT(*) FILTER (WHERE status = 'open'),
    'in_progress_tickets', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'closed_tickets', COUNT(*) FILTER (WHERE status = 'closed'),
    'urgent_tickets', COUNT(*) FILTER (WHERE priority = 'urgent'),
    'high_tickets', COUNT(*) FILTER (WHERE priority = 'high'),
    'medium_tickets', COUNT(*) FILTER (WHERE priority = 'medium'),
    'low_tickets', COUNT(*) FILTER (WHERE priority = 'low')
  ) INTO result
  FROM tickets
  WHERE (user_id IS NULL OR assignee_id = user_id);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to search tickets with full-text search
CREATE OR REPLACE FUNCTION search_tickets(
  search_term TEXT,
  user_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.created_at,
    ts_rank(
      to_tsvector('english', t.title || ' ' || t.description),
      plainto_tsquery('english', search_term)
    ) as rank
  FROM tickets t
  WHERE 
    (user_id IS NULL OR t.assignee_id = user_id)
    AND (
      to_tsvector('english', t.title || ' ' || t.description) @@ plainto_tsquery('english', search_term)
      OR t.title ILIKE '%' || search_term || '%'
      OR t.description ILIKE '%' || search_term || '%'
    )
  ORDER BY rank DESC, t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update ticket with audit trail
CREATE OR REPLACE FUNCTION update_ticket_with_audit(
  ticket_id UUID,
  updates JSON,
  updated_by UUID
)
RETURNS JSON AS $$
DECLARE
  old_ticket JSON;
  new_ticket JSON;
  result JSON;
BEGIN
  -- Get current ticket state
  SELECT row_to_json(t) INTO old_ticket
  FROM tickets t
  WHERE t.id = ticket_id;
  
  -- Update ticket
  UPDATE tickets
  SET 
    title = COALESCE((updates->>'title')::TEXT, title),
    description = COALESCE((updates->>'description')::TEXT, description),
    status = COALESCE((updates->>'status')::TEXT, status),
    priority = COALESCE((updates->>'priority')::TEXT, priority),
    assignee_id = COALESCE((updates->>'assignee_id')::UUID, assignee_id),
    updated_at = NOW(),
    updated_by = updated_by
  WHERE id = ticket_id;
  
  -- Get updated ticket state
  SELECT row_to_json(t) INTO new_ticket
  FROM tickets t
  WHERE t.id = ticket_id;
  
  -- Insert audit record
  INSERT INTO ticket_audit_log (
    ticket_id,
    old_values,
    new_values,
    changed_by,
    changed_at
  ) VALUES (
    ticket_id,
    old_ticket,
    new_ticket,
    updated_by,
    NOW()
  );
  
  SELECT json_build_object(
    'success', true,
    'ticket', new_ticket
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
