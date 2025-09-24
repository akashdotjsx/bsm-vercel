-- Database optimization script with indexes, functions, and performance improvements

-- Add missing indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_assignee_status ON tickets(assignee_id, status) WHERE status != 'closed';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_reporter_created ON tickets(reporter_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_service_priority ON tickets(service_id, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_owner_status ON assets(owner_id, status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_category_type ON assets(category, type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_location ON assets(location) WHERE location IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = false;

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_fts ON tickets USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_fts ON assets USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_fts ON knowledge_articles USING gin(to_tsvector('english', title || ' ' || content));

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_status_priority_created ON tickets(status, priority, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_changes_status_scheduled ON changes(status, scheduled_start) WHERE status IN ('approved', 'in_progress');

-- Optimized bulk update functions
CREATE OR REPLACE FUNCTION bulk_update_ticket_status(
  ticket_ids UUID[],
  new_status ticket_status,
  updated_by UUID DEFAULT auth.uid()
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE tickets 
  SET 
    status = new_status,
    updated_at = NOW(),
    updated_by = updated_by
  WHERE id = ANY(ticket_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log bulk update
  INSERT INTO audit_log (
    table_name,
    operation,
    record_ids,
    changed_by,
    changes,
    created_at
  ) VALUES (
    'tickets',
    'bulk_update_status',
    ticket_ids,
    updated_by,
    jsonb_build_object('status', new_status),
    NOW()
  );
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION bulk_update_ticket_priority(
  ticket_ids UUID[],
  new_priority ticket_priority,
  updated_by UUID DEFAULT auth.uid()
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE tickets 
  SET 
    priority = new_priority,
    updated_at = NOW(),
    updated_by = updated_by
  WHERE id = ANY(ticket_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION bulk_update_ticket_assignee(
  ticket_ids UUID[],
  new_assignee_id UUID,
  updated_by UUID DEFAULT auth.uid()
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE tickets 
  SET 
    assignee_id = new_assignee_id,
    updated_at = NOW(),
    updated_by = updated_by
  WHERE id = ANY(ticket_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized search functions with better ranking
CREATE OR REPLACE FUNCTION search_assets(
  search_term TEXT,
  user_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  status asset_status,
  location TEXT,
  owner_id UUID,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.type,
    a.status,
    a.location,
    a.owner_id,
    ts_rank(
      to_tsvector('english', a.name || ' ' || COALESCE(a.description, '')),
      plainto_tsquery('english', search_term)
    ) as rank
  FROM assets a
  WHERE 
    (user_id IS NULL OR a.owner_id = user_id)
    AND (
      to_tsvector('english', a.name || ' ' || COALESCE(a.description, '')) @@ plainto_tsquery('english', search_term)
      OR a.name ILIKE '%' || search_term || '%'
      OR a.type ILIKE '%' || search_term || '%'
      OR a.location ILIKE '%' || search_term || '%'
    )
  ORDER BY rank DESC, a.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asset dependency function with optimized queries
CREATE OR REPLACE FUNCTION get_assets_with_dependencies(asset_ids UUID[])
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH RECURSIVE asset_tree AS (
    -- Base case: selected assets
    SELECT 
      a.id,
      a.name,
      a.type,
      a.status,
      a.owner_id,
      0 as depth,
      ARRAY[a.id] as path
    FROM assets a
    WHERE a.id = ANY(asset_ids)
    
    UNION ALL
    
    -- Recursive case: dependencies
    SELECT 
      a.id,
      a.name,
      a.type,
      a.status,
      a.owner_id,
      at.depth + 1,
      at.path || a.id
    FROM assets a
    JOIN asset_relationships ar ON a.id = ar.child_asset_id
    JOIN asset_tree at ON ar.parent_asset_id = at.id
    WHERE at.depth < 5 -- Prevent infinite recursion
      AND NOT a.id = ANY(at.path) -- Prevent cycles
  )
  SELECT json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'type', type,
      'status', status,
      'owner_id', owner_id,
      'depth', depth
    )
  ) INTO result
  FROM asset_tree;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized statistics functions with caching
CREATE OR REPLACE FUNCTION get_asset_statistics(user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_assets', COUNT(*),
    'active_assets', COUNT(*) FILTER (WHERE status = 'active'),
    'inactive_assets', COUNT(*) FILTER (WHERE status = 'inactive'),
    'maintenance_assets', COUNT(*) FILTER (WHERE status = 'maintenance'),
    'retired_assets', COUNT(*) FILTER (WHERE status = 'retired'),
    'by_category', (
      SELECT json_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*) as count
        FROM assets
        WHERE (user_id IS NULL OR owner_id = user_id)
        GROUP BY category
      ) cat_counts
    )
  ) INTO result
  FROM assets
  WHERE (user_id IS NULL OR owner_id = user_id);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SLA metrics function
CREATE OR REPLACE FUNCTION get_sla_metrics(user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_tickets', COUNT(*),
    'sla_met', COUNT(*) FILTER (WHERE sla_breach = false),
    'sla_breached', COUNT(*) FILTER (WHERE sla_breach = true),
    'avg_response_time', AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))/3600),
    'avg_resolution_time', AVG(
      CASE 
        WHEN status = 'resolved' OR status = 'closed' 
        THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600
        ELSE NULL 
      END
    ),
    'by_priority', (
      SELECT json_object_agg(
        priority, 
        json_build_object(
          'total', total,
          'sla_met', sla_met,
          'avg_resolution_hours', avg_resolution_hours
        )
      )
      FROM (
        SELECT 
          priority,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE sla_breach = false) as sla_met,
          AVG(
            CASE 
              WHEN status IN ('resolved', 'closed') 
              THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600
              ELSE NULL 
            END
          ) as avg_resolution_hours
        FROM tickets
        WHERE (user_id IS NULL OR assignee_id = user_id)
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY priority
      ) priority_stats
    )
  ) INTO result
  FROM tickets
  WHERE (user_id IS NULL OR assignee_id = user_id)
    AND created_at >= NOW() - INTERVAL '30 days';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Knowledge base categories function
CREATE OR REPLACE FUNCTION get_knowledge_categories()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'category', category,
      'count', count,
      'recent_articles', recent_articles
    )
  ) INTO result
  FROM (
    SELECT 
      category,
      COUNT(*) as count,
      json_agg(
        json_build_object(
          'id', id,
          'title', title,
          'created_at', created_at
        )
        ORDER BY created_at DESC
      ) FILTER (WHERE rn <= 3) as recent_articles
    FROM (
      SELECT 
        category,
        id,
        title,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY created_at DESC) as rn
      FROM knowledge_articles
      WHERE status = 'published'
    ) ranked_articles
    GROUP BY category
    ORDER BY count DESC
  ) category_stats;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table for tracking bulk operations
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_ids UUID[],
  changed_by UUID REFERENCES profiles(id),
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation ON audit_log(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Connection pooling and query optimization settings
-- These would typically be set at the database level
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET max_connections = 200;
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET work_mem = '4MB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION bulk_update_ticket_status TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_ticket_priority TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_ticket_assignee TO authenticated;
GRANT EXECUTE ON FUNCTION search_assets TO authenticated;
GRANT EXECUTE ON FUNCTION get_assets_with_dependencies TO authenticated;
GRANT EXECUTE ON FUNCTION get_asset_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_sla_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_knowledge_categories TO authenticated;
