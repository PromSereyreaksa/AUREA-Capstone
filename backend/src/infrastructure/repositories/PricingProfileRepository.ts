import { supabase } from '../db/supabaseClient';
import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { PricingProfile } from '../../domain/entities/PricingProfile';
import { mapPricingProfileToDb, mapPricingProfileFromDb } from '../mappers/pricingProfileMapper';
import { DatabaseError } from '../../shared/errors/AppError';

export class PricingProfileRepository implements IPricingProfileRepository {
  private tableName = 'pricing_profiles';
  private userCategoryTable = 'user_category';

  async create(profile: PricingProfile): Promise<PricingProfile> {
    const dbData = mapPricingProfileToDb(profile);
    
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create pricing profile: ${error.message}`);
    }

    // Save skill categories to user_category table
    if (profile.skill_categories && profile.skill_categories.length > 0) {
      await this.saveSkillCategories(profile.user_id, profile.skill_categories);
    }

    const result = mapPricingProfileFromDb(data);
    result.skill_categories = profile.skill_categories;
    return result;
  }

  async findByUserId(userId: number): Promise<PricingProfile | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw new DatabaseError(`Failed to find pricing profile: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const profile = mapPricingProfileFromDb(data);
    
    // Load skill categories
    profile.skill_categories = await this.loadSkillCategories(userId);
    
    return profile;
  }

  async update(profileId: number, profile: Partial<PricingProfile>): Promise<PricingProfile> {
    const updateData: any = {};

    // Map only provided fields
    if (profile.fixed_costs) {
      Object.assign(updateData, profile.fixed_costs.toDb());
    }
    if (profile.variable_costs) {
      Object.assign(updateData, profile.variable_costs.toDb());
    }
    if (profile.desired_monthly_income !== undefined) {
      updateData.desired_monthly_income = profile.desired_monthly_income;
    }
    if (profile.billable_hours_per_month !== undefined) {
      updateData.billable_hours_per_month = profile.billable_hours_per_month;
    }
    if (profile.profit_margin !== undefined) {
      updateData.profit_margin = profile.profit_margin;
    }
    if (profile.experience_years !== undefined) {
      updateData.experience_years = profile.experience_years;
    }
    if (profile.seniority_level !== undefined) {
      updateData.seniority_level = profile.seniority_level;
    }
    if (profile.base_hourly_rate !== undefined) {
      updateData.base_hourly_rate = profile.base_hourly_rate;
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('pricing_profile_id', profileId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update pricing profile: ${error.message}`);
    }

    // Update skill categories if provided
    if (profile.skill_categories) {
      await this.saveSkillCategories(data.user_id, profile.skill_categories);
    }

    const result = mapPricingProfileFromDb(data);
    result.skill_categories = await this.loadSkillCategories(data.user_id);
    return result;
  }

  async delete(profileId: number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('pricing_profile_id', profileId);

    if (error) {
      throw new DatabaseError(`Failed to delete pricing profile: ${error.message}`);
    }
  }

  private async loadSkillCategories(userId: number): Promise<number[]> {
    const { data, error } = await supabase
      .from(this.userCategoryTable)
      .select('category_id')
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError(`Failed to load skill categories: ${error.message}`);
    }

    return data?.map((row: any) => row.category_id) || [];
  }

  /**
   * Save skill categories with transactional semantics.
   * If the insert fails, we attempt to restore the previous state.
   * This is a workaround since Supabase client doesn't support native transactions.
   */
  private async saveSkillCategories(userId: number, categoryIds: number[]): Promise<void> {
    // First, backup existing mappings for potential rollback
    const { data: existingData, error: loadError } = await supabase
      .from(this.userCategoryTable)
      .select('category_id')
      .eq('user_id', userId);

    if (loadError) {
      throw new DatabaseError(`Failed to load existing skill categories: ${loadError.message}`);
    }

    const existingCategoryIds = existingData?.map((row: any) => row.category_id) || [];

    // Delete existing mappings
    const { error: deleteError } = await supabase
      .from(this.userCategoryTable)
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      throw new DatabaseError(`Failed to delete existing skill categories: ${deleteError.message}`);
    }

    // Then insert new mappings
    if (categoryIds.length > 0) {
      const mappings = categoryIds.map(categoryId => ({
        user_id: userId,
        category_id: categoryId
      }));

      const { error: insertError } = await supabase
        .from(this.userCategoryTable)
        .insert(mappings);

      if (insertError) {
        // Attempt rollback - restore previous mappings
        console.error(`[TRANSACTION] Insert failed, attempting rollback for user ${userId}:`, insertError.message);
        
        if (existingCategoryIds.length > 0) {
          const rollbackMappings = existingCategoryIds.map(categoryId => ({
            user_id: userId,
            category_id: categoryId
          }));
          
          const { error: rollbackError } = await supabase
            .from(this.userCategoryTable)
            .insert(rollbackMappings);

          if (rollbackError) {
            console.error(`[TRANSACTION] CRITICAL: Rollback failed for user ${userId}:`, rollbackError.message);
            throw new DatabaseError(`Transaction failed and rollback failed. Data may be inconsistent. Original error: ${insertError.message}`);
          }
          
          console.log(`[TRANSACTION] Rollback successful for user ${userId}`);
        }

        throw new DatabaseError(`Failed to save skill categories: ${insertError.message}`);
      }
    }
  }
}
