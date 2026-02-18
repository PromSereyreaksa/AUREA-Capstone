import { Portfolio } from '../entities/Portfolio';

export interface IPortfolioRepository {
  create(portfolio: Portfolio): Promise<Portfolio>;
  findByUserId(user_id: number): Promise<Portfolio | null>;
  update(user_id: number, portfolio: Partial<Portfolio>): Promise<Portfolio>;
  delete(user_id: number): Promise<void>;
}
