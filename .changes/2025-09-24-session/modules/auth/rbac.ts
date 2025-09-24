export type Role = "admin" | "manager" | "agent" | "user" | "viewer"

export type Resource =
  | "tickets"
  | "users"
  | "roles"
  | "teams"
  | "organizations"
  | "assets"
  | "knowledge"

export type Action = "create" | "read" | "update" | "delete" | "assign" | "transition"

// Simple default policy matrix; can be expanded to ABAC via predicates
const policies: Record<Role, Partial<Record<Resource, Action[]>>> = {
  admin: {
    tickets: ["create", "read", "update", "delete", "assign", "transition"],
    users: ["create", "read", "update", "delete"],
    roles: ["create", "read", "update", "delete"],
    teams: ["create", "read", "update", "delete"],
    organizations: ["read", "update"],
    assets: ["create", "read", "update", "delete"],
    knowledge: ["create", "read", "update", "delete"],
  },
  manager: {
    tickets: ["create", "read", "update", "assign", "transition"],
    users: ["read", "update"],
    teams: ["read", "update"],
    assets: ["read", "update"],
    knowledge: ["create", "read", "update"],
  },
  agent: {
    tickets: ["create", "read", "update", "assign", "transition"],
    knowledge: ["create", "read", "update"],
    assets: ["read"],
  },
  user: {
    tickets: ["create", "read"],
    knowledge: ["read"],
  },
  viewer: {
    tickets: ["read"],
    knowledge: ["read"],
  },
}

export function can(role: Role, resource: Resource, action: Action): boolean {
  const allowed = policies[role]?.[resource]
  return !!allowed && allowed.includes(action)
}
