import { Request, Response } from 'express';
import { UserProfileRepository } from '../../infrastructure/repositories/UserProfileRepository';
import { CreateUserProfile } from '../../application/use_cases/CreateUserProfile';
import { GetUserProfile } from '../../application/use_cases/GetUserProfile';
import { UpdateUserProfile } from '../../application/use_cases/UpdateUserProfile';
import { DeleteUserProfile } from '../../application/use_cases/DeleteUserProfile';
import { ResponseHelper } from '../../shared/utils';
import { asyncHandler } from '../../shared/middleware';
import { supabase } from '../../infrastructure/db/supabaseClient';
import { StorageService } from '../../infrastructure/services/StorageService';

const userProfileRepo = new UserProfileRepository();
const createUserProfile = new CreateUserProfile(userProfileRepo);
const getUserProfile = new GetUserProfile(userProfileRepo);
const updateUserProfile = new UpdateUserProfile(userProfileRepo);
const deleteUserProfile = new DeleteUserProfile(userProfileRepo);
const storageService = new StorageService();

// Helper to fetch user name
async function getUserName(user_id: number): Promise<{ first_name?: string; last_name?: string }> {
  const { data } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('user_id', user_id)
    .single();
  return data || {};
}

/**
 * POST /api/profile
 * Create a new user profile
 */
export const createProfileController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;
  const { bio, skills, location, profile_avatar, experience_years, seniority_level, social_links } = req.body;

  const profile = await createUserProfile.execute({
    user_id,
    bio,
    skills,
    location,
    profile_avatar,
    experience_years,
    seniority_level,
    social_links,
  });

  const userData = await getUserName(user_id);

  return ResponseHelper.created(res, {
    profile_id: profile.profile_id,
    user_id: profile.user_id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    bio: profile.bio,
    skills: profile.skills,
    location: profile.location,
    profile_avatar: profile.profile_avatar,
    experience_years: profile.experience_years,
    seniority_level: profile.seniority_level,
    social_links: profile.social_links,
  }, 'Profile created successfully');
});

/**
 * GET /api/profile
 * Get current user's profile
 */
export const getProfileController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;

  const profile = await getUserProfile.execute(user_id);

  if (!profile) {
    return ResponseHelper.error(res, 'Profile not found', 404);
  }

  const userData = await getUserName(user_id);

  return ResponseHelper.success(res, {
    profile_id: profile.profile_id,
    user_id: profile.user_id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    bio: profile.bio,
    skills: profile.skills,
    location: profile.location,
    profile_avatar: profile.profile_avatar,
    experience_years: profile.experience_years,
    seniority_level: profile.seniority_level,
    social_links: profile.social_links,
    updated_at: profile.updated_at,
  }, 'Profile retrieved successfully');
});

/**
 * GET /api/profile/:userId
 * Get a specific user's profile by ID (for viewing other users' profiles)
 */
export const getUserProfileByIdController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  if (typeof userId !== 'string') {
    return ResponseHelper.error(res, 'Invalid user ID', 400);
  }

  const userIdNum = parseInt(userId, 10);
  const profile = await getUserProfile.execute(userIdNum);

  if (!profile) {
    return ResponseHelper.error(res, 'Profile not found', 404);
  }

  const userData = await getUserName(userIdNum);

  return ResponseHelper.success(res, {
    profile_id: profile.profile_id,
    user_id: profile.user_id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    bio: profile.bio,
    skills: profile.skills,
    location: profile.location,
    profile_avatar: profile.profile_avatar,
    experience_years: profile.experience_years,
    seniority_level: profile.seniority_level,
    social_links: profile.social_links,
    updated_at: profile.updated_at,
  }, 'Profile retrieved successfully');
});

/**
 * PUT /api/profile
 * Update current user's profile
 */
export const updateProfileController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;
  const { first_name, last_name, bio, skills, location, profile_avatar, experience_years, seniority_level, social_links } = req.body;

  const profile = await updateUserProfile.execute({
    user_id,
    first_name,
    last_name,
    bio,
    skills,
    location,
    profile_avatar,
    experience_years,
    seniority_level,
    social_links,
  });

  const userData = await getUserName(user_id);

  return ResponseHelper.success(res, {
    profile_id: profile.profile_id,
    user_id: profile.user_id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    bio: profile.bio,
    skills: profile.skills,
    location: profile.location,
    profile_avatar: profile.profile_avatar,
    experience_years: profile.experience_years,
    seniority_level: profile.seniority_level,
    social_links: profile.social_links,
    updated_at: profile.updated_at,
  }, 'Profile updated successfully');
});

/**
 * DELETE /api/profile
 * Delete current user's profile
 */
export const deleteProfileController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;

  await deleteUserProfile.execute(user_id);

  return ResponseHelper.success(res, null, 'Profile deleted successfully');
});

/**
 * POST /api/profile/avatar
 * Upload or update profile avatar
 */
export const uploadAvatarController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;
  const file = req.file;

  if (!file) {
    return ResponseHelper.error(res, 'No file uploaded', 400);
  }

  // Get existing profile to check for old avatar
  const existingProfile = await userProfileRepo.findByUserId(user_id);
  
  // Upload new avatar to Supabase Storage
  const avatarUrl = await storageService.uploadAvatar(user_id, file);

  if (existingProfile) {
    // Update existing profile with new avatar
    const oldAvatarUrl = existingProfile.profile_avatar;
    
    const updatedProfile = await updateUserProfile.execute({
      user_id,
      profile_avatar: avatarUrl
    });

    // Delete old avatar if it exists and is different
    if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
      await storageService.deleteAvatar(oldAvatarUrl);
    }

    const userData = await getUserName(user_id);

    return ResponseHelper.success(res, {
      message: 'Avatar uploaded successfully',
      profile_avatar: avatarUrl,
      profile: {
        profile_id: updatedProfile.profile_id,
        user_id: updatedProfile.user_id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        bio: updatedProfile.bio,
        skills: updatedProfile.skills,
        location: updatedProfile.location,
        profile_avatar: updatedProfile.profile_avatar,
        experience_years: updatedProfile.experience_years,
        seniority_level: updatedProfile.seniority_level,
        social_links: updatedProfile.social_links,
        updated_at: updatedProfile.updated_at,
      }
    }, 'Avatar uploaded successfully');
  } else {
    // Create new profile with avatar
    const newProfile = await createUserProfile.execute({
      user_id,
      profile_avatar: avatarUrl
    });

    const userData = await getUserName(user_id);

    return ResponseHelper.created(res, {
      message: 'Avatar uploaded and profile created',
      profile_avatar: avatarUrl,
      profile: {
        profile_id: newProfile.profile_id,
        user_id: newProfile.user_id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        bio: newProfile.bio,
        skills: newProfile.skills,
        location: newProfile.location,
        profile_avatar: newProfile.profile_avatar,
        experience_years: newProfile.experience_years,
        seniority_level: newProfile.seniority_level,
        social_links: newProfile.social_links,
      }
    }, 'Avatar uploaded successfully');
  }
});

/**
 * DELETE /api/profile/avatar
 * Delete profile avatar
 */
export const deleteAvatarController = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.user as any;

  const profile = await userProfileRepo.findByUserId(user_id);
  
  if (!profile || !profile.profile_avatar) {
    return ResponseHelper.notFound(res, 'No avatar found');
  }

  // Delete from Supabase Storage
  await storageService.deleteAvatar(profile.profile_avatar);

  // Update profile to remove avatar URL
  await updateUserProfile.execute({
    user_id,
    profile_avatar: undefined
  });

  return ResponseHelper.success(res, null, 'Avatar deleted successfully');
});
