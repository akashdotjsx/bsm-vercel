import { apiClient } from "@/lib/api/client"
import type { RoleRow } from "../domain/types"

export class RolesRepository {
  list(): Promise<RoleRow[]> {
    return apiClient.get<RoleRow[]>("roles", {
      select: "id, name, description, permissions, created_at, updated_at",
      cache: true,
      cacheTTL: 5 * 60 * 1000,
      tags: ["roles"],
    })
  }
  update(id: string, updates: Partial<RoleRow>): Promise<RoleRow> {
    return apiClient.update<RoleRow>("roles", id, updates)
  }
}

export const rolesRepo = new RolesRepository()
