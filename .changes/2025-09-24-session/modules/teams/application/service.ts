import { teamsRepo } from "../infra/repository"
import type { Team, TeamMember } from "../domain/types"

export class TeamsService {
  list(): Promise<Team[]> {
    return teamsRepo.list()
  }
  listMembers(team_id: string): Promise<TeamMember[]> {
    return teamsRepo.listMembers(team_id)
  }
}

export const teamsService = new TeamsService()
