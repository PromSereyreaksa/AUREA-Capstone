export class UserProfile {
  constructor(
    public profile_id: number,
    public user_id: number,
    public first_name?: string,
    public last_name?: string,
    public bio?: string,
    public skills?: string,
    public location?: string,
    public profile_avatar?: string,
    public updated_at?: Date,
    public experience_years?: number,      // NEW: Years of professional experience
    public seniority_level?: string        // NEW: 'junior' | 'mid' | 'senior' | 'expert'
  ) {}
}
