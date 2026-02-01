import { IMarketBenchmarkRepository } from '../../domain/repositories/IMarketBenchmarkRepository';
import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { MarketBenchmark } from '../../domain/entities/MarketBenchmark';

interface GetMarketBenchmarkInput {
  user_id: number;
  skill_categories?: number[]; // Optional: if not provided, fetch from profile
  seniority_level?: string;    // Optional: if not provided, fetch from profile
}

interface BenchmarkComparison {
  category_id: number;
  category_name?: string; // Will be populated by controller if needed
  seniority_level: string;
  median_rate: number;
  percentile_75_rate: number;
  sample_size: number;
  confidence_level: 'low' | 'medium' | 'high';
  your_rate?: number;
  your_rate_position?: 'below_median' | 'at_median' | 'above_median';
}

interface GetMarketBenchmarkOutput {
  benchmarks: BenchmarkComparison[];
  user_base_rate?: number;
  has_pricing_profile: boolean;
  market_analysis?: {
    average_median_rate: number;
    average_75th_percentile: number;
    your_position_summary: string;
  };
}

export class GetMarketBenchmark {
  constructor(
    private marketBenchmarkRepo: IMarketBenchmarkRepository,
    private pricingProfileRepo: IPricingProfileRepository
  ) {}

  async execute(input: GetMarketBenchmarkInput): Promise<GetMarketBenchmarkOutput> {
    // 1. Get user's pricing profile (if exists)
    const pricingProfile = await this.pricingProfileRepo.findByUserId(input.user_id);
    
    // 2. Determine which categories and seniority to fetch
    const skillCategories = input.skill_categories || pricingProfile?.skill_categories || [];
    const seniorityLevel = input.seniority_level || pricingProfile?.seniority_level || 'mid';

    if (skillCategories.length === 0) {
      // If no skill categories, fetch all benchmarks for the seniority level
      return this.getAllBenchmarks(seniorityLevel, pricingProfile);
    }

    // 3. Batch fetch benchmarks for all skill categories (prevents N+1 queries)
    const benchmarkMap = await this.marketBenchmarkRepo.findByCategoriesAndSeniority(
      skillCategories,
      seniorityLevel
    );

    // 4. Build benchmark comparisons from the batch result
    const benchmarks: BenchmarkComparison[] = [];
    
    for (const categoryId of skillCategories) {
      const benchmark = benchmarkMap.get(categoryId);

      if (benchmark) {
        const comparison: BenchmarkComparison = {
          category_id: benchmark.category_id,
          seniority_level: benchmark.seniority_level,
          median_rate: benchmark.median_hourly_rate,
          percentile_75_rate: benchmark.percentile_75_rate,
          sample_size: benchmark.sample_size,
          confidence_level: benchmark.getConfidenceLevel()
        };

        // Add user's rate comparison if they have a profile
        if (pricingProfile?.base_hourly_rate) {
          comparison.your_rate = pricingProfile.base_hourly_rate;
          comparison.your_rate_position = benchmark.compareRate(pricingProfile.base_hourly_rate);
        }

        benchmarks.push(comparison);
      }
    }

    // 5. Calculate market analysis
    const marketAnalysis = this.calculateMarketAnalysis(benchmarks, pricingProfile);

    return {
      benchmarks,
      user_base_rate: pricingProfile?.base_hourly_rate,
      has_pricing_profile: !!pricingProfile,
      market_analysis: marketAnalysis
    };
  }

  private async getAllBenchmarks(
    seniorityLevel: string,
    pricingProfile: any
  ): Promise<GetMarketBenchmarkOutput> {
    const allBenchmarks = await this.marketBenchmarkRepo.findAll();
    
    // Filter by seniority level
    const filteredBenchmarks = allBenchmarks
      .filter(b => b.seniority_level === seniorityLevel)
      .map(benchmark => {
        const comparison: BenchmarkComparison = {
          category_id: benchmark.category_id,
          seniority_level: benchmark.seniority_level,
          median_rate: benchmark.median_hourly_rate,
          percentile_75_rate: benchmark.percentile_75_rate,
          sample_size: benchmark.sample_size,
          confidence_level: benchmark.getConfidenceLevel()
        };

        if (pricingProfile?.base_hourly_rate) {
          comparison.your_rate = pricingProfile.base_hourly_rate;
          comparison.your_rate_position = benchmark.compareRate(pricingProfile.base_hourly_rate);
        }

        return comparison;
      });

    const marketAnalysis = this.calculateMarketAnalysis(filteredBenchmarks, pricingProfile);

    return {
      benchmarks: filteredBenchmarks,
      user_base_rate: pricingProfile?.base_hourly_rate,
      has_pricing_profile: !!pricingProfile,
      market_analysis: marketAnalysis
    };
  }

  private calculateMarketAnalysis(
    benchmarks: BenchmarkComparison[],
    pricingProfile: any
  ): {
    average_median_rate: number;
    average_75th_percentile: number;
    your_position_summary: string;
  } | undefined {
    if (benchmarks.length === 0) {
      return undefined;
    }

    const avgMedian = benchmarks.reduce((sum, b) => sum + b.median_rate, 0) / benchmarks.length;
    const avg75th = benchmarks.reduce((sum, b) => sum + b.percentile_75_rate, 0) / benchmarks.length;

    let positionSummary = 'No pricing profile set';
    
    if (pricingProfile?.base_hourly_rate) {
      const userRate = pricingProfile.base_hourly_rate;
      
      if (userRate < avgMedian * 0.9) {
        positionSummary = 'Below market average - consider increasing your rates';
      } else if (userRate < avgMedian * 1.1) {
        positionSummary = 'At market average - competitive positioning';
      } else if (userRate < avg75th) {
        positionSummary = 'Above market average - good positioning';
      } else {
        positionSummary = 'Premium pricing - top tier positioning';
      }
    }

    return {
      average_median_rate: Math.round(avgMedian * 100) / 100,
      average_75th_percentile: Math.round(avg75th * 100) / 100,
      your_position_summary: positionSummary
    };
  }
}
