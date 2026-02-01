export class MarketBenchmark {
  constructor(
    public benchmark_id: number,
    public category_id: number,                 // Links to Category entity
    public seniority_level: string,
    public median_hourly_rate: number,          // Cambodia market median (USD)
    public percentile_75_rate: number,          // 75th percentile (USD)
    public sample_size: number,                 // Data reliability indicator
    public region: string,                      // 'cambodia'
    public last_updated: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.category_id <= 0) {
      throw new Error('Invalid category_id');
    }
    if (this.median_hourly_rate < 0 || this.percentile_75_rate < 0) {
      throw new Error('Hourly rates must be non-negative');
    }
    if (this.percentile_75_rate < this.median_hourly_rate) {
      throw new Error('75th percentile rate must be greater than or equal to median rate');
    }
    if (this.sample_size < 0) {
      throw new Error('Sample size cannot be negative');
    }
  }

  public compareRate(userRate: number): 'below_median' | 'at_median' | 'above_median' {
    const tolerance = 0.5; // $0.50 tolerance for "at median"
    
    if (userRate < this.median_hourly_rate - tolerance) {
      return 'below_median';
    } else if (userRate > this.median_hourly_rate + tolerance) {
      return 'above_median';
    } else {
      return 'at_median';
    }
  }

  public isReliable(): boolean {
    // Consider data reliable if sample size >= 10
    return this.sample_size >= 10;
  }

  public getConfidenceLevel(): 'low' | 'medium' | 'high' {
    if (this.sample_size < 10) return 'low';
    if (this.sample_size < 30) return 'medium';
    return 'high';
  }
}
