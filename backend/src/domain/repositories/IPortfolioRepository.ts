import { Portfolio } from '../entities/Portfolio';

export interface PublicPortfolioFilters {
  page: number;
  limit: number;
  search?: string;
  categoryIds?: number[];
}

export interface PublicPortfolioItem {
  portfolio_id: number;
  portfolio_url: string;
  is_public: boolean;
  user_id: number;
  first_name: string;
  last_name: string;
  profile_avatar: string | null;
  skills: string[];
  seniority_level: string | null;
  categories: { category_id: number; category_name: string }[];
}

export interface PublicPortfolioResult {
  data: PublicPortfolioItem[];
  total: number;
}

export interface IPortfolioRepository {
  create(portfolio: Portfolio): Promise<Portfolio>;
  findByUserId(user_id: number): Promise<Portfolio | null>;
  update(user_id: number, portfolio: Partial<Portfolio>): Promise<Portfolio>;
  delete(user_id: number): Promise<void>;
  findPublicPortfolios(filters: PublicPortfolioFilters): Promise<PublicPortfolioResult>;
  findPublicPortfolioById(portfolio_id: number): Promise<PublicPortfolioItem | null>;
}
