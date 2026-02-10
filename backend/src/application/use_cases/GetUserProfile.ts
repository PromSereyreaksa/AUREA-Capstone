import { IUserProfileRepository } from '../../domain/repositories/IUserProfileRepository';
import { UserProfile } from '../../domain/entities/UserProfile';

export class GetUserProfile {
  constructor(private userProfileRepo: IUserProfileRepository) {}

  async execute(user_id: number): Promise<UserProfile | null> {
    return await this.userProfileRepo.findByUserId(user_id);
  }
}
