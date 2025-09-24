import { orgsRepo } from "../infra/repository"
import type { Organization } from "../domain/types"

export class OrgsService {
  list(): Promise<Organization[]> {
    return orgsRepo.list()
  }
  getById(id: string): Promise<Organization | null> {
    return orgsRepo.getById(id)
  }
}

export const orgsService = new OrgsService()
