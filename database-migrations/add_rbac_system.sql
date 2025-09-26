-- Advanced Role-Based Access Control (RBAC) System
-- This migration adds comprehensive role and permission management

-- Create enum for permission actions
CREATE TYPE permission_action AS ENUM ('view', 'edit', 'full_edit', 'create', 'delete', 'manage');

-- Create enum for resource modules
CREATE TYPE resource_module AS ENUM (
  'tickets', 'services', 'users', 'analytics', 'security', 
  'knowledge_base', 'assets', 'reports', 'integrations', 
  'administration', 'workflows', 'sla_policies', 'teams'
);

-- Roles table - Define custom roles per organization
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  is_system_role boolean DEFAULT false, -- Built-in roles vs custom roles
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique role names per organization
  CONSTRAINT unique_role_per_org UNIQUE (organization_id, name)
);

-- Permissions table - Define what actions can be performed on resources
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name varchar(255) NOT NULL UNIQUE, -- e.g., 'tickets.full_edit', 'users.view'
  display_name varchar(255) NOT NULL, -- Human-readable name
  description text,
  module resource_module NOT NULL,
  action permission_action NOT NULL,
  resource_pattern varchar(255), -- Optional: specific resource pattern (e.g., 'own', 'team', 'all')
  is_system_permission boolean DEFAULT true, -- Built-in vs custom permissions
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique permission combinations
  CONSTRAINT unique_permission UNIQUE (module, action, resource_pattern)
);

-- Role-Permission assignments - What permissions does each role have
CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted boolean DEFAULT true, -- Allow explicit deny permissions
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate role-permission assignments
  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- User-Role assignments - What roles does each user have
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id),
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- Optional: time-limited role assignments
  is_active boolean DEFAULT true,
  
  -- Prevent duplicate user-role assignments
  CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

-- User-specific permission overrides - Direct permissions for users
CREATE TABLE user_permissions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted boolean NOT NULL, -- true = grant, false = deny (overrides role permissions)
  assigned_by uuid REFERENCES profiles(id),
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- Optional: time-limited permission overrides
  reason text, -- Why this override was granted/denied
  
  -- Prevent duplicate user-permission overrides
  CONSTRAINT unique_user_permission UNIQUE (user_id, permission_id)
);

-- Add indexes for performance
CREATE INDEX idx_roles_organization ON roles(organization_id);
CREATE INDEX idx_roles_active ON roles(is_active) WHERE is_active = true;
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);

-- Insert default system permissions
INSERT INTO permissions (name, display_name, description, module, action, resource_pattern) VALUES
-- Tickets module
('tickets.view', 'View Tickets', 'Can view tickets', 'tickets', 'view', 'all'),
('tickets.view_own', 'View Own Tickets', 'Can view own tickets only', 'tickets', 'view', 'own'),
('tickets.edit', 'Edit Tickets', 'Can edit tickets', 'tickets', 'edit', 'all'),
('tickets.edit_own', 'Edit Own Tickets', 'Can edit own tickets only', 'tickets', 'edit', 'own'),
('tickets.full_edit', 'Full Edit Tickets', 'Can edit and delete tickets', 'tickets', 'full_edit', 'all'),
('tickets.create', 'Create Tickets', 'Can create new tickets', 'tickets', 'create', 'all'),
('tickets.delete', 'Delete Tickets', 'Can delete tickets', 'tickets', 'delete', 'all'),

-- Services module
('services.view', 'View Services', 'Can view services', 'services', 'view', 'all'),
('services.edit', 'Edit Services', 'Can edit services', 'services', 'edit', 'all'),
('services.full_edit', 'Full Edit Services', 'Can edit and delete services', 'services', 'full_edit', 'all'),
('services.create', 'Create Services', 'Can create new services', 'services', 'create', 'all'),
('services.delete', 'Delete Services', 'Can delete services', 'services', 'delete', 'all'),

-- Users module
('users.view', 'View Users', 'Can view user profiles', 'users', 'view', 'all'),
('users.edit', 'Edit Users', 'Can edit user profiles', 'users', 'edit', 'all'),
('users.full_edit', 'Full Edit Users', 'Can edit and delete users', 'users', 'full_edit', 'all'),
('users.create', 'Create Users', 'Can create new users', 'users', 'create', 'all'),
('users.delete', 'Delete Users', 'Can delete users', 'users', 'delete', 'all'),

-- Analytics module
('analytics.view', 'View Analytics', 'Can view analytics dashboards', 'analytics', 'view', 'all'),
('analytics.edit', 'Edit Analytics', 'Can edit analytics settings', 'analytics', 'edit', 'all'),
('analytics.full_edit', 'Full Edit Analytics', 'Can fully manage analytics', 'analytics', 'full_edit', 'all'),

-- Security module
('security.view', 'View Security', 'Can view security settings', 'security', 'view', 'all'),
('security.edit', 'Edit Security', 'Can edit security settings', 'security', 'edit', 'all'),
('security.full_edit', 'Full Edit Security', 'Can fully manage security', 'security', 'full_edit', 'all'),

-- Knowledge Base module
('knowledge_base.view', 'View Knowledge Base', 'Can view knowledge articles', 'knowledge_base', 'view', 'all'),
('knowledge_base.edit', 'Edit Knowledge Base', 'Can edit knowledge articles', 'knowledge_base', 'edit', 'all'),
('knowledge_base.full_edit', 'Full Edit Knowledge Base', 'Can fully manage knowledge base', 'knowledge_base', 'full_edit', 'all'),

-- Assets module
('assets.view', 'View Assets', 'Can view asset management', 'assets', 'view', 'all'),
('assets.edit', 'Edit Assets', 'Can edit assets', 'assets', 'edit', 'all'),
('assets.full_edit', 'Full Edit Assets', 'Can fully manage assets', 'assets', 'full_edit', 'all'),

-- Reports module
('reports.view', 'View Reports', 'Can view reports', 'reports', 'view', 'all'),
('reports.edit', 'Edit Reports', 'Can edit reports', 'reports', 'edit', 'all'),
('reports.full_edit', 'Full Edit Reports', 'Can fully manage reports', 'reports', 'full_edit', 'all'),

-- Integrations module
('integrations.view', 'View Integrations', 'Can view integrations', 'integrations', 'view', 'all'),
('integrations.edit', 'Edit Integrations', 'Can edit integrations', 'integrations', 'edit', 'all'),
('integrations.full_edit', 'Full Edit Integrations', 'Can fully manage integrations', 'integrations', 'full_edit', 'all'),

-- Administration module
('administration.view', 'View Administration', 'Can view admin settings', 'administration', 'view', 'all'),
('administration.edit', 'Edit Administration', 'Can edit admin settings', 'administration', 'edit', 'all'),
('administration.full_edit', 'Full Edit Administration', 'Can fully manage administration', 'administration', 'full_edit', 'all');

-- Insert default system roles with their permissions
-- Super Admin Role (has everything)
INSERT INTO roles (organization_id, name, description, is_system_role) 
SELECT '00000000-0000-0000-0000-000000000001', 'System Administrator', 'Complete system access and management', true;

-- Get the system admin role ID and assign all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'System Administrator' AND r.is_system_role = true;

-- Manager Role (most permissions except sensitive admin functions)
INSERT INTO roles (organization_id, name, description, is_system_role)
SELECT '00000000-0000-0000-0000-000000000001', 'Manager', 'Management level access to most modules', true;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Manager' AND r.is_system_role = true
AND p.name NOT IN ('administration.full_edit', 'security.full_edit', 'users.delete');

-- Agent Role (service delivery focused)
INSERT INTO roles (organization_id, name, description, is_system_role)
SELECT '00000000-0000-0000-0000-000000000001', 'Agent', 'Service delivery and support access', true;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Agent' AND r.is_system_role = true
AND p.module IN ('tickets', 'services', 'knowledge_base')
AND p.action IN ('view', 'edit', 'create');

-- User Role (basic access)
INSERT INTO roles (organization_id, name, description, is_system_role)
SELECT '00000000-0000-0000-0000-000000000001', 'User', 'Basic user access for creating tickets and requests', true;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'User' AND r.is_system_role = true
AND ((p.module = 'tickets' AND p.action IN ('view', 'create') AND p.resource_pattern IN ('own', 'all'))
     OR (p.module = 'services' AND p.action = 'view')
     OR (p.module = 'knowledge_base' AND p.action = 'view'));

-- Migrate existing users to the new role system
-- Assign roles based on their current role field
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 
  p.id as user_id,
  r.id as role_id,
  now() as assigned_at
FROM profiles p
JOIN roles r ON (
  (p.role = 'admin' AND r.name = 'System Administrator') OR
  (p.role = 'manager' AND r.name = 'Manager') OR
  (p.role = 'agent' AND r.name = 'Agent') OR
  (p.role = 'user' AND r.name = 'User')
)
WHERE r.is_system_role = true
AND r.organization_id = p.organization_id;

-- Add RLS policies for the new RBAC tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Roles: Users can see roles in their organization
CREATE POLICY "Users can view roles in their organization" ON roles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Permissions: All users can view permissions (they're mostly static)
CREATE POLICY "All users can view permissions" ON permissions
  FOR SELECT USING (true);

-- Role permissions: Users can view role permissions for roles in their org
CREATE POLICY "Users can view role permissions in their organization" ON role_permissions
  FOR SELECT USING (
    role_id IN (
      SELECT r.id FROM roles r
      JOIN profiles p ON p.organization_id = r.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- User roles: Users can view their own roles and admins can see all in org
CREATE POLICY "Users can view user roles" ON user_roles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id
      JOIN roles r ON r.id = ur.role_id
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions perm ON perm.id = rp.permission_id
      WHERE p.id = auth.uid()
      AND perm.name = 'users.view'
      AND rp.granted = true
    )
  );

-- User permissions: Similar to user roles
CREATE POLICY "Users can view user permissions" ON user_permissions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id
      JOIN roles r ON r.id = ur.role_id
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions perm ON perm.id = rp.permission_id
      WHERE p.id = auth.uid()
      AND perm.name = 'users.view'
      AND rp.granted = true
    )
  );

-- Add helpful functions for permission checking
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid uuid, permission_name varchar)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check direct user permissions first (these override role permissions)
  IF EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = user_uuid
    AND p.name = permission_name
    AND up.granted = false
    AND (up.expires_at IS NULL OR up.expires_at > now())
  ) THEN
    RETURN false; -- Explicit deny
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = user_uuid
    AND p.name = permission_name
    AND up.granted = true
    AND (up.expires_at IS NULL OR up.expires_at > now())
  ) THEN
    RETURN true; -- Explicit grant
  END IF;
  
  -- Check role-based permissions
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = user_uuid
    AND p.name = permission_name
    AND ur.is_active = true
    AND r.is_active = true
    AND rp.granted = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
END;
$$;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid uuid)
RETURNS TABLE(permission_name varchar, granted boolean, source varchar)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH role_perms AS (
    SELECT 
      p.name as permission_name,
      rp.granted,
      'role:' || r.name as source
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ),
  user_perms AS (
    SELECT 
      p.name as permission_name,
      up.granted,
      'user_override' as source
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = user_uuid
    AND (up.expires_at IS NULL OR up.expires_at > now())
  )
  SELECT 
    COALESCE(up.permission_name, rp.permission_name) as permission_name,
    COALESCE(up.granted, rp.granted) as granted,
    COALESCE(up.source, rp.source) as source
  FROM role_perms rp
  FULL OUTER JOIN user_perms up ON up.permission_name = rp.permission_name;
END;
$$;

COMMENT ON TABLE roles IS 'Custom roles that can be assigned to users within an organization';
COMMENT ON TABLE permissions IS 'System-defined permissions for different modules and actions';
COMMENT ON TABLE role_permissions IS 'Maps which permissions are granted to each role';
COMMENT ON TABLE user_roles IS 'Maps which roles are assigned to each user';
COMMENT ON TABLE user_permissions IS 'Direct permission overrides for individual users';
COMMENT ON FUNCTION user_has_permission IS 'Check if a user has a specific permission';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user with their sources';