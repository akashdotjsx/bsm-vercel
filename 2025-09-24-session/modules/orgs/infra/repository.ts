import { apiClient } from "@/lib/api/client"
import type { Organization } from "../domain/types"

export class OrgsRepository {
  async list(): Promise<Organization[]> {
    return apiClient.get<Organization[]>("organizations", {
      select: "id, name, created_at, updated_at",
      cache: true,
      cacheTTL: 5 * 60 * 1000,
      tags: ["organizations"],
    })
  }

  async getById(id: string): Promise<Organization | null> {
    const rows = await apiClient.get<Organization[]>("organizations", {
      select: "id, name, created_at, updated_at",
      filters: { id },
      cache: true,
      cacheTTL: 5 * 60 * 1000,
      tags: ["organizations"],
    })
    return rows?.[0] || null
  }
}

export const orgsRepo = new OrgsRepository()
