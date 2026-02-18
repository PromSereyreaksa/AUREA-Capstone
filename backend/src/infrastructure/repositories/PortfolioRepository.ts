import { IPortfolioRepository } from '../../domain/repositories/IPortfolioRepository';
import { Portfolio } from '../../domain/entities/Portfolio';
import { supabase } from '../db/supabaseClient';
import { DatabaseError } from '../../shared/errors';
import { mapPortfolioFromDb, mapPortfolioToDb } from '../mappers/portfolioMapper';

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
}
