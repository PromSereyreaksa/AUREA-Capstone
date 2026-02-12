import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { IMarketBenchmarkRepository } from '../../domain/repositories/IMarketBenchmarkRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { GeminiService } from '../../infrastructure/services/GeminiService';
import { SeniorityMultiplier } from '../../domain/entities/SeniorityLevel';
import { NotFoundError, ForbiddenError } from '../../shared/errors/AppError';
import {
  PORTFOLIO_CONFIDENCE_LEVELS,
  PORTFOLIO_QUALITY_TIERS,
  SENIORITY_LEVELS
} from '../../shared/constants';

interface PortfolioAssistedPricingInput {
  user_id: number;
  project_id?: number;
  client_region: string;
  portfolio_url?: string;
  portfolio_text?: string;
  portfolio_pdf?: Buffer;
  use_ai?: boolean;
  // New structured fields for enhanced Gemini rate recommendation
  experience_years?: number;
  skills?: string;
  hours_per_week?: number;
  client_type?: string;
  overrides?: {
    seniority_level?: string;
    skill_areas?: string[];
    specialization?: string;
    portfolio_quality_tier?: string;
    confidence?: string;
    market_benchmark_category?: string;
  };
}

interface PortfolioSignals {
  seniority_level: string;
  skill_areas: string[];
  specialization?: string;
  portfolio_quality_tier?: string;
  confidence: string;
  market_benchmark_category?: string;
  summary?: string;
  evidence?: string[];
  limitations?: string[];
  follow_up_questions?: string[];
}

interface PortfolioAssistedPricingOutput {
  ai_status: 'used' | 'skipped' | 'failed';
  portfolio_signals?: PortfolioSignals;
  overrides_applied: string[];
  confirmed_values: {
    seniority_level: string;
    skill_areas: string[];
    specialization?: string;
    portfolio_quality_tier?: string;
    confidence: string;
    market_benchmark_category?: {
      category_id?: number;
      category_name?: string;
    };
  };
  mapping: {
    seniority_multiplier: number;
  };
  market_benchmark?: {
    category_id: number;
    category_name: string;
    seniority_level: string;
    median_rate: number;
    percentile_75_rate: number;
    sample_size: number;
  };
  suggested_rate?: {
    hourly_rate: number;
    rate_range: { low: number; high: number };
    base_rate: number;
    seniority_multiplier: number;
    rate_source: 'ai_recommendation' | 'market_benchmark' | 'default_estimate';
    note: string;
  };
  // New AI-powered rate recommendation fields
  ai_recommended_rate?: {
    hourly_rate: number;
    rate_range: { low: number; high: number };
    reasoning: string;
  };
  ai_researched_costs?: {
    workspace: number;
    software: number;
    equipment: number;
    utilities: number;
    materials: number;
    total_monthly: number;
    sources?: string[];
  };
  ai_income_research?: {
    median_income: number;
    income_range: { low: number; high: number };
    sources?: string[];
  };
  ai_market_research?: {
    market_rate_range: { low: number; high: number };
    sources?: string[];
  };
  ai_calculation_breakdown?: {
    monthly_expenses: number;
    desired_income: number;
    billable_hours: number;
    base_rate: number;
    seniority_multiplier: number;
    client_multiplier: number;
    final_rate: number;
  };
  follow_up_questions?: string[];
  explainability: {
    summary: string;
    evidence: string[];
    limitations: string[];
  };
}

export class PortfolioAssistedPricing {
  constructor(
    private pricingProfileRepo: IPricingProfileRepository,
    private projectPriceRepo: IProjectPriceRepository,
    private marketBenchmarkRepo: IMarketBenchmarkRepository,
    private categoryRepo: ICategoryRepository,
    private geminiService: GeminiService
  ) {}

  async execute(input: PortfolioAssistedPricingInput): Promise<PortfolioAssistedPricingOutput> {
    // === Step 1: Verify project ownership if project_id provided ===
    if (input.project_id) {
      const project = await this.projectPriceRepo.findById(input.project_id);
      if (!project) {
        throw new NotFoundError('Project');
      }
      if (project.user_id !== input.user_id) {
        throw new ForbiddenError('You can only update your own projects');
      }
    }

    // === Step 2: AI analysis with rate recommendation ===
    let aiStatus: 'used' | 'skipped' | 'failed' = 'skipped';
    let aiSignals: PortfolioSignals | undefined;
    let aiRecommendedRate: any;
    let aiResearchedCosts: any;
    let aiIncomeResearch: any;
    let aiMarketResearch: any;
    let aiCalculationBreakdown: any;
    let aiError: string | undefined;

    const shouldUseAi = input.use_ai !== false && (input.portfolio_url || input.portfolio_text || input.portfolio_pdf);

    if (shouldUseAi) {
      try {
        // Call the new Gemini method that recommends rates
        const raw = await this.geminiService.analyzePortfolioAndRecommendRate({
          portfolioUrl: input.portfolio_url,
          portfolioText: input.portfolio_text,
          portfolioPdf: input.portfolio_pdf,
          experienceYears: input.experience_years,
          skills: input.skills,
          hoursPerWeek: input.hours_per_week,
          clientType: input.client_type,
          region: input.client_region
        });
        
        // Extract portfolio signals
        aiSignals = this.normalizeSignals(raw);
        
        // Extract AI rate recommendation and research data
        if (raw.recommended_rate) {
          aiRecommendedRate = {
            hourly_rate: raw.recommended_rate.hourly_rate,
            rate_range: raw.recommended_rate.rate_range,
            reasoning: raw.recommended_rate.reasoning
          };
        }
        
        if (raw.researched_costs) {
          aiResearchedCosts = raw.researched_costs;
        }
        
        if (raw.income_research) {
          aiIncomeResearch = raw.income_research;
        }
        
        if (raw.market_research) {
          aiMarketResearch = raw.market_research;
        }
        
        if (raw.calculation_breakdown) {
          aiCalculationBreakdown = raw.calculation_breakdown;
        }
        
        aiStatus = 'used';
      } catch (error: any) {
        aiStatus = 'failed';
        aiError = error?.message || 'AI analysis failed';
      }
    }

    // === Step 3: Merge signals with overrides ===
    const overridesApplied = this.listOverrides(input.overrides);

    const confirmedSeniority =
      input.overrides?.seniority_level ||
      aiSignals?.seniority_level ||
      'mid';  // Default fallback when no profile

    const confirmed = {
      seniority_level: confirmedSeniority,
      skill_areas: input.overrides?.skill_areas || aiSignals?.skill_areas || [],
      specialization: input.overrides?.specialization || aiSignals?.specialization,
      portfolio_quality_tier: input.overrides?.portfolio_quality_tier || aiSignals?.portfolio_quality_tier,
      confidence: input.overrides?.confidence || aiSignals?.confidence || 'low',
      market_benchmark_category: input.overrides?.market_benchmark_category || aiSignals?.market_benchmark_category
    };

    // === Step 4: Category & benchmark lookup ===
    const mappedCategory = confirmed.market_benchmark_category
      ? await this.categoryRepo.findByNameLike(confirmed.market_benchmark_category)
      : null;

    const benchmark = mappedCategory
      ? await this.marketBenchmarkRepo.findByCategoryAndSeniority(
          mappedCategory.category_id,
          confirmed.seniority_level
        )
      : null;

    // === Step 5: Calculate suggested rate (prioritize AI recommendation) ===
    const seniorityMultiplier = SeniorityMultiplier.getMultiplier(
      SeniorityMultiplier.validate(confirmed.seniority_level)
    );

    let suggestedRate: PortfolioAssistedPricingOutput['suggested_rate'];

    // Priority 1: Use AI-recommended rate if available
    if (aiRecommendedRate) {
      suggestedRate = {
        hourly_rate: aiRecommendedRate.hourly_rate,
        rate_range: aiRecommendedRate.rate_range,
        base_rate: aiCalculationBreakdown?.base_rate || aiRecommendedRate.hourly_rate,
        seniority_multiplier: aiCalculationBreakdown?.seniority_multiplier || seniorityMultiplier,
        rate_source: 'ai_recommendation',
        note: `AI-researched rate based on Cambodia market data and UREA formula. ${aiRecommendedRate.reasoning || ''}`
      };
    }
    // Priority 2: Use market benchmark if AI failed but benchmark exists
    else if (benchmark) {
      // Use market benchmark median as base rate
      const baseRate = benchmark.median_hourly_rate;
      const hourlyRate = Math.round(baseRate * seniorityMultiplier * 100) / 100;
      const highRate = Math.round(benchmark.percentile_75_rate * seniorityMultiplier * 100) / 100;

      suggestedRate = {
        hourly_rate: hourlyRate,
        rate_range: {
          low: hourlyRate,
          high: highRate
        },
        base_rate: baseRate,
        seniority_multiplier: Math.round(seniorityMultiplier * 100) / 100,
        rate_source: 'market_benchmark',
        note: `Based on ${mappedCategory?.category_name || 'market'} benchmark for ${confirmed.seniority_level}-level designers in Cambodia`
      };
    }
    // Priority 3: Use default estimates as last resort
    else {
      // Fallback: estimate from default Cambodia market rates per seniority
      const defaultRates: Record<string, { median: number; p75: number }> = {
        junior: { median: 5, p75: 8 },
        mid: { median: 10, p75: 15 },
        senior: { median: 18, p75: 25 },
        expert: { median: 25, p75: 40 }
      };
      const defaults = defaultRates[confirmed.seniority_level] || defaultRates.mid;

      suggestedRate = {
        hourly_rate: defaults.median,
        rate_range: {
          low: defaults.median,
          high: defaults.p75
        },
        base_rate: defaults.median,
        seniority_multiplier: 1.0,  // Already baked into defaults
        rate_source: 'default_estimate',
        note: `Estimated from Cambodia market defaults for ${confirmed.seniority_level}-level designers (no matching benchmark category found)`
      };
    }

    // === Step 6: Determine follow-up questions (if confidence is low) ===
    const followUpQuestions: string[] = [];
    if (confirmed.confidence === 'low') {
      // Add AI-suggested follow-ups if available
      if (aiSignals?.follow_up_questions?.length) {
        followUpQuestions.push(...aiSignals.follow_up_questions);
      } else {
        // Default follow-up questions
        followUpQuestions.push('How many years of experience do you have?');
        followUpQuestions.push('What is your primary type of design work (logo, banner, social media, UI, etc.)?');
      }
    }

    // === Step 7: Build explainability ===
    const summaryParts = [`Seniority: ${confirmed.seniority_level}`];
    if (confirmed.portfolio_quality_tier) summaryParts.push(`Quality: ${confirmed.portfolio_quality_tier}`);
    const summary = aiSignals?.summary || summaryParts.join('. ') + '.';

    const limitations = aiSignals?.limitations
      || (aiStatus === 'failed'
        ? [`AI analysis unavailable: ${aiError}`]
        : aiStatus === 'skipped'
          ? ['AI analysis skipped by request or missing portfolio input']
          : []);

    return {
      ai_status: aiStatus,
      portfolio_signals: aiSignals,
      overrides_applied: overridesApplied,
      confirmed_values: {
        seniority_level: confirmed.seniority_level,
        skill_areas: confirmed.skill_areas,
        specialization: confirmed.specialization,
        portfolio_quality_tier: confirmed.portfolio_quality_tier,
        confidence: confirmed.confidence,
        market_benchmark_category: mappedCategory
          ? { category_id: mappedCategory.category_id, category_name: mappedCategory.category_name }
          : confirmed.market_benchmark_category
            ? { category_name: confirmed.market_benchmark_category }
            : undefined
      },
      mapping: {
        seniority_multiplier: seniorityMultiplier
      },
      market_benchmark: benchmark
        ? {
            category_id: benchmark.category_id,
            category_name: mappedCategory?.category_name || confirmed.market_benchmark_category || 'Unknown',
            seniority_level: benchmark.seniority_level,
            median_rate: benchmark.median_hourly_rate,
            percentile_75_rate: benchmark.percentile_75_rate,
            sample_size: benchmark.sample_size
          }
        : undefined,
      suggested_rate: suggestedRate,
      ai_recommended_rate: aiRecommendedRate,
      ai_researched_costs: aiResearchedCosts,
      ai_income_research: aiIncomeResearch,
      ai_market_research: aiMarketResearch,
      ai_calculation_breakdown: aiCalculationBreakdown,
      follow_up_questions: followUpQuestions.length > 0 ? followUpQuestions : undefined,
      explainability: {
        summary,
        evidence: aiSignals?.evidence || [],
        limitations
      }
    };
  }

  private normalizeSignals(raw: any): PortfolioSignals {
    const safeSeniority = this.normalizeEnum(raw?.seniority_level, SENIORITY_LEVELS, 'mid') as string;
    const safeConfidence = this.normalizeEnum(raw?.confidence, PORTFOLIO_CONFIDENCE_LEVELS, 'low') as string;
    const safeQuality = this.normalizeEnum(raw?.portfolio_quality_tier, PORTFOLIO_QUALITY_TIERS, undefined);

    const skillAreas = Array.isArray(raw?.skill_areas)
      ? raw.skill_areas
          .filter((item: any) => typeof item === 'string')
          .map((item: string) => item.trim().replace(/[^\w\s\-\.&\/()]/g, '').substring(0, 80))
          .filter((item: string) => item.length > 0)
          .slice(0, 20)
      : [];

    const evidence = Array.isArray(raw?.evidence)
      ? raw.evidence
          .filter((item: any) => typeof item === 'string')
          .map((item: string) => item.trim().substring(0, 200))
          .filter((item: string) => item.length > 0)
          .slice(0, 10)
      : [];

    const limitations = Array.isArray(raw?.limitations)
      ? raw.limitations
          .filter((item: any) => typeof item === 'string')
          .map((item: string) => item.trim().substring(0, 200))
          .filter((item: string) => item.length > 0)
          .slice(0, 10)
      : [];

    return {
      seniority_level: safeSeniority,
      skill_areas: skillAreas,
      specialization: typeof raw?.specialization === 'string'
        ? raw.specialization.trim().substring(0, 100)
        : undefined,
      portfolio_quality_tier: safeQuality,
      confidence: safeConfidence,
      market_benchmark_category: typeof raw?.market_benchmark_category === 'string'
        ? raw.market_benchmark_category.trim().substring(0, 100)
        : undefined,
      summary: typeof raw?.summary === 'string'
        ? raw.summary.trim().substring(0, 300)
        : undefined,
      evidence,
      limitations,
      follow_up_questions: Array.isArray(raw?.follow_up_questions)
        ? raw.follow_up_questions
            .filter((item: any) => typeof item === 'string')
            .map((item: string) => item.trim().substring(0, 200))
            .filter((item: string) => item.length > 0)
            .slice(0, 5)
        : []
    };
  }

  private normalizeEnum<T extends string>(
    value: string | undefined,
    allowed: readonly T[],
    fallback: T | undefined
  ): T | undefined {
    if (!value || typeof value !== 'string') {
      return fallback;
    }
    const normalized = value.toLowerCase().trim() as T;
    return allowed.includes(normalized) ? normalized : fallback;
  }

  private listOverrides(overrides?: Record<string, any>): string[] {
    if (!overrides) {
      return [];
    }

    return Object.keys(overrides).filter((key) => overrides[key] !== undefined);
  }
}
