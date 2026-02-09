import { IUserProfileRepository } from '../../domain/repositories/IUserProfileRepository';
import { UserProfile, SocialLink } from '../../domain/entities/UserProfile';
import { supabase } from '../../infrastructure/db/supabaseClient';

interface UpdateUserProfileInput {
  user_id: number;
  first_name?: string;
  last_name?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  profile_avatar?: string;
  experience_years?: number;
  seniority_level?: 'junior' | 'mid' | 'senior' | 'expert';
  social_links?: SocialLink[];
}

export class UpdateUserProfile {
  constructor(private userProfileRepo: IUserProfileRepository) {}

  async execute(input: UpdateUserProfileInput): Promise<UserProfile> {
    // Update first_name and last_name in users table if provided
    if (input.first_name !== undefined || input.last_name !== undefined) {
      const userUpdateData: any = {};
      if (input.first_name !== undefined) userUpdateData.first_name = input.first_name;
      if (input.last_name !== undefined) userUpdateData.last_name = input.last_name;

      await supabase
        .from('users')
        .update(userUpdateData)
        .eq('user_id', input.user_id);
    }

    const profile = new UserProfile(
      0,
      input.user_id,
      input.bio,
      input.skills,
      input.location,
      input.profile_avatar,
      undefined,
      input.experience_years,
      input.seniority_level,
      input.social_links
    );

    return await this.userProfileRepo.update(input.user_id, profile);
  }
}