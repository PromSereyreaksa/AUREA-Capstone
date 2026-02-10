import type { UserProfile, Project, Portfolio } from '../../../shared/types';

export interface IProfileService {
  getCurrentProfile(): Promise<UserProfile>;
  getProfileById(userId: number): Promise<UserProfile>;
  createProfile(data: Partial<UserProfile>): Promise<UserProfile>;
  updateProfile(data: Partial<UserProfile>): Promise<UserProfile>;
  deleteProfile(): Promise<void>;
  getPortfolio(userId: number): Promise<Portfolio>;
  getProjects(userId: number): Promise<Project[]>;
}

export interface ProfileState {
  profile: UserProfile | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
}
