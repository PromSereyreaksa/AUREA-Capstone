import { IUserProfileRepository } from '../../domain/repositories/IUserProfileRepository';
import { UserProfile } from '../../domain/entities/UserProfile';
import { supabase } from '../db/supabaseClient';
import { DatabaseError, NotFoundError } from '../../shared/errors';
import { mapUserProfileFromDb, mapUserProfileToDb } from '../mappers/userProfileMapper';

export class UserProfileRepository implements IUserProfileRepository {
  async create(profile: UserProfile): Promise<UserProfile> {
    const row = mapUserProfileToDb(profile);

    const { data, error } = await supabase
      .from('user_profile')
      .insert([row])
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create user profile: ${error.message}`);
    }

    return mapUserProfileFromDb(data);
  }

  async findByUserId(user_id: number): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to find user profile: ${error.message}`);
    }

    if (!data) return null;

    // Fetch user data to get first_name and last_name
    const { data: userData } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('user_id', user_id)
      .single();

    return mapUserProfileFromDb({ ...data, ...userData });
  }

  async update(user_id: number, profile: Partial<UserProfile>): Promise<UserProfile> {
    // Check if profile exists first
    const { data: existingProfile } = await supabase
      .from('user_profile')
      .select('profile_id')
      .eq('user_id', user_id)
      .single();

    // If profile doesn't exist, create it instead
    if (!existingProfile) {
      const newProfile: any = {
        user_id,
        bio: profile.bio,
        skills: profile.skills ? JSON.stringify(profile.skills) : null,
        location: profile.location,
        profile_avatar: profile.profile_avatar,
        experience_years: profile.experience_years,
        seniority_level: profile.seniority_level,
        social_links: profile.social_links ? JSON.stringify(profile.social_links) : '[]',
      };

      const { data: createdData, error: createError } = await supabase
        .from('user_profile')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        throw new DatabaseError(`Failed to create user profile: ${createError.message}`);
      }

      // Fetch user data to get first_name and last_name
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('user_id', user_id)
        .single();

      return mapUserProfileFromDb({ ...createdData, ...userData });
    }

    // Profile exists, proceed with update
    const updateData: any = {};

    if (profile.bio !== undefined) updateData.bio = profile.bio;
    if (profile.skills !== undefined) updateData.skills = JSON.stringify(profile.skills);
    if (profile.location !== undefined) updateData.location = profile.location;
    if (profile.profile_avatar !== undefined) updateData.profile_avatar = profile.profile_avatar;
    if (profile.experience_years !== undefined) updateData.experience_years = profile.experience_years;
    if (profile.seniority_level !== undefined) updateData.seniority_level = profile.seniority_level;
    if (profile.social_links !== undefined) updateData.social_links = JSON.stringify(profile.social_links);

    const { data, error } = await supabase
      .from('user_profile')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update user profile: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundError('User profile not found');
    }

    // Fetch user data to get first_name and last_name
    const { data: userData } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('user_id', user_id)
      .single();

    return mapUserProfileFromDb({ ...data, ...userData });
  }

  async delete(user_id: number): Promise<void> {
    const { error } = await supabase
      .from('user_profile')
      .delete()
      .eq('user_id', user_id);

    if (error) {
      throw new DatabaseError(`Failed to delete user profile: ${error.message}`);
    }
  }
}
