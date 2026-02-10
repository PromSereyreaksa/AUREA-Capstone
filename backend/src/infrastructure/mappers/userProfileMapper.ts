import { UserProfile, SocialLink } from '../../domain/entities/UserProfile';

function fromPostgresTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  const dateStr = String(value).endsWith('Z') ? value : value + 'Z';
  return new Date(dateStr);
}

function parseSocialLinks(value: any): SocialLink[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}

function parseSkills(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      // Try parsing as JSON array first
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      // If it's a comma-separated string, split it
      return value.split(',').map((s: string) => s.trim()).filter(Boolean);
    } catch {
      // If not JSON, treat as comma-separated string
      return value.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function mapUserProfileToDb(profile: UserProfile) {
  return {
    user_id: profile.user_id,
    bio: profile.bio,
    skills: profile.skills ? JSON.stringify(profile.skills) : '[]',
    location: profile.location,
    profile_avatar: profile.profile_avatar,
    experience_years: profile.experience_years,
    seniority_level: profile.seniority_level,
    social_links: profile.social_links ? JSON.stringify(profile.social_links) : '[]',
  };
}

export function mapUserProfileFromDb(data: any): UserProfile {
  return new UserProfile(
    data.profile_id,
    data.user_id,
    data.bio,
    parseSkills(data.skills),
    data.location,
    data.profile_avatar,
    fromPostgresTimestamp(data.updated_at),
    data.experience_years,
    data.seniority_level,
    parseSocialLinks(data.social_links)
  );
}
