/**
 * Page Access Control Configuration
 * 
 * Available User Roles (from database):
 * - admin: System Administrator - Complete system access
 * - manager: Manager - Management level access to most modules
 * - agent: Agent - Service delivery and support access
 * - user: User - Basic user access for creating tickets and requests
 */

export type UserRole = 'admin' | 'manager' | 'agent' | 'user'

export interface PageAccess {
  path: string
  label: string
  allowedRoles: UserRole[] // Empty array = all authenticated users
  requiresPermission?: string // Optional permission check
}

/**
 * Page Access Configuration
 * 
 * SIMPLE RULES:
 * 1. Service Management pages: Open to ALL authenticated users
 * 2. Administration pages: Only 'admin' role
 */
export const PAGE_ACCESS_CONFIG: PageAccess[] = [
  // ============================================
  // SERVICE MANAGEMENT - Open to ALL users
  // ============================================
  {
    path: '/dashboard',
    label: 'Dashboard',
    allowedRoles: [], // All authenticated users
  },
  {
    path: '/accounts',
    label: 'Accounts',
    allowedRoles: [], // All authenticated users
  },
  {
    path: '/tickets',
    label: 'Tickets',
    allowedRoles: [], // All authenticated users
  },
  {
    path: '/workflows',
    label: 'Workflows',
    allowedRoles: [], // All authenticated users
  },
  {
    path: '/assets',
    label: 'Asset Management',
    allowedRoles: [], // All authenticated users
  },
  {
    path: '/services',
    label: 'Services',
    allowedRoles: [], // All authenticated users
  },
  {
    path: '/knowledge-base',
    label: 'Knowledge Base',
    allowedRoles: [], // All authenticated users
  },
  {
    path: '/analytics',
    label: 'Analytics',
    allowedRoles: [], // All authenticated users
  },
  {
    path: '/notifications',
    label: 'Notifications',
    allowedRoles: [], // All authenticated users
  },
  {
    path: '/users',
    label: 'Users & Teams',
    allowedRoles: [], // All authenticated users (can view, but edit restricted by permissions)
  },
  {
    path: '/settings',
    label: 'Settings',
    allowedRoles: [], // All authenticated users
  },
  {
    path: '/profile',
    label: 'Profile',
    allowedRoles: [], // All authenticated users
  },

  // ============================================
  // ADMINISTRATION - Admin Only
  // ============================================
  {
    path: '/admin/security',
    label: 'Security & Access',
    allowedRoles: ['admin'],
    requiresPermission: 'administration.full_edit',
  },
  {
    path: '/admin/approvals',
    label: 'Approval Workflows',
    allowedRoles: ['admin'],
    requiresPermission: 'administration.view',
  },
  {
    path: '/admin/catalog',
    label: 'Service Catalog',
    allowedRoles: ['admin'],
    requiresPermission: 'administration.view',
  },
  {
    path: '/admin/priorities',
    label: 'Priorities',
    allowedRoles: ['admin'],
    requiresPermission: 'administration.view',
  },
  {
    path: '/admin/service-requests',
    label: 'Service Requests Admin',
    allowedRoles: ['admin'],
    requiresPermission: 'administration.view',
  },
  {
    path: '/admin/sla',
    label: 'SLA Management',
    allowedRoles: ['admin'],
    requiresPermission: 'administration.view',
  },
  {
    path: '/integrations',
    label: 'Integrations',
    allowedRoles: ['admin'],
    requiresPermission: 'administration.full_edit',
  },
]

/**
 * Helper function to check if user has access to a page
 */
export function hasPageAccess(
  pagePath: string,
  userRole: UserRole,
  userPermissions?: string[]
): boolean {
  const pageConfig = PAGE_ACCESS_CONFIG.find(config => 
    pagePath.startsWith(config.path)
  )

  // If page not in config, allow access (default open)
  if (!pageConfig) return true

  // If no roles specified, all authenticated users can access
  if (pageConfig.allowedRoles.length === 0) return true

  // Check if user's role is in allowed roles
  const hasRole = pageConfig.allowedRoles.includes(userRole)
  
  // If permission is required, check that too
  if (pageConfig.requiresPermission && userPermissions) {
    return hasRole && userPermissions.includes(pageConfig.requiresPermission)
  }

  return hasRole
}

/**
 * Get pages accessible to a specific role
 */
export function getAccessiblePages(userRole: UserRole): PageAccess[] {
  return PAGE_ACCESS_CONFIG.filter(page => 
    page.allowedRoles.length === 0 || page.allowedRoles.includes(userRole)
  )
}
