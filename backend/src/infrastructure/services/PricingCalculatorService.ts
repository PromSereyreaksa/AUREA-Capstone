import { FixedCosts } from '../../domain/entities/FixedCosts';
import { VariableCosts } from '../../domain/entities/VariableCosts';
import { SeniorityLevel, SeniorityMultiplier } from '../../domain/entities/SeniorityLevel';
import { ClientContext } from '../../domain/entities/ClientContext';

/**
 * PricingCalculatorService
 * 
 * Pure calculation logic for UREA pricing framework.
 * No I/O operations, no side effects - infrastructure utility.
 * 
 * UREA Formula:
 * Base Rate = (Total Monthly Costs + Desired Income + Profit) / Billable Hours
 * where Profit = (Costs + Income) * Profit Margin
 */
export class PricingCalculatorService {
  
  /**
   * Calculate sustainability baseline hourly rate using UREA formula
   * 
   * @param fixedCosts - Monthly fixed costs (rent, equipment, etc.)
   * @param variableCosts - Monthly variable costs (materials, etc.)
   * @param desiredIncome - Desired monthly take-home income
   * @param profitMargin - Profit margin as decimal (0.15 = 15%)
   * @param billableHours - Billable hours per month
   * @returns Base hourly rate in USD
   */
  public static calculateSustainabilityRate(
    fixedCosts: FixedCosts,
    variableCosts: VariableCosts,
    desiredIncome: number,
    profitMargin: number,
    billableHours: number
  ): number {
    if (billableHours <= 0) {
      throw new Error('Billable hours must be greater than 0');
    }
    if (profitMargin < 0 || profitMargin > 1) {
      throw new Error('Profit margin must be between 0 and 1');
    }

    const totalMonthlyCosts = fixedCosts.total() + variableCosts.total() + desiredIncome;
    const profit = totalMonthlyCosts * profitMargin;
    const totalRequired = totalMonthlyCosts + profit;
    
    return totalRequired / billableHours;
  }

  /**
   * Calculate detailed breakdown of UREA rate calculation
   * Useful for showing users how their rate is derived
   * 
   * @returns Object with all calculation components
   */
  public static calculateWithBreakdown(
    fixedCosts: FixedCosts,
    variableCosts: VariableCosts,
    desiredIncome: number,
    profitMargin: number,
    billableHours: number
  ): {
    base_hourly_rate: number;
    breakdown: {
      fixed_costs_total: number;
      variable_costs_total: number;
      desired_income: number;
      total_monthly_costs: number;
      profit_margin_percentage: number;
      profit_amount: number;
      total_required: number;
      billable_hours: number;
    };
  } {
    const fixedTotal = fixedCosts.total();
    const variableTotal = variableCosts.total();
    const totalMonthlyCosts = fixedTotal + variableTotal + desiredIncome;
    const profitAmount = totalMonthlyCosts * profitMargin;
    const totalRequired = totalMonthlyCosts + profitAmount;
    const baseRate = totalRequired / billableHours;

    return {
      base_hourly_rate: Math.round(baseRate * 100) / 100, // Round to 2 decimals
      breakdown: {
        fixed_costs_total: Math.round(fixedTotal * 100) / 100,
        variable_costs_total: Math.round(variableTotal * 100) / 100,
        desired_income: Math.round(desiredIncome * 100) / 100,
        total_monthly_costs: Math.round(totalMonthlyCosts * 100) / 100,
        profit_margin_percentage: Math.round(profitMargin * 100),
        profit_amount: Math.round(profitAmount * 100) / 100,
        total_required: Math.round(totalRequired * 100) / 100,
        billable_hours: billableHours
      }
    };
  }

  /**
   * Apply multipliers to base rate for project-specific pricing
   * 
   * @param baseRate - Calculated UREA base rate
   * @param seniorityLevel - Designer's seniority level
   * @param clientContext - Client type and region (optional)
   * @returns Adjusted hourly rate
   */
  public static applyMultipliers(
    baseRate: number,
    seniorityLevel: SeniorityLevel,
    clientContext?: ClientContext
  ): number {
    if (baseRate <= 0) {
      throw new Error('Base rate must be positive');
    }

    const seniorityMultiplier = SeniorityMultiplier.getMultiplier(seniorityLevel);
    const contextMultiplier = clientContext ? clientContext.getContextMultiplier() : 1.0;
    
    return baseRate * seniorityMultiplier * contextMultiplier;
  }

  /**
   * Calculate project rate with detailed breakdown of multipliers
   * 
   * @returns Object with final rate and all multipliers applied
   */
  public static calculateProjectRateWithBreakdown(
    baseRate: number,
    seniorityLevel: SeniorityLevel,
    clientContext?: ClientContext
  ): {
    base_rate: number;
    seniority_level: string;
    seniority_multiplier: number;
    client_type?: string;
    client_region?: string;
    context_multiplier: number;
    final_hourly_rate: number;
  } {
    const seniorityMultiplier = SeniorityMultiplier.getMultiplier(seniorityLevel);
    const contextMultiplier = clientContext ? clientContext.getContextMultiplier() : 1.0;
    const finalRate = baseRate * seniorityMultiplier * contextMultiplier;

    return {
      base_rate: Math.round(baseRate * 100) / 100,
      seniority_level: seniorityLevel,
      seniority_multiplier: seniorityMultiplier,
      client_type: clientContext?.clientType,
      client_region: clientContext?.clientRegion,
      context_multiplier: Math.round(contextMultiplier * 100) / 100,
      final_hourly_rate: Math.round(finalRate * 100) / 100
    };
  }

  /**
   * Estimate monthly revenue based on hourly rate
   * 
   * @param hourlyRate - Hourly rate in USD
   * @param billableHours - Expected billable hours per month
   * @returns Estimated monthly revenue
   */
  public static estimateMonthlyRevenue(hourlyRate: number, billableHours: number): number {
    return Math.round(hourlyRate * billableHours * 100) / 100;
  }

  /**
   * Calculate annual revenue projection
   * 
   * @param hourlyRate - Hourly rate in USD
   * @param billableHoursPerMonth - Average billable hours per month
   * @param monthsPerYear - Working months per year (default 12)
   * @returns Estimated annual revenue
   */
  public static estimateAnnualRevenue(
    hourlyRate: number,
    billableHoursPerMonth: number,
    monthsPerYear: number = 12
  ): number {
    const monthlyRevenue = hourlyRate * billableHoursPerMonth;
    return Math.round(monthlyRevenue * monthsPerYear * 100) / 100;
  }

  /**
   * Validate if current rate meets sustainability requirements
   * 
   * @param currentRate - Current hourly rate
   * @param sustainabilityRate - Calculated UREA base rate
   * @returns Status: 'unsustainable', 'sustainable', 'excellent'
   */
  public static validateRateSustainability(
    currentRate: number,
    sustainabilityRate: number
  ): 'unsustainable' | 'sustainable' | 'excellent' {
    const ratio = currentRate / sustainabilityRate;
    
    if (ratio < 1.0) return 'unsustainable';
    if (ratio < 1.2) return 'sustainable';
    return 'excellent';
  }

  /**
   * Convert hourly rate to project-based pricing
   * 
   * @param hourlyRate - Hourly rate in USD
   * @param estimatedHours - Estimated project hours
   * @param bufferPercentage - Buffer for scope creep (0.15 = 15%)
   * @returns Project fixed price
   */
  public static convertToProjectPrice(
    hourlyRate: number,
    estimatedHours: number,
    bufferPercentage: number = 0.15
  ): number {
    const basePrice = hourlyRate * estimatedHours;
    const buffer = basePrice * bufferPercentage;
    return Math.round((basePrice + buffer) * 100) / 100;
  }

  /**
   * Calculate KHR (Cambodian Riel) equivalent
   * Note: Exchange rate should be fetched from API in production
   * 
   * @param usdAmount - Amount in USD
   * @param exchangeRate - USD to KHR rate (default ~4000)
   * @returns Amount in KHR
   */
  public static convertToKHR(usdAmount: number, exchangeRate: number = 4000): number {
    return Math.round(usdAmount * exchangeRate);
  }
}
