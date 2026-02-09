export interface SocialLink {
  platform: string;
  url: string;
  handle: string;
}

export class UserProfile {
  constructor(
    public profile_id: number,
    public user_id: number,
    public bio?: string,
    public skills?: string[],
    public location?: string,
    public profile_avatar?: string,
    public updated_at?: Date,
    public experience_years?: number,
    public seniority_level?: string,
    public social_links?: SocialLink[]
  ) {}
}
