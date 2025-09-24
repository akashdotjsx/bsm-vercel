import { rolesRepo } from "../infra/repository"
import type { RoleRow } from "../domain/types"

export class RolesService {
  list(): Promise<RoleRow[]> {
    return rolesRepo.list()
  }
  update(id: string, updates: Partial<RoleRow>) {
    return rolesRepo.update(id, updates)
  }
}

export const rolesService = new RolesService()
