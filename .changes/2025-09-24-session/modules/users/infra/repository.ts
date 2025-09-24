import { apiClient } from "@/lib/api/client"
import type { UserProfile } from "../domain/types"

export class UsersRepository {
  async list(): Promise<UserProfile[]> {
    return apiClient.get<UserProfile[]>("profiles", {
      select:
        "id, email, first_name, last_name, display_name, role, department, is_active, avatar_url, phone, timezone, created_at, updated_at",
      cache: true,
      cacheTTL: 60 * 1000,
      tags: ["profiles", "users"],
    })
  }

  async create(input: Pick<UserProfile, "email" | "first_name" | "last_name"> & Partial<UserProfile>): Promise<UserProfile> {
    const payload = {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      display_name: input.display_name || `${input.first_name} ${input.last_name}`,
      role: input.role || "user",
      department: input.department || "General",
      is_active: input.is_active ?? true,
      timezone: input.timezone || "UTC",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return apiClient.create<UserProfile>("profiles", payload)
  }
}

export const usersRepo = new UsersRepository()
