import { MarketBenchmark } from '../entities/MarketBenchmark';

export interface IMarketBenchmarkRepository {
  findByCategoryAndSeniority(categoryId: number, seniorityLevel: string): Promise<MarketBenchmark | null>;
  findByCategory(categoryId: number): Promise<MarketBenchmark[]>;
  findByRegion(region: string): Promise<MarketBenchmark[]>;
  findAll(): Promise<MarketBenchmark[]>;
  upsert(benchmark: MarketBenchmark): Promise<MarketBenchmark>;
  
  /**
   * Batch fetch benchmarks for multiple categories at once.
   * Prevents N+1 query patterns when fetching benchmarks for multiple skill categories.
   * @param categoryIds - Array of category IDs to fetch
   * @param seniorityLevel - The seniority level to filter by
   * @returns Map of categoryId to MarketBenchmark
   */
  findByCategoriesAndSeniority(categoryIds: number[], seniorityLevel: string): Promise<Map<number, MarketBenchmark>>;
}
