import { MarketBenchmark } from '../../domain/entities/MarketBenchmark';

export function mapMarketBenchmarkToDb(benchmark: MarketBenchmark) {
  return {
    category_id: benchmark.category_id,
    seniority_level: benchmark.seniority_level,
    median_hourly_rate: benchmark.median_hourly_rate,
    percentile_75_rate: benchmark.percentile_75_rate,
    sample_size: benchmark.sample_size,
    region: benchmark.region,
    last_updated: benchmark.last_updated
  };
}

export function mapMarketBenchmarkFromDb(data: any): MarketBenchmark {
  return new MarketBenchmark(
    data.benchmark_id,
    data.category_id,
    data.seniority_level,
    data.median_hourly_rate,
    data.percentile_75_rate,
    data.sample_size || 0,
    data.region || 'cambodia',
    data.last_updated
  );
}
