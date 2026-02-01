/**
 * Unit Tests: Domain Entities
 * 
 * Tests the value objects and domain entities for AUREA pricing.
 * Validates construction, validation, and behavior.
 * 
 * @jest-environment node
 */

import { FixedCosts } from '../../../src/domain/entities/FixedCosts';
import { VariableCosts } from '../../../src/domain/entities/VariableCosts';
import { SeniorityLevel, SeniorityMultiplier } from '../../../src/domain/entities/SeniorityLevel';
import { ClientContext, ClientType, ClientRegion } from '../../../src/domain/entities/ClientContext';

describe('FixedCosts', () => {
  
  describe('construction', () => {
    
    it('should create valid FixedCosts with all positive values', () => {
      const costs = new FixedCosts(200, 100, 50, 30, 20);
      
      expect(costs.rent).toBe(200);
      expect(costs.equipment).toBe(100);
      expect(costs.insurance).toBe(50);
      expect(costs.utilities).toBe(30);
      expect(costs.taxes).toBe(20);
    });

    it('should allow zero values', () => {
      const costs = new FixedCosts(0, 0, 0, 0, 0);
      expect(costs.total()).toBe(0);
    });

    it('should throw error for negative rent', () => {
      expect(() => new FixedCosts(-100, 0, 0, 0, 0))
        .toThrow('All fixed costs must be non-negative');
    });

    it('should throw error for negative equipment', () => {
      expect(() => new FixedCosts(0, -50, 0, 0, 0))
        .toThrow('All fixed costs must be non-negative');
    });

    it('should throw error for negative insurance', () => {
      expect(() => new FixedCosts(0, 0, -25, 0, 0))
        .toThrow('All fixed costs must be non-negative');
    });

    it('should throw error for negative utilities', () => {
      expect(() => new FixedCosts(0, 0, 0, -10, 0))
        .toThrow('All fixed costs must be non-negative');
    });

    it('should throw error for negative taxes', () => {
      expect(() => new FixedCosts(0, 0, 0, 0, -5))
        .toThrow('All fixed costs must be non-negative');
    });
  });

  describe('total', () => {
    
    it('should calculate correct total', () => {
      const costs = new FixedCosts(200, 100, 50, 30, 20);
      expect(costs.total()).toBe(400);
    });

    it('should handle large values', () => {
      const costs = new FixedCosts(5000, 2000, 500, 300, 200);
      expect(costs.total()).toBe(8000);
    });

    it('should handle decimal values', () => {
      const costs = new FixedCosts(199.99, 100.01, 50.50, 30.25, 19.75);
      expect(costs.total()).toBeCloseTo(400.50, 2);
    });
  });

  describe('fromDb', () => {
    
    it('should create from database object', () => {
      const dbData = {
        rent: 200,
        equipment: 100,
        insurance: 50,
        utilities: 30,
        taxes: 20
      };
      
      const costs = FixedCosts.fromDb(dbData);
      expect(costs.total()).toBe(400);
    });

    it('should handle missing fields with defaults', () => {
      const costs = FixedCosts.fromDb({} as any);
      expect(costs.total()).toBe(0);
    });
  });

  describe('toDb', () => {
    
    it('should convert to database format', () => {
      const costs = new FixedCosts(200, 100, 50, 30, 20);
      const dbFormat = costs.toDb();
      
      expect(dbFormat.fixed_cost_rent).toBe(200);
      expect(dbFormat.fixed_cost_equipment).toBe(100);
      expect(dbFormat.fixed_cost_insurance).toBe(50);
      expect(dbFormat.fixed_cost_utilities).toBe(30);
      expect(dbFormat.fixed_cost_taxes).toBe(20);
    });
  });
});

describe('VariableCosts', () => {
  
  describe('construction', () => {
    
    it('should create valid VariableCosts', () => {
      const costs = new VariableCosts(50, 100, 30);
      
      expect(costs.materials).toBe(50);
      expect(costs.outsourcing).toBe(100);
      expect(costs.marketing).toBe(30);
    });

    it('should allow zero values', () => {
      const costs = new VariableCosts(0, 0, 0);
      expect(costs.total()).toBe(0);
    });

    it('should throw error for negative materials', () => {
      expect(() => new VariableCosts(-10, 0, 0))
        .toThrow('All variable costs must be non-negative');
    });

    it('should throw error for negative outsourcing', () => {
      expect(() => new VariableCosts(0, -50, 0))
        .toThrow('All variable costs must be non-negative');
    });

    it('should throw error for negative marketing', () => {
      expect(() => new VariableCosts(0, 0, -20))
        .toThrow('All variable costs must be non-negative');
    });
  });

  describe('total', () => {
    
    it('should calculate correct total', () => {
      const costs = new VariableCosts(50, 100, 30);
      expect(costs.total()).toBe(180);
    });
  });

  describe('toDb', () => {
    
    it('should convert to database format', () => {
      const costs = new VariableCosts(50, 100, 30);
      const dbFormat = costs.toDb();
      
      expect(dbFormat.variable_cost_materials).toBe(50);
      expect(dbFormat.variable_cost_outsourcing).toBe(100);
      expect(dbFormat.variable_cost_marketing).toBe(30);
    });
  });
});

describe('SeniorityLevel', () => {
  
  describe('SeniorityMultiplier.getMultiplier', () => {
    
    it('should return 0.8 for junior', () => {
      expect(SeniorityMultiplier.getMultiplier(SeniorityLevel.JUNIOR)).toBe(0.8);
    });

    it('should return 1.0 for mid', () => {
      expect(SeniorityMultiplier.getMultiplier(SeniorityLevel.MID)).toBe(1.0);
    });

    it('should return 1.3 for senior', () => {
      expect(SeniorityMultiplier.getMultiplier(SeniorityLevel.SENIOR)).toBe(1.3);
    });

    it('should return 1.5 for expert', () => {
      expect(SeniorityMultiplier.getMultiplier(SeniorityLevel.EXPERT)).toBe(1.5);
    });
  });

  describe('SeniorityMultiplier.validate', () => {
    
    it('should validate lowercase levels', () => {
      expect(SeniorityMultiplier.validate('junior')).toBe(SeniorityLevel.JUNIOR);
      expect(SeniorityMultiplier.validate('mid')).toBe(SeniorityLevel.MID);
      expect(SeniorityMultiplier.validate('senior')).toBe(SeniorityLevel.SENIOR);
      expect(SeniorityMultiplier.validate('expert')).toBe(SeniorityLevel.EXPERT);
    });

    it('should validate uppercase levels', () => {
      expect(SeniorityMultiplier.validate('JUNIOR')).toBe(SeniorityLevel.JUNIOR);
      expect(SeniorityMultiplier.validate('MID')).toBe(SeniorityLevel.MID);
    });

    it('should throw error for invalid level', () => {
      expect(() => SeniorityMultiplier.validate('beginner'))
        .toThrow('Invalid seniority level');
      expect(() => SeniorityMultiplier.validate(''))
        .toThrow('Invalid seniority level');
    });
  });

  describe('SeniorityMultiplier.fromExperience', () => {
    
    it('should return junior for 0-1 years', () => {
      expect(SeniorityMultiplier.fromExperience(0)).toBe(SeniorityLevel.JUNIOR);
      expect(SeniorityMultiplier.fromExperience(1)).toBe(SeniorityLevel.JUNIOR);
    });

    it('should return mid for 2-4 years', () => {
      expect(SeniorityMultiplier.fromExperience(2)).toBe(SeniorityLevel.MID);
      expect(SeniorityMultiplier.fromExperience(4)).toBe(SeniorityLevel.MID);
    });

    it('should return senior for 5-9 years', () => {
      expect(SeniorityMultiplier.fromExperience(5)).toBe(SeniorityLevel.SENIOR);
      expect(SeniorityMultiplier.fromExperience(9)).toBe(SeniorityLevel.SENIOR);
    });

    it('should return expert for 10+ years', () => {
      expect(SeniorityMultiplier.fromExperience(10)).toBe(SeniorityLevel.EXPERT);
      expect(SeniorityMultiplier.fromExperience(20)).toBe(SeniorityLevel.EXPERT);
    });
  });

  describe('SeniorityMultiplier.getAllLevels', () => {
    
    it('should return all 4 levels', () => {
      const levels = SeniorityMultiplier.getAllLevels();
      expect(levels).toHaveLength(4);
      expect(levels).toContain(SeniorityLevel.JUNIOR);
      expect(levels).toContain(SeniorityLevel.MID);
      expect(levels).toContain(SeniorityLevel.SENIOR);
      expect(levels).toContain(SeniorityLevel.EXPERT);
    });
  });
});

describe('ClientContext', () => {
  
  describe('construction', () => {
    
    it('should create valid context', () => {
      const context = new ClientContext(ClientType.SME, ClientRegion.CAMBODIA);
      expect(context.clientType).toBe(ClientType.SME);
      expect(context.clientRegion).toBe(ClientRegion.CAMBODIA);
    });
  });

  describe('fromStrings', () => {
    
    it('should create from lowercase strings', () => {
      const context = ClientContext.fromStrings('sme', 'cambodia');
      expect(context.clientType).toBe(ClientType.SME);
      expect(context.clientRegion).toBe(ClientRegion.CAMBODIA);
    });

    it('should create from uppercase strings', () => {
      const context = ClientContext.fromStrings('CORPORATE', 'GLOBAL');
      expect(context.clientType).toBe(ClientType.CORPORATE);
      expect(context.clientRegion).toBe(ClientRegion.GLOBAL);
    });

    it('should throw error for invalid client type', () => {
      expect(() => ClientContext.fromStrings('invalid', 'cambodia'))
        .toThrow('Invalid client type');
    });

    it('should throw error for invalid region', () => {
      expect(() => ClientContext.fromStrings('sme', 'invalid'))
        .toThrow('Invalid client region');
    });
  });

  describe('getContextMultiplier', () => {
    
    // Client type multipliers
    it('should apply startup multiplier (0.9x)', () => {
      const context = new ClientContext(ClientType.STARTUP, ClientRegion.CAMBODIA);
      expect(context.getContextMultiplier()).toBeCloseTo(0.9, 2);
    });

    it('should apply SME multiplier (1.0x)', () => {
      const context = new ClientContext(ClientType.SME, ClientRegion.CAMBODIA);
      expect(context.getContextMultiplier()).toBeCloseTo(1.0, 2);
    });

    it('should apply corporate multiplier (1.2x)', () => {
      const context = new ClientContext(ClientType.CORPORATE, ClientRegion.CAMBODIA);
      expect(context.getContextMultiplier()).toBeCloseTo(1.2, 2);
    });

    it('should apply NGO multiplier (0.85x)', () => {
      const context = new ClientContext(ClientType.NGO, ClientRegion.CAMBODIA);
      expect(context.getContextMultiplier()).toBeCloseTo(0.85, 2);
    });

    it('should apply government multiplier (1.1x)', () => {
      const context = new ClientContext(ClientType.GOVERNMENT, ClientRegion.CAMBODIA);
      expect(context.getContextMultiplier()).toBeCloseTo(1.1, 2);
    });

    // Region multipliers (with SME baseline 1.0)
    it('should apply Cambodia region multiplier (1.0x)', () => {
      const context = new ClientContext(ClientType.SME, ClientRegion.CAMBODIA);
      expect(context.getContextMultiplier()).toBeCloseTo(1.0, 2);
    });

    it('should apply Southeast Asia region multiplier (1.15x)', () => {
      const context = new ClientContext(ClientType.SME, ClientRegion.SOUTHEAST_ASIA);
      expect(context.getContextMultiplier()).toBeCloseTo(1.15, 2);
    });

    it('should apply Global region multiplier (1.3x)', () => {
      const context = new ClientContext(ClientType.SME, ClientRegion.GLOBAL);
      expect(context.getContextMultiplier()).toBeCloseTo(1.3, 2);
    });

    // Combined multipliers
    it('should combine corporate + global (1.2 * 1.3 = 1.56)', () => {
      const context = new ClientContext(ClientType.CORPORATE, ClientRegion.GLOBAL);
      expect(context.getContextMultiplier()).toBeCloseTo(1.56, 2);
    });

    it('should combine startup + cambodia (0.9 * 1.0 = 0.9)', () => {
      const context = new ClientContext(ClientType.STARTUP, ClientRegion.CAMBODIA);
      expect(context.getContextMultiplier()).toBeCloseTo(0.9, 2);
    });

    it('should combine ngo + southeast_asia (0.85 * 1.15 = 0.9775)', () => {
      const context = new ClientContext(ClientType.NGO, ClientRegion.SOUTHEAST_ASIA);
      expect(context.getContextMultiplier()).toBeCloseTo(0.9775, 2);
    });
  });

  describe('static getters', () => {
    
    it('should return all client types', () => {
      const types = ClientContext.getAllClientTypes();
      expect(types).toHaveLength(5);
      expect(types).toContain(ClientType.STARTUP);
      expect(types).toContain(ClientType.SME);
      expect(types).toContain(ClientType.CORPORATE);
      expect(types).toContain(ClientType.NGO);
      expect(types).toContain(ClientType.GOVERNMENT);
    });

    it('should return all regions', () => {
      const regions = ClientContext.getAllRegions();
      expect(regions).toHaveLength(3);
      expect(regions).toContain(ClientRegion.CAMBODIA);
      expect(regions).toContain(ClientRegion.SOUTHEAST_ASIA);
      expect(regions).toContain(ClientRegion.GLOBAL);
    });
  });
});
