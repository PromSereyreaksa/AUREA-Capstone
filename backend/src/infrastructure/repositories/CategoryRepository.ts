import { supabase } from '../db/supabaseClient';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { Category } from '../../domain/entities/Category';
import { DatabaseError } from '../../shared/errors/AppError';
import { findBestMatch } from '../../shared/utils/stringMatch';

export class CategoryRepository implements ICategoryRepository {
  private tableName = 'category';

  /**
   * Find a category by fuzzy name matching.
   * Fetches all categories and uses Levenshtein distance to find the best match.
   * Falls back to SQL ILIKE if an exact substring match exists.
   */
  async findByNameLike(name: string): Promise<Category | null> {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }

    const all = await this.findAll();
    if (all.length === 0) {
      return null;
    }

    const candidates = all.map((c) => ({
      label: c.category_name,
      value: c
    }));

    const match = findBestMatch(trimmed, candidates, 0.4);
    return match ? match.value : null;
  }

  async findAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('category_id', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch categories: ${error.message}`);
    }

    return (data || []).map(
      (row: any) => new Category(row.category_id, row.category_name)
    );
  }
}
