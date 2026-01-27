import { UserProfile } from '../../domain/entities/UserProfile';

export function mapUserProfileToDb(profile: UserProfile) {
  return {
    user_id: profile.user_id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    bio: profile.bio,
    skills: profile.skills,
    location: profile.location,
    profile_avatar: profile.profile_avatar,
    updated_at: profile.updated_at?.toISOString()
  };
}

export function mapUserProfileFromDb(data: any): UserProfile {
  return new UserProfile(
    data.profile_id,
    data.user_id,
    data.first_name,
    data.last_name,
    data.bio,
    data.skills,
    data.location,
    data.profile_avatar,
  );
}
