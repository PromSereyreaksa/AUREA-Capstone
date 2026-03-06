import { IPortfolioRepository, PublicPortfolioFilters, PublicPortfolioResult } from '../../domain/repositories/IPortfolioRepository';
import { Portfolio } from '../../domain/entities/Portfolio';
import { supabase } from '../db/supabaseClient';
import { DatabaseError } from '../../shared/errors';
import { mapPortfolioFromDb, mapPortfolioToDb, mapPublicPortfolioFromDb } from '../mappers/portfolioMapper';

export class PortfolioRepository implements IPortfolioRepository {
  async create(portfolio: Portfolio): Promise<Portfolio> {
    const row = mapPortfolioToDb(portfolio);

    const { data, error } = await supabase
      .from('portfolio')
      .insert([row])
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create portfolio: ${error.message}`);
    }

    return mapPortfolioFromDb(data);
  }

  async findByUserId(user_id: number): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from('portfolio')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to find portfolio: ${error.message}`);
    }

    if (!data) return null;

    return mapPortfolioFromDb(data);
  }

  async update(user_id: number, portfolio: Partial<Portfolio>): Promise<Portfolio> {
    // Check if portfolio exists first
    const { data: existingPortfolio } = await supabase
      .from('portfolio')
      .select('portfolio_id')
      .eq('user_id', user_id)
      .single();

    // If portfolio doesn't exist, create it instead
    if (!existingPortfolio) {
      const newPortfolio: any = {
        user_id,
        portfolio_url: portfolio.portfolio_url,
        is_public: portfolio.is_public ?? false,
      };

      const { data: createdData, error: createError } = await supabase
        .from('portfolio')
        .insert(newPortfolio)
        .select()
        .single();

      if (createError) {
        throw new DatabaseError(`Failed to create portfolio: ${createError.message}`);
      }

      return mapPortfolioFromDb(createdData);
    }

    // Update existing portfolio
    const row = mapPortfolioToDb(portfolio as Portfolio);

    const { data, error } = await supabase
      .from('portfolio')
      .update(row)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update portfolio: ${error.message}`);
    }

    return mapPortfolioFromDb(data);
  }

  async delete(user_id: number): Promise<void> {
    const { error } = await supabase
      .from('portfolio')
      .delete()
      .eq('user_id', user_id);

    if (error) {
      throw new DatabaseError(`Failed to delete portfolio: ${error.message}`);
    }
  }

  async findPublicPortfolios(filters: PublicPortfolioFilters): Promise<PublicPortfolioResult> {
    const { page, limit, search, categoryIds } = filters;
    const offset = (page - 1) * limit;

    // Step 1: If categoryIds filter is provided, get matching portfolio_ids
    let portfolioIdsFromCategories: number[] | null = null;
    if (categoryIds && categoryIds.length > 0) {
      const { data: userCategoryData, error: ucError } = await supabase
        .from('user_category')
        .select('portfolio_id')
        .in('category_id', categoryIds);

      if (ucError) {
        throw new DatabaseError(`Failed to filter by categories: ${ucError.message}`);
      }

      portfolioIdsFromCategories = [...new Set((userCategoryData || []).map((uc: any) => uc.portfolio_id))];
      
      // If no portfolios match the category filter, return empty
      if (portfolioIdsFromCategories.length === 0) {
        return { data: [], total: 0 };
      }
    }

    // Step 2: If search is provided, get matching user_ids from user_profile
    let userIdsFromSearch: number[] | null = null;
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('user_id, first_name, last_name, skills')
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},skills.ilike.${searchTerm}`);

      if (profileError) {
        throw new DatabaseError(`Failed to search profiles: ${profileError.message}`);
      }

      userIdsFromSearch = (profileData || []).map((p: any) => p.user_id);
      
      // If no users match the search, return empty
      if (userIdsFromSearch.length === 0) {
        return { data: [], total: 0 };
      }
    }

    // Step 3: Query portfolios (portfolio and user_profile are not directly linked, 
    // they both link to users via user_id, so we query separately and merge)
    let portfolioQuery = supabase
      .from('portfolio')
      .select(`
        portfolio_id,
        user_id,
        portfolio_url,
        is_public,
        updated_at,
        user_category (
          category:category (
            category_id,
            category_name
          )
        )
      `, { count: 'exact' })
      .eq('is_public', true)
      .not('portfolio_url', 'is', null);

    // Apply category filter
    if (portfolioIdsFromCategories !== null) {
      portfolioQuery = portfolioQuery.in('portfolio_id', portfolioIdsFromCategories);
    }

    // Apply search filter
    if (userIdsFromSearch !== null) {
      portfolioQuery = portfolioQuery.in('user_id', userIdsFromSearch);
    }

    // Apply ordering and pagination
    portfolioQuery = portfolioQuery
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: portfolios, error: portfolioError, count } = await portfolioQuery;

    if (portfolioError) {
      throw new DatabaseError(`Failed to fetch public portfolios: ${portfolioError.message}`);
    }

    if (!portfolios || portfolios.length === 0) {
      return { data: [], total: count || 0 };
    }

    // Step 4: Fetch user profiles for the returned portfolios
    const userIds = portfolios.map((p: any) => p.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('user_profile')
      .select('user_id, first_name, last_name, profile_avatar, skills, seniority_level')
      .in('user_id', userIds);

    if (profileError) {
      throw new DatabaseError(`Failed to fetch user profiles: ${profileError.message}`);
    }

    // Create a map of user_id -> profile for quick lookup
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Step 5: Merge portfolios with profiles
    const mergedData = portfolios.map((portfolio: any) => {
      const profile = profileMap.get(portfolio.user_id) || {};
      return {
        ...portfolio,
        user_profile: profile
      };
    });

    const mappedData = mergedData.map(mapPublicPortfolioFromDb);

    return {
      data: mappedData,
      total: count || 0
    };
  }
}
