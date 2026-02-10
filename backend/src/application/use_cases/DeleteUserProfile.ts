import { IUserProfileRepository } from '../../domain/repositories/IUserProfileRepository';

export class DeleteUserProfile {
  constructor(private userProfileRepo: IUserProfileRepository) {}

  async execute(user_id: number): Promise<void> {
    await this.userProfileRepo.delete(user_id);
  }
}
