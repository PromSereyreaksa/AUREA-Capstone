import { Portfolio } from '../../domain/entities/Portfolio';
import { PublicPortfolioItem } from '../../domain/repositories/IPortfolioRepository';

export function mapPortfolioToDb(portfolio: Portfolio) {
  const result: any = {
    user_id: portfolio.user_id,
    is_public: portfolio.is_public
  };
  
  // Add portfolio_url if present (stores Supabase public URL)
  if (portfolio.portfolio_url !== undefined) {
    result.portfolio_url = portfolio.portfolio_url;
  }

  if (portfolio.portfolio_cover_url !== undefined) {
    result.portfolio_cover_url = portfolio.portfolio_cover_url;
  }
  
  return result;
}

export function mapPortfolioFromDb(data: any): Portfolio {
  return new Portfolio(
    data.portfolio_id,
    data.user_id,
    data.portfolio_url,
    data.portfolio_cover_url,
    data.is_public
  );
}

export function mapPublicPortfolioFromDb(data: any): PublicPortfolioItem {
  const profile = data.user_profile || {};
  const userCategories = data.user_category || [];

  // Parse skills - it might be a JSON string or already an array
  let skills: string[] = [];
  if (profile.skills) {
    if (typeof profile.skills === 'string') {
      try {
        skills = JSON.parse(profile.skills);
      } catch {
        skills = [profile.skills];
      }
    } else if (Array.isArray(profile.skills)) {
      skills = profile.skills;
    }
  }

  // Map categories from the nested join structure
  const categories = userCategories
    .filter((uc: any) => uc.category)
    .map((uc: any) => ({
      category_id: uc.category.category_id,
      category_name: uc.category.category_name
    }));

  return {
    portfolio_id: data.portfolio_id,
    portfolio_url: data.portfolio_url,
    portfolio_cover_url: data.portfolio_cover_url || null,
    is_public: data.is_public,
    user_id: data.user_id,
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    profile_avatar: profile.profile_avatar || null,
    skills,
    seniority_level: profile.seniority_level || null,
    categories
  };
}
