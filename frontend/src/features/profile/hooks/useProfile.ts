import { useState, useEffect } from 'react';
import type { UserProfile } from '../../../shared/types';
import type { IProfileService, ProfileState } from '../services/IProfileService';
import { ProfileService } from '../services/ProfileService';

export const useProfile = (
  userId: number,
  profileService?: IProfileService
) => {
  const service = profileService || new ProfileService();
  
  const [state, setState] = useState<ProfileState>({
    profile: null,
    projects: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [profile, projects] = await Promise.all([
        service.getProfile(userId),
        service.getProjects(userId),
      ]);

      setState({
        profile,
        projects,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        profile: null,
        projects: [],
        loading: false,
        error: error.message || 'Failed to load profile',
      });
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!state.profile) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const updatedProfile = await service.updateProfile(userId, data);
      
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to update profile',
      }));
      throw error;
    }
  };

  return {
    ...state,
    updateProfile,
    reload: loadProfile,
  };
};
