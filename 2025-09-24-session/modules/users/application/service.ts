import { usersRepo } from "../infra/repository"
import type { UserProfile } from "../domain/types"

export class UsersService {
  list(): Promise<UserProfile[]> {
    return usersRepo.list()
  }
  create(input: Pick<UserProfile, "email" | "first_name" | "last_name"> & Partial<UserProfile>) {
    return usersRepo.create(input)
  }
}

export const usersService = new UsersService()
