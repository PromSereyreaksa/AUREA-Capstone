import type { IProfileService } from './IProfileService';
import type { UserProfile, Project } from '../../../shared/types';
import { httpClient } from '../../../shared/api/client';

export class ProfileService implements IProfileService {
  async getProfile(userId: number): Promise<UserProfile> {
    try {
      const profile = await httpClient.get<UserProfile>(`/profiles/${userId}`);
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Return mock data if API fails
      return {
        profile_id: 1,
        user_id: userId,
        first_name: 'John',
        last_name: 'Doe',
        bio: 'Passionate designer',
        skills: 'UI/UX, Branding',
        location: 'San Francisco, CA',
      };
    }
  }

  async updateProfile(userId: number, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const updatedProfile = await httpClient.put<UserProfile>(
        `/profiles/${userId}`,
        data
      );
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  async getProjects(userId: number): Promise<Project[]> {
    try {
      const projects = await httpClient.get<Project[]>(`/projects/user/${userId}`);
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Return empty array if API fails
      return [];
    }
  }
}
