import { UserProfile } from '../entities/UserProfile';

export interface IUserProfileRepository {
  create(profile: UserProfile): Promise<UserProfile>;
  findByUserId(user_id: number): Promise<UserProfile | null>;
  update(user_id: number, profile: Partial<UserProfile>): Promise<UserProfile>;
  delete(user_id: number): Promise<void>;
}
