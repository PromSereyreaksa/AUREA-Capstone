import { Portfolio } from '../../domain/entities/Portfolio';

export function mapPortfolioToDb(portfolio: Portfolio) {
  return {
    user_id: portfolio.user_id,
    portfolio_url: portfolio.portfolio_url,
    is_public: portfolio.is_public
  };
}

export function mapPortfolioFromDb(data: any): Portfolio {
  return new Portfolio(
    data.portfolio_id,
    data.user_id,
    data.portfolio_url,
    data.is_public
  );
}
