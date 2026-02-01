import { FixedCosts } from './FixedCosts';
import { VariableCosts } from './VariableCosts';
import { SeniorityLevel } from './SeniorityLevel';

export class PricingProfile {
  constructor(
    public pricing_profile_id: number,
    public user_id: number,
    public fixed_costs: FixedCosts,
    public variable_costs: VariableCosts,
    public desired_monthly_income: number,
    public billable_hours_per_month: number,
    public profit_margin: number,               // 0.15 = 15%
    public experience_years: number,
    public seniority_level: SeniorityLevel,
    public skill_categories: number[],          // Array of category_id
    public base_hourly_rate?: number,           // Calculated UREA rate
    public created_at?: Date,
    public updated_at?: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.user_id <= 0) {
      throw new Error('Invalid user_id');
    }
    if (this.desired_monthly_income <= 0) {
      throw new Error('Desired monthly income must be positive');
    }
    if (this.billable_hours_per_month <= 0 || this.billable_hours_per_month > 744) {
      throw new Error('Billable hours must be between 1 and 744 (31 days * 24 hours)');
    }
    if (this.profit_margin < 0 || this.profit_margin > 1) {
      throw new Error('Profit margin must be between 0 and 1 (0% to 100%)');
    }
    if (this.experience_years < 0) {
      throw new Error('Experience years cannot be negative');
    }
  }

  public calculateBaseRate(): number {
    const totalMonthlyCosts = 
      this.fixed_costs.total() + 
      this.variable_costs.total() + 
      this.desired_monthly_income;
    
    const profit = totalMonthlyCosts * this.profit_margin;
    const totalRequired = totalMonthlyCosts + profit;
    
    return totalRequired / this.billable_hours_per_month;
  }

  public setCalculatedRate(rate: number): void {
    this.base_hourly_rate = rate;
  }
}
