import type { UserProfile, Project } from '../../../shared/types';

export interface IProfileService {
  getProfile(userId: number): Promise<UserProfile>;
  updateProfile(userId: number, data: Partial<UserProfile>): Promise<UserProfile>;
  getProjects(userId: number): Promise<Project[]>;
}

export interface ProfileState {
  profile: UserProfile | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
}
