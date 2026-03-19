import type { IProfileService, AvatarUploadResponse } from './IProfileService';
import type { UserProfile, Project, Portfolio } from '../../../shared/types';
import { httpClient } from '../../../shared/api/client';

export class ProfileService implements IProfileService {
  async getCurrentProfile(): Promise<UserProfile> {
    const response = await httpClient.get<{ success: boolean; data: UserProfile }>('/profile');
    return response.data;
  }

  async getProfileById(userId: number): Promise<UserProfile> {
    const response = await httpClient.get<{ success: boolean; data: UserProfile }>(`/profile/${userId}`);
    return response.data;
  }

  async createProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await httpClient.post<{ success: boolean; data: UserProfile }>('/profile', data);
    return response.data;
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await httpClient.put<{ success: boolean; data: UserProfile }>('/profile', data);
    return response.data;
  }

  async deleteProfile(): Promise<void> {
    await httpClient.delete('/profile');
  }

  async getPortfolio(_userId?: number): Promise<Portfolio> {
    const response = await httpClient.get<{ success: boolean; data: Portfolio }>(`/portfolio`);
    return response.data;
  }

  async updatePortfolio(data: { is_public?: boolean; portfolio_url?: string | null; portfolio_cover_url?: string | null }): Promise<Portfolio> {
    const response = await httpClient.put<{ success: boolean; data: Portfolio }>('/portfolio', data);
    return response.data;
  }

  async uploadPortfolioPdf(file: File): Promise<Portfolio> {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await httpClient.uploadFormData<{ success: boolean; data: Portfolio }>(
      '/portfolio/pdf',
      formData
    );
    return response.data;
  }

  async deletePortfolioPdf(): Promise<void> {
    await httpClient.delete('/portfolio/pdf');
  }

  async uploadPortfolioCover(file: File): Promise<Portfolio> {
    const formData = new FormData();
    formData.append('cover', file);

    const response = await httpClient.uploadFormData<{ success: boolean; data: Portfolio }>(
      '/portfolio/cover',
      formData
    );
    return response.data;
  }

  async deletePortfolioCover(): Promise<void> {
    await httpClient.delete('/portfolio/cover');
  }

  async getProjects(userId: number): Promise<Project[]> {
    try {
      const projects = await httpClient.get<Project[]>(`/projects/user/${userId}`);
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await httpClient.uploadFormData<{ success: boolean; data: AvatarUploadResponse }>(
      '/profile/avatar',
      formData
    );
    return response.data;
  }

  async deleteAvatar(): Promise<void> {
    await httpClient.delete('/profile/avatar');
  }
}
