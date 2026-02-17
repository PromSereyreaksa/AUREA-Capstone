import { Portfolio } from '../../domain/entities/Portfolio';

export function mapPortfolioToDb(portfolio: Portfolio) {
  const result: any = {
    user_id: portfolio.user_id,
    is_public: portfolio.is_public
  };
  
  // Add portfolio_url if present (stores Supabase public URL)
  if (portfolio.portfolio_url !== undefined) {
    result.portfolio_url = portfolio.portfolio_url;
  }
  
  return result;
}

export function mapPortfolioFromDb(data: any): Portfolio {
  return new Portfolio(
    data.portfolio_id,
    data.user_id,
    data.portfolio_url,
    data.is_public
  );
}
