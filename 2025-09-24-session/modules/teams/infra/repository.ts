import { apiClient } from "@/lib/api/client"
import type { Team, TeamMember } from "../domain/types"

export class TeamsRepository {
  list(): Promise<Team[]> {
    return apiClient.get<Team[]>("teams", {
      select: "id, name, description, created_at",
      cache: true,
      cacheTTL: 5 * 60 * 1000,
      tags: ["teams"],
    })
  }
  listMembers(team_id: string): Promise<TeamMember[]> {
    return apiClient.get<TeamMember[]>("team_members", {
      select: "id, team_id, user_id, role, created_at",
      filters: { team_id },
      cache: true,
      cacheTTL: 60 * 1000,
      tags: ["team_members"],
    })
  }
}

export const teamsRepo = new TeamsRepository()
