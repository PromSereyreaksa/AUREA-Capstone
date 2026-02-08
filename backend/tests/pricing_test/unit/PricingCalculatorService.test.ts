/**
 * Unit Tests: PricingCalculatorService
 * 
 * Tests the pure calculation functions for AUREA pricing framework.
 * No I/O, no database - just math.
 * 
 * @jest-environment node
 */

import { PricingCalculatorService } from '../../../src/infrastructure/services/PricingCalculatorService';
import { FixedCosts } from '../../../src/domain/entities/FixedCosts';
import { VariableCosts } from '../../../src/domain/entities/VariableCosts';
import { SeniorityLevel } from '../../../src/domain/entities/SeniorityLevel';
import { ClientContext, ClientType, ClientRegion } from '../../../src/domain/entities/ClientContext';

describe('PricingCalculatorService', () => {
  
  // Test data factories
  const createFixedCosts = (overrides?: Partial<{
    rent: number; equipment: number; insurance: number; utilities: number; taxes: number;
  }>) => new FixedCosts(
    overrides?.rent ?? 200,
    overrides?.equipment ?? 100,
    overrides?.insurance ?? 50,
    overrides?.utilities ?? 30,
    overrides?.taxes ?? 20
  );

  const createVariableCosts = (overrides?: Partial<{
    materials: number; outsourcing: number; marketing: number;
  }>) => new VariableCosts(
    overrides?.materials ?? 50,
    overrides?.outsourcing ?? 0,
    overrides?.marketing ?? 30
  );

  describe('calculateSustainabilityRate', () => {
    
    it('should calculate correct base rate with standard inputs', () => {
      const fixedCosts = createFixedCosts(); // Total: 400
      const variableCosts = createVariableCosts(); // Total: 80
      const desiredIncome = 1000;
      const profitMargin = 0.15;
      const billableHours = 100;

      // Expected: (400 + 80 + 1000) * 1.15 / 100 = 1702 / 100 = 17.02
      const rate = PricingCalculatorService.calculateSustainabilityRate(
        fixedCosts, variableCosts, desiredIncome, profitMargin, billableHours
      );

      expect(rate).toBeCloseTo(17.02, 2);
    });

    it('should calculate rate with zero costs', () => {
      const fixedCosts = new FixedCosts(0, 0, 0, 0, 0);
      const variableCosts = new VariableCosts(0, 0, 0);
      const desiredIncome = 1000;
      const profitMargin = 0.15;
      const billableHours = 100;

      // Expected: (0 + 0 + 1000) * 1.15 / 100 = 11.50
      const rate = PricingCalculatorService.calculateSustainabilityRate(
        fixedCosts, variableCosts, desiredIncome, profitMargin, billableHours
      );

      expect(rate).toBeCloseTo(11.50, 2);
    });

    it('should calculate rate with zero profit margin', () => {
      const fixedCosts = createFixedCosts(); // 400
      const variableCosts = createVariableCosts(); // 80
      const desiredIncome = 1000;
      const profitMargin = 0;
      const billableHours = 100;

      // Expected: (400 + 80 + 1000) / 100 = 14.80
      const rate = PricingCalculatorService.calculateSustainabilityRate(
        fixedCosts, variableCosts, desiredIncome, profitMargin, billableHours
      );

      expect(rate).toBeCloseTo(14.80, 2);
    });

    it('should throw error for zero billable hours', () => {
      const fixedCosts = createFixedCosts();
      const variableCosts = createVariableCosts();

      expect(() => {
        PricingCalculatorService.calculateSustainabilityRate(
          fixedCosts, variableCosts, 1000, 0.15, 0
        );
      }).toThrow('Billable hours must be greater than 0');
    });

    it('should throw error for negative billable hours', () => {
      const fixedCosts = createFixedCosts();
      const variableCosts = createVariableCosts();

      expect(() => {
        PricingCalculatorService.calculateSustainabilityRate(
          fixedCosts, variableCosts, 1000, 0.15, -10
        );
      }).toThrow('Billable hours must be greater than 0');
    });

    it('should throw error for profit margin > 1', () => {
      const fixedCosts = createFixedCosts();
      const variableCosts = createVariableCosts();

      expect(() => {
        PricingCalculatorService.calculateSustainabilityRate(
          fixedCosts, variableCosts, 1000, 1.5, 100
        );
      }).toThrow('Profit margin must be between 0 and 1');
    });

    it('should throw error for negative profit margin', () => {
      const fixedCosts = createFixedCosts();
      const variableCosts = createVariableCosts();

      expect(() => {
        PricingCalculatorService.calculateSustainabilityRate(
          fixedCosts, variableCosts, 1000, -0.1, 100
        );
      }).toThrow('Profit margin must be between 0 and 1');
    });
  });

  describe('calculateWithBreakdown', () => {
    
    it('should return complete breakdown structure', () => {
      const fixedCosts = createFixedCosts(); // 400
      const variableCosts = createVariableCosts(); // 80
      const desiredIncome = 1000;
      const profitMargin = 0.15;
      const billableHours = 100;

      const result = PricingCalculatorService.calculateWithBreakdown(
        fixedCosts, variableCosts, desiredIncome, profitMargin, billableHours
      );

      expect(result).toHaveProperty('base_hourly_rate');
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('fixed_costs_total', 400);
      expect(result.breakdown).toHaveProperty('variable_costs_total', 80);
      expect(result.breakdown).toHaveProperty('desired_income', 1000);
      expect(result.breakdown).toHaveProperty('total_monthly_costs', 1480);
      expect(result.breakdown).toHaveProperty('profit_margin_percentage', 15);
      expect(result.breakdown).toHaveProperty('profit_amount', 222);
      expect(result.breakdown).toHaveProperty('total_required', 1702);
      expect(result.breakdown).toHaveProperty('billable_hours', 100);
    });

    it('should round base_hourly_rate to 2 decimals', () => {
      const fixedCosts = new FixedCosts(123, 45, 67, 89, 12); // 336
      const variableCosts = new VariableCosts(33, 22, 11); // 66
      const desiredIncome = 1234.56;
      const profitMargin = 0.123;
      const billableHours = 77;

      const result = PricingCalculatorService.calculateWithBreakdown(
        fixedCosts, variableCosts, desiredIncome, profitMargin, billableHours
      );

      // Verify rate is rounded to 2 decimal places
      const rateStr = result.base_hourly_rate.toString();
      const decimals = rateStr.includes('.') ? rateStr.split('.')[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(2);
    });
  });

  describe('applyMultipliers', () => {
    const baseRate = 20;

    it('should apply junior seniority multiplier (0.8x)', () => {
      const result = PricingCalculatorService.applyMultipliers(
        baseRate, SeniorityLevel.JUNIOR
      );
      expect(result).toBe(16); // 20 * 0.8
    });

    it('should apply mid seniority multiplier (1.0x)', () => {
      const result = PricingCalculatorService.applyMultipliers(
        baseRate, SeniorityLevel.MID
      );
      expect(result).toBe(20); // 20 * 1.0
    });

    it('should apply senior seniority multiplier (1.3x)', () => {
      const result = PricingCalculatorService.applyMultipliers(
        baseRate, SeniorityLevel.SENIOR
      );
      expect(result).toBe(26); // 20 * 1.3
    });

    it('should apply expert seniority multiplier (1.5x)', () => {
      const result = PricingCalculatorService.applyMultipliers(
        baseRate, SeniorityLevel.EXPERT
      );
      expect(result).toBe(30); // 20 * 1.5
    });

    it('should apply client context multiplier for corporate global', () => {
      const context = new ClientContext(ClientType.CORPORATE, ClientRegion.GLOBAL);
      const result = PricingCalculatorService.applyMultipliers(
        baseRate, SeniorityLevel.MID, context
      );
      // 20 * 1.0 (mid) * 1.2 (corporate) * 1.3 (global) = 31.2
      expect(result).toBeCloseTo(31.2, 2);
    });

    it('should apply combined multipliers: senior + startup + cambodia', () => {
      const context = new ClientContext(ClientType.STARTUP, ClientRegion.CAMBODIA);
      const result = PricingCalculatorService.applyMultipliers(
        baseRate, SeniorityLevel.SENIOR, context
      );
      // 20 * 1.3 (senior) * 0.9 (startup) * 1.0 (cambodia) = 23.4
      expect(result).toBeCloseTo(23.4, 2);
    });

    it('should throw error for zero base rate', () => {
      expect(() => {
        PricingCalculatorService.applyMultipliers(0, SeniorityLevel.MID);
      }).toThrow('Base rate must be positive');
    });

    it('should throw error for negative base rate', () => {
      expect(() => {
        PricingCalculatorService.applyMultipliers(-10, SeniorityLevel.MID);
      }).toThrow('Base rate must be positive');
    });
  });

  describe('calculateProjectRateWithBreakdown', () => {
    
    it('should return full breakdown with context', () => {
      const context = new ClientContext(ClientType.SME, ClientRegion.SOUTHEAST_ASIA);
      const result = PricingCalculatorService.calculateProjectRateWithBreakdown(
        20, SeniorityLevel.SENIOR, context
      );

      expect(result.base_rate).toBe(20);
      expect(result.seniority_level).toBe('senior');
      expect(result.seniority_multiplier).toBe(1.3);
      expect(result.client_type).toBe('sme');
      expect(result.client_region).toBe('southeast_asia');
      expect(result.context_multiplier).toBeCloseTo(1.15, 2);
      // 20 * 1.3 * 1.15 = 29.9
      expect(result.final_hourly_rate).toBeCloseTo(29.9, 2);
    });

    it('should handle missing client context', () => {
      const result = PricingCalculatorService.calculateProjectRateWithBreakdown(
        20, SeniorityLevel.MID
      );

      expect(result.client_type).toBeUndefined();
      expect(result.client_region).toBeUndefined();
      expect(result.context_multiplier).toBe(1);
      expect(result.final_hourly_rate).toBe(20);
    });
  });

  describe('estimateMonthlyRevenue', () => {
    
    it('should calculate monthly revenue correctly', () => {
      const result = PricingCalculatorService.estimateMonthlyRevenue(25, 100);
      expect(result).toBe(2500);
    });

    it('should handle fractional hours', () => {
      const result = PricingCalculatorService.estimateMonthlyRevenue(25.50, 80.5);
      expect(result).toBe(2052.75);
    });

    it('should return 0 for zero hours', () => {
      const result = PricingCalculatorService.estimateMonthlyRevenue(25, 0);
      expect(result).toBe(0);
    });
  });

  describe('estimateAnnualRevenue', () => {
    
    it('should calculate annual revenue for 12 months', () => {
      const result = PricingCalculatorService.estimateAnnualRevenue(25, 100, 12);
      expect(result).toBe(30000);
    });

    it('should support custom months per year', () => {
      const result = PricingCalculatorService.estimateAnnualRevenue(25, 100, 10);
      expect(result).toBe(25000);
    });

    it('should default to 12 months', () => {
      const result = PricingCalculatorService.estimateAnnualRevenue(25, 100);
      expect(result).toBe(30000);
    });
  });

  describe('validateRateSustainability', () => {
    const sustainabilityRate = 20;

    it('should return unsustainable for rate below baseline', () => {
      expect(PricingCalculatorService.validateRateSustainability(15, sustainabilityRate))
        .toBe('unsustainable');
      expect(PricingCalculatorService.validateRateSustainability(19.99, sustainabilityRate))
        .toBe('unsustainable');
    });

    it('should return sustainable for rate at baseline', () => {
      expect(PricingCalculatorService.validateRateSustainability(20, sustainabilityRate))
        .toBe('sustainable');
      expect(PricingCalculatorService.validateRateSustainability(22, sustainabilityRate))
        .toBe('sustainable');
    });

    it('should return excellent for rate 20%+ above baseline', () => {
      expect(PricingCalculatorService.validateRateSustainability(24, sustainabilityRate))
        .toBe('excellent');
      expect(PricingCalculatorService.validateRateSustainability(30, sustainabilityRate))
        .toBe('excellent');
    });
  });

  describe('convertToProjectPrice', () => {
    
    it('should calculate project price with default 15% buffer', () => {
      // $25/hr * 40 hours = $1000 base, + 15% buffer = $1150
      const result = PricingCalculatorService.convertToProjectPrice(25, 40);
      expect(result).toBe(1150);
    });

    it('should apply custom buffer percentage', () => {
      // $25/hr * 40 hours = $1000 base, + 20% buffer = $1200
      const result = PricingCalculatorService.convertToProjectPrice(25, 40, 0.20);
      expect(result).toBe(1200);
    });

    it('should handle zero buffer', () => {
      const result = PricingCalculatorService.convertToProjectPrice(25, 40, 0);
      expect(result).toBe(1000);
    });
  });

  describe('convertToKHR', () => {
    
    it('should convert USD to KHR with default rate', () => {
      const result = PricingCalculatorService.convertToKHR(100);
      expect(result).toBe(400000); // 100 * 4000
    });

    it('should convert with custom exchange rate', () => {
      const result = PricingCalculatorService.convertToKHR(100, 4100);
      expect(result).toBe(410000);
    });

    it('should round to whole KHR', () => {
      const result = PricingCalculatorService.convertToKHR(25.75, 4000);
      expect(result).toBe(103000);
      expect(Number.isInteger(result)).toBe(true);
    });
  });
});
