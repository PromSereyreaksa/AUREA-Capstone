/**
 * Unit Tests: AcceptPortfolioRate Use Case
 *
 * Tests the flow of accepting an AI-recommended rate and saving it to a pricing profile.
 * Tests both profile creation and update scenarios.
 *
 * @jest-environment node
 */

import { AcceptPortfolioRate } from '../../../src/application/use_cases/AcceptPortfolioRate';
import { IPricingProfileRepository } from '../../../src/domain/repositories/IPricingProfileRepository';
import { PricingProfile } from '../../../src/domain/entities/PricingProfile';
import { FixedCosts } from '../../../src/domain/entities/FixedCosts';
import { VariableCosts } from '../../../src/domain/entities/VariableCosts';
import { SeniorityLevel } from '../../../src/domain/entities/SeniorityLevel';
import { ValidationError } from '../../../src/shared/errors/AppError';

// ── Mock factories ────────────────────────────────────────────

function makePricingProfile(overrides: Partial<PricingProfile> = {}): PricingProfile {
  return new PricingProfile(
    overrides.pricing_profile_id ?? 1,
    overrides.user_id ?? 1,
    overrides.fixed_costs ?? new FixedCosts(50, 30, 10, 30, 0),
    overrides.variable_costs ?? new VariableCosts(20, 0, 10),
    overrides.desired_monthly_income ?? 800,
    overrides.billable_hours_per_month ?? 80,
    overrides.profit_margin ?? 0.15,
    overrides.experience_years ?? 3,
    overrides.seniority_level ?? SeniorityLevel.MID,
    overrides.skill_categories ?? [1, 2],
    overrides.base_hourly_rate ?? 12.50,
  );
}

function makeRepo() {
  const pricingProfileRepo: jest.Mocked<IPricingProfileRepository> = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  return pricingProfileRepo;
}

// ── Tests ─────────────────────────────────────────────────────

describe('AcceptPortfolioRate', () => {
  let repo: ReturnType<typeof makeRepo>;
  let useCase: AcceptPortfolioRate;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new AcceptPortfolioRate(repo);
  });

  // ── Validation ────────────────────────────────────────────

  describe('input validation', () => {
    it('should reject hourly_rate <= 0', async () => {
      await expect(
        useCase.execute({
          user_id: 1,
          hourly_rate: 0
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          user_id: 1,
          hourly_rate: -5
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid seniority_level', async () => {
      repo.findByUserId.mockResolvedValue(null);

      await expect(
        useCase.execute({
          user_id: 1,
          hourly_rate: 15,
          seniority_level: 'legendary' as any
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should accept valid seniority_level strings', async () => {
      repo.findByUserId.mockResolvedValue(null);
      repo.create.mockImplementation((profile) => Promise.resolve(profile));

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 15,
        seniority_level: 'senior'
      });

      expect(result.action).toBe('created');
      expect(result.pricing_profile.seniority_level).toBe('senior');
    });
  });

  // ── Profile Creation ──────────────────────────────────────

  describe('profile creation (no existing profile)', () => {
    beforeEach(() => {
      repo.findByUserId.mockResolvedValue(null);
    });

    it('should create profile with accepted rate', async () => {
      const mockCreated = makePricingProfile({
        pricing_profile_id: 99,
        user_id: 5,
        base_hourly_rate: 18.00
      });
      repo.create.mockResolvedValue(mockCreated);

      const result = await useCase.execute({
        user_id: 5,
        hourly_rate: 18.00
      });

      expect(result.action).toBe('created');
      expect(result.pricing_profile.base_hourly_rate).toBe(18.00);
      expect(result.message).toMatch(/created/i);
      expect(repo.create).toHaveBeenCalled();
    });

    it('should use AI-researched costs if provided', async () => {
      repo.create.mockImplementation((profile) => Promise.resolve(profile));

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 15,
        researched_costs: {
          workspace: 60,
          software: 45,
          equipment: 30,
          utilities: 35,
          materials: 25
        }
      });

      expect(result.action).toBe('created');
      expect(result.pricing_profile.fixed_costs.rent).toBe(60);
      expect(result.pricing_profile.fixed_costs.equipment).toBe(30);
      expect(result.pricing_profile.fixed_costs.utilities).toBe(35);
      expect(result.pricing_profile.variable_costs.materials).toBe(25);
    });

    it('should use sensible defaults when no costs provided', async () => {
      repo.create.mockImplementation((profile) => Promise.resolve(profile));

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 12
      });

      expect(result.action).toBe('created');
      // Default workspace: 50
      expect(result.pricing_profile.fixed_costs.rent).toBe(50);
      // Default equipment: 30
      expect(result.pricing_profile.fixed_costs.equipment).toBe(30);
      // Default materials: 20
      expect(result.pricing_profile.variable_costs.materials).toBe(20);
    });

    it('should estimate experience from rate when not provided', async () => {
      repo.create.mockImplementation((profile) => Promise.resolve(profile));

      const lowRateResult = await useCase.execute({
        user_id: 1,
        hourly_rate: 6 // Low rate → junior
      });
      expect(lowRateResult.pricing_profile.experience_years).toBe(1);

      const midRateResult = await useCase.execute({
        user_id: 2,
        hourly_rate: 12 // Mid rate → ~3 years
      });
      expect(midRateResult.pricing_profile.experience_years).toBe(3);

      const highRateResult = await useCase.execute({
        user_id: 3,
        hourly_rate: 30 // High rate → ~10 years
      });
      expect(highRateResult.pricing_profile.experience_years).toBe(10);
    });

    it('should use provided experience_years over estimation', async () => {
      repo.create.mockImplementation((profile) => Promise.resolve(profile));

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 30, // Would estimate 10 years
        experience_years: 5 // But user says 5 years
      });

      expect(result.pricing_profile.experience_years).toBe(5);
    });
  });

  // ── Profile Update ────────────────────────────────────────

  describe('profile update (existing profile)', () => {
    beforeEach(() => {
      const existingProfile = makePricingProfile({
        pricing_profile_id: 10,
        user_id: 1,
        base_hourly_rate: 10.00,
        experience_years: 2,
        seniority_level: SeniorityLevel.JUNIOR,
        fixed_costs: new FixedCosts(40, 20, 10, 25, 0),
        variable_costs: new VariableCosts(15, 0, 5)
      });
      repo.findByUserId.mockResolvedValue(existingProfile);
    });

    it('should update existing profile with new rate', async () => {
      const mockUpdated = makePricingProfile({
        pricing_profile_id: 10,
        base_hourly_rate: 20.00
      });
      repo.update.mockResolvedValue(mockUpdated);

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 20.00
      });

      expect(result.action).toBe('updated');
      expect(result.pricing_profile.base_hourly_rate).toBe(20.00);
      expect(result.message).toMatch(/updated/i);
      expect(repo.update).toHaveBeenCalledWith(10, expect.any(Object));
    });

    it('should preserve existing costs unless AI costs provided', async () => {
      repo.update.mockImplementation((id, updates) => 
        Promise.resolve(makePricingProfile({ ...updates as any, pricing_profile_id: id }))
      );

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 15.00
        // No researched_costs provided
      });

      expect(result.pricing_profile.fixed_costs.rent).toBe(40); // Preserved
      expect(result.pricing_profile.fixed_costs.equipment).toBe(20); // Preserved
    });

    it('should update costs when AI-researched costs provided', async () => {
      repo.update.mockImplementation((id, updates) =>
        Promise.resolve(makePricingProfile({ ...updates as any, pricing_profile_id: id }))
      );

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 16.00,
        researched_costs: {
          workspace: 70,
          software: 50,
          equipment: 35,
          utilities: 40,
          materials: 30
        }
      });

      expect(result.pricing_profile.fixed_costs.rent).toBe(70);
      expect(result.pricing_profile.fixed_costs.equipment).toBe(35);
      expect(result.pricing_profile.fixed_costs.utilities).toBe(40);
      expect(result.pricing_profile.variable_costs.materials).toBe(30);
    });

    it('should update seniority_level when provided', async () => {
      repo.update.mockImplementation((id, updates) =>
        Promise.resolve(makePricingProfile({ ...updates as any, pricing_profile_id: id, seniority_level: SeniorityLevel.SENIOR }))
      );

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 18.00,
        seniority_level: 'senior'
      });

      expect(result.pricing_profile.seniority_level).toBe('senior');
    });

    it('should update skill_categories when provided', async () => {
      repo.update.mockImplementation((id, updates) =>
        Promise.resolve(makePricingProfile({ ...updates as any, pricing_profile_id: id, skill_categories: [3, 5, 7] }))
      );

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 15.00,
        skill_categories: [3, 5, 7]
      });

      expect(result.pricing_profile.skill_categories).toEqual([3, 5, 7]);
    });
  });

  // ── Output Structure ──────────────────────────────────────

  describe('output structure', () => {
    it('should return complete pricing_profile object', async () => {
      repo.findByUserId.mockResolvedValue(null);
      repo.create.mockImplementation((profile) => Promise.resolve(profile));

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 15.50
      });

      expect(result.pricing_profile).toHaveProperty('pricing_profile_id');
      expect(result.pricing_profile).toHaveProperty('user_id');
      expect(result.pricing_profile).toHaveProperty('base_hourly_rate');
      expect(result.pricing_profile).toHaveProperty('fixed_costs');
      expect(result.pricing_profile).toHaveProperty('variable_costs');
      expect(result.pricing_profile.fixed_costs).toHaveProperty('total');
      expect(result.pricing_profile.variable_costs).toHaveProperty('total');
    });

    it('should include action and message in response', async () => {
      repo.findByUserId.mockResolvedValue(null);
      repo.create.mockImplementation((profile) => Promise.resolve(profile));

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 12.00
      });

      expect(result.action).toBeDefined();
      expect(['created', 'updated']).toContain(result.action);
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
    });
  });

  // ── Complex Scenarios ─────────────────────────────────────

  describe('complex scenarios', () => {
    it('should handle full AI data acceptance', async () => {
      repo.findByUserId.mockResolvedValue(null);
      repo.create.mockImplementation((profile) => Promise.resolve(profile));

      const result = await useCase.execute({
        user_id: 1,
        hourly_rate: 17.25,
        seniority_level: 'senior',
        experience_years: 6,
        skill_categories: [1, 3, 5],
        researched_costs: {
          workspace: 65,
          software: 40,
          equipment: 28,
          utilities: 32,
          materials: 22
        },
        desired_monthly_income: 900,
        billable_hours_per_month: 85,
        profit_margin: 0.18
      });

      expect(result.action).toBe('created');
      expect(result.pricing_profile.base_hourly_rate).toBe(17.25);
      expect(result.pricing_profile.seniority_level).toBe('senior');
      expect(result.pricing_profile.experience_years).toBe(6);
      expect(result.pricing_profile.skill_categories).toEqual([1, 3, 5]);
      expect(result.pricing_profile.desired_monthly_income).toBe(900);
      expect(result.pricing_profile.billable_hours_per_month).toBe(85);
      expect(result.pricing_profile.profit_margin).toBe(0.18);
    });
  });
});
