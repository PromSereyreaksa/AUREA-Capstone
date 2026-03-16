import type { UserProfile, Project, Portfolio } from '../../../shared/types';

export interface AvatarUploadResponse {
  message: string;
  profile_avatar: string;
  profile: UserProfile;
}

export interface IProfileService {
  getCurrentProfile(): Promise<UserProfile>;
  getProfileById(userId: number): Promise<UserProfile>;
  createProfile(data: Partial<UserProfile>): Promise<UserProfile>;
  updateProfile(data: Partial<UserProfile>): Promise<UserProfile>;
  deleteProfile(): Promise<void>;
  getPortfolio(userId?: number): Promise<Portfolio>;
  updatePortfolio(data: { is_public?: boolean; portfolio_url?: string | null; portfolio_cover_url?: string | null }): Promise<Portfolio>;
  uploadPortfolioPdf(file: File): Promise<Portfolio>;
  deletePortfolioPdf(): Promise<void>;
  uploadPortfolioCover(file: File): Promise<Portfolio>;
  deletePortfolioCover(): Promise<void>;
  getProjects(userId: number): Promise<Project[]>;
  uploadAvatar(file: File): Promise<AvatarUploadResponse>;
  deleteAvatar(): Promise<void>;
}

export interface ProfileState {
  profile: UserProfile | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
}
