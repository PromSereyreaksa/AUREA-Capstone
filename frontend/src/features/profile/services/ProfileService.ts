import type { IProfileService } from './IProfileService';
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

  async getPortfolio(userId: number): Promise<Portfolio> {
    const response = await httpClient.get<{ success: boolean; data: Portfolio }>(`/portfolio/${userId}`);
    return response.data;
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
}
