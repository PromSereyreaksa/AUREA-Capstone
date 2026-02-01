import { supabase } from '../db/supabaseClient';
import { IMarketBenchmarkRepository } from '../../domain/repositories/IMarketBenchmarkRepository';
import { MarketBenchmark } from '../../domain/entities/MarketBenchmark';
import { mapMarketBenchmarkToDb, mapMarketBenchmarkFromDb } from '../mappers/marketBenchmarkMapper';
import { DatabaseError } from '../../shared/errors/AppError';
import { marketBenchmarkCache, generateCacheKey } from '../services/CacheService';

export class MarketBenchmarkRepository implements IMarketBenchmarkRepository {
  private tableName = 'market_benchmarks';

  async findByCategoryAndSeniority(categoryId: number, seniorityLevel: string): Promise<MarketBenchmark | null> {
    const cacheKey = generateCacheKey('benchmark', categoryId, seniorityLevel.toLowerCase());
    
    // Check cache first
    const cached = marketBenchmarkCache.get(cacheKey);
    if (cached !== null) {
      return cached as MarketBenchmark | null;
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('category_id', categoryId)
      .eq('seniority_level', seniorityLevel.toLowerCase())
      .eq('region', 'cambodia')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        // Cache null result to avoid repeated queries
        marketBenchmarkCache.set(cacheKey, null);
        return null;
      }
      throw new DatabaseError(`Failed to find market benchmark: ${error.message}`);
    }

    const result = data ? mapMarketBenchmarkFromDb(data) : null;
    marketBenchmarkCache.set(cacheKey, result);
    return result;
  }

  async findByCategory(categoryId: number): Promise<MarketBenchmark[]> {
    const cacheKey = generateCacheKey('benchmark:category', categoryId);
    
    const cached = marketBenchmarkCache.get(cacheKey);
    if (cached !== null) {
      return cached as MarketBenchmark[];
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('category_id', categoryId)
      .eq('region', 'cambodia')
      .order('seniority_level', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to find market benchmarks: ${error.message}`);
    }

    const result = data?.map(mapMarketBenchmarkFromDb) || [];
    marketBenchmarkCache.set(cacheKey, result);
    return result;
  }

  async findByRegion(region: string): Promise<MarketBenchmark[]> {
    const cacheKey = generateCacheKey('benchmark:region', region.toLowerCase());
    
    const cached = marketBenchmarkCache.get(cacheKey);
    if (cached !== null) {
      return cached as MarketBenchmark[];
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('region', region.toLowerCase())
      .order('category_id', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to find market benchmarks by region: ${error.message}`);
    }

    const result = data?.map(mapMarketBenchmarkFromDb) || [];
    marketBenchmarkCache.set(cacheKey, result);
    return result;
  }

  async findAll(): Promise<MarketBenchmark[]> {
    const cacheKey = 'benchmark:all:cambodia';
    
    const cached = marketBenchmarkCache.get(cacheKey);
    if (cached !== null) {
      return cached as MarketBenchmark[];
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('region', 'cambodia')
      .order('category_id', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch all market benchmarks: ${error.message}`);
    }

    const result = data?.map(mapMarketBenchmarkFromDb) || [];
    marketBenchmarkCache.set(cacheKey, result);
    return result;
  }

  async upsert(benchmark: MarketBenchmark): Promise<MarketBenchmark> {
    const dbData = mapMarketBenchmarkToDb(benchmark);

    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(dbData, {
        onConflict: 'category_id,seniority_level,region'
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to upsert market benchmark: ${error.message}`);
    }

    // Invalidate related cache entries
    marketBenchmarkCache.invalidateByPrefix('benchmark');

    return mapMarketBenchmarkFromDb(data);
  }

  /**
   * Batch fetch benchmarks for multiple categories at once.
   * Uses Supabase's IN operator for a single efficient query.
   * @param categoryIds - Array of category IDs to fetch
   * @param seniorityLevel - The seniority level to filter by
   * @returns Map of categoryId to MarketBenchmark
   */
  async findByCategoriesAndSeniority(
    categoryIds: number[], 
    seniorityLevel: string
  ): Promise<Map<number, MarketBenchmark>> {
    const result = new Map<number, MarketBenchmark>();

    if (categoryIds.length === 0) {
      return result;
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .in('category_id', categoryIds)
      .eq('seniority_level', seniorityLevel.toLowerCase())
      .eq('region', 'cambodia');

    if (error) {
      throw new DatabaseError(`Failed to batch fetch market benchmarks: ${error.message}`);
    }

    // Map results by category_id for O(1) lookup
    if (data) {
      for (const row of data) {
        const benchmark = mapMarketBenchmarkFromDb(row);
        result.set(benchmark.category_id, benchmark);
      }
    }

    return result;
  }
}
