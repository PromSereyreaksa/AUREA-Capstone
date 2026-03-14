import { IPortfolioRepository, PublicPortfolioFilters, PublicPortfolioResult, PublicPortfolioItem } from '../../domain/repositories/IPortfolioRepository';
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

  async findPublicPortfolioById(portfolio_id: number): Promise<PublicPortfolioItem | null> {
    // First, get the portfolio ensuring it is public and has a PDF
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolio')
      .select('portfolio_id, user_id, portfolio_url, is_public')
      .eq('portfolio_id', portfolio_id)
      .eq('is_public', true)
      .not('portfolio_url', 'is', null)
      .maybeSingle();

    if (portfolioError) {
      throw new DatabaseError(`Failed to fetch public portfolio: ${portfolioError.message}`);
    }

    if (!portfolio) {
      return null;
    }

    const userId = portfolio.user_id;

    // Fetch basic user info
    const { data: userData, error: usersError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (usersError) {
      const errorMsg = typeof usersError.message === 'string'
        ? usersError.message
        : JSON.stringify(usersError);
      throw new DatabaseError(`Failed to fetch user: ${errorMsg}`);
    }

    // Fetch profile (avatar, skills, seniority)
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('user_id, profile_avatar, skills, seniority_level')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      const errorMsg = typeof profileError.message === 'string'
        ? profileError.message
        : JSON.stringify(profileError);
      throw new DatabaseError(`Failed to fetch user profile: ${errorMsg}`);
    }

    // Fetch categories for this portfolio
    const { data: userCategoriesData, error: ucError } = await supabase
      .from('user_category')
      .select('portfolio_id, category_id')
      .eq('portfolio_id', portfolio.portfolio_id);

    if (ucError) {
      const errorMsg = typeof ucError.message === 'string'
        ? ucError.message
        : JSON.stringify(ucError);
      throw new DatabaseError(`Failed to fetch portfolio categories: ${errorMsg}`);
    }

    let categories: { category_id: number; category_name: string }[] = [];

    if (userCategoriesData && userCategoriesData.length > 0) {
      const categoryIds = [...new Set(userCategoriesData.map((uc: any) => uc.category_id))];

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('category')
        .select('category_id, category_name')
        .in('category_id', categoryIds);

      if (categoriesError) {
        const errorMsg = typeof categoriesError.message === 'string'
          ? categoriesError.message
          : JSON.stringify(categoriesError);
        throw new DatabaseError(`Failed to fetch categories: ${errorMsg}`);
      }

      const categoryLookup = new Map((categoriesData || []).map((c: any) => [c.category_id, c.category_name]));

      categories = userCategoriesData
        .map((uc: any) => {
          const categoryName = categoryLookup.get(uc.category_id);
          return categoryName
            ? { category_id: uc.category_id, category_name: categoryName }
            : null;
        })
        .filter(
          (
            c,
          ): c is { category_id: number; category_name: string } => c !== null,
        );
    }

    const merged = {
      ...portfolio,
      user_profile: {
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        profile_avatar: profile?.profile_avatar || null,
        skills: profile?.skills || null,
        seniority_level: profile?.seniority_level || null,
      },
      user_category: categories.map((c: any) => ({ category: c })),
    };

    return mapPublicPortfolioFromDb(merged);
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
        const errorMsg = typeof ucError.message === 'string' 
          ? ucError.message 
          : JSON.stringify(ucError);
        throw new DatabaseError(`Failed to filter by categories: ${errorMsg}`);
      }

      portfolioIdsFromCategories = [...new Set((userCategoryData || []).map((uc: any) => uc.portfolio_id))];
      
      // If no portfolios match the category filter, return empty
      if (portfolioIdsFromCategories.length === 0) {
        return { data: [], total: 0 };
      }
    }

    // Step 2: If search is provided, get matching user_ids
    // Names are in 'users' table, skills are in 'user_profile' table
    let userIdsFromSearch: number[] | null = null;
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      
      // Search by name in users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id')
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`);

      if (usersError) {
        const errorMsg = typeof usersError.message === 'string' 
          ? usersError.message 
          : JSON.stringify(usersError);
        throw new DatabaseError(`Failed to search users: ${errorMsg}`);
      }

      // Search by skills in user_profile table
      // Skills is stored as TEXT but may contain JSON - gracefully handle type mismatches
      let profileData: any[] = [];
      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('user_id, skills')
          .not('skills', 'is', null);

        if (!error && data) {
          // Filter in-memory since TEXT/JSONB type issues can occur with ilike
          const searchLower = search.trim().toLowerCase();
          profileData = data.filter((p: any) => {
            if (!p.skills) return false;
            const skillsStr = typeof p.skills === 'string' ? p.skills : JSON.stringify(p.skills);
            return skillsStr.toLowerCase().includes(searchLower);
          });
        }
      } catch (err) {
        console.warn('Skills search failed, using name search only:', err);
      }

      // Combine unique user_ids from both searches
      const userIdsFromUsers = (usersData || []).map((u: any) => u.user_id);
      const userIdsFromProfile = profileData.map((p: any) => p.user_id);
      userIdsFromSearch = [...new Set([...userIdsFromUsers, ...userIdsFromProfile])];
      
      // If no users match the search, return empty
      if (userIdsFromSearch.length === 0) {
        return { data: [], total: 0 };
      }
    }

    // Step 3: Build base query for portfolios
    const buildBaseQuery = () => {
      let q = supabase
        .from('portfolio')
        .select('portfolio_id, user_id, portfolio_url, is_public, updated_at', { count: 'exact' })
        .eq('is_public', true)
        .not('portfolio_url', 'is', null);

      if (portfolioIdsFromCategories !== null) {
        q = q.in('portfolio_id', portfolioIdsFromCategories);
      }
      if (userIdsFromSearch !== null) {
        q = q.in('user_id', userIdsFromSearch);
      }
      return q;
    };

    // First, get the count
    const { count, error: countError } = await buildBaseQuery();
    
    if (countError) {
      console.error('[findPublicPortfolios] Count error:', countError);
      throw new DatabaseError(`Failed to count portfolios: ${countError.message || 'Unknown error'}`);
    }

    const total = count || 0;

    // If offset is beyond total, return empty result
    if (offset >= total) {
      return { data: [], total };
    }

    // Now fetch the actual data with pagination
    const { data: portfolios, error: portfolioError } = await buildBaseQuery()
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (portfolioError) {
      console.error('[findPublicPortfolios] Supabase error:', portfolioError);
      throw new DatabaseError(`Failed to fetch public portfolios: ${portfolioError.message || 'Unknown error'}`);
    }

    if (!portfolios || portfolios.length === 0) {
      return { data: [], total };
    }

    // Step 4: Fetch user data for the returned portfolios
    const userIds = portfolios.map((p: any) => p.user_id);
    
    // Handle case where userIds is empty
    if (userIds.length === 0) {
      const mappedData = portfolios.map((portfolio: any) => ({
        ...portfolio,
        user_profile: {
          first_name: '',
          last_name: '',
          profile_avatar: null,
          skills: null,
          seniority_level: null
        }
      })).map(mapPublicPortfolioFromDb);
      return { data: mappedData, total };
    }
    
    // Get names from users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds);

    if (usersError) {
      const errorMsg = typeof usersError.message === 'string' 
        ? usersError.message 
        : JSON.stringify(usersError);
      throw new DatabaseError(`Failed to fetch users: ${errorMsg}`);
    }

    // Get profile data (avatar, skills, seniority) from user_profile table
    const { data: profiles, error: profileError } = await supabase
      .from('user_profile')
      .select('user_id, profile_avatar, skills, seniority_level')
      .in('user_id', userIds);

    if (profileError) {
      const errorMsg = typeof profileError.message === 'string' 
        ? profileError.message 
        : JSON.stringify(profileError);
      throw new DatabaseError(`Failed to fetch user profiles: ${errorMsg}`);
    }

    // Get categories for portfolios
    const portfolioIds = portfolios.map((p: any) => p.portfolio_id);
    let categoriesMap = new Map<number, { category_id: number; category_name: string }[]>();
    
    if (portfolioIds.length > 0) {
      const { data: userCategoriesData, error: ucError } = await supabase
        .from('user_category')
        .select('portfolio_id, category_id')
        .in('portfolio_id', portfolioIds);

      if (!ucError && userCategoriesData && userCategoriesData.length > 0) {
        // Get unique category IDs
        const categoryIds = [...new Set(userCategoriesData.map((uc: any) => uc.category_id))];
        
        // Fetch category names
        const { data: categoriesData } = await supabase
          .from('category')
          .select('category_id, category_name')
          .in('category_id', categoryIds);

        // Create category lookup map
        const categoryLookup = new Map((categoriesData || []).map((c: any) => [c.category_id, c.category_name]));

        // Group categories by portfolio_id
        for (const uc of userCategoriesData) {
          const categoryName = categoryLookup.get(uc.category_id);
          if (categoryName) {
            const existing = categoriesMap.get(uc.portfolio_id) || [];
            existing.push({ category_id: uc.category_id, category_name: categoryName });
            categoriesMap.set(uc.portfolio_id, existing);
          }
        }
      }
    }

    // Create maps for quick lookup
    const userMap = new Map((usersData || []).map((u: any) => [u.user_id, u]));
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Step 5: Merge portfolios with user, profile, and category data
    const mergedData = portfolios.map((portfolio: any) => {
      const user = userMap.get(portfolio.user_id) || {};
      const profile = profileMap.get(portfolio.user_id) || {};
      const categories = categoriesMap.get(portfolio.portfolio_id) || [];
      return {
        ...portfolio,
        user_profile: {
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          profile_avatar: profile.profile_avatar || null,
          skills: profile.skills || null,
          seniority_level: profile.seniority_level || null
        },
        user_category: categories.map((c: any) => ({ category: c }))
      };
    });

    const mappedData = mergedData.map(mapPublicPortfolioFromDb);

    return {
      data: mappedData,
      total
    };
  }
}
