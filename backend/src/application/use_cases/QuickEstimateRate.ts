import { GeminiService } from '../../infrastructure/services/GeminiService';
import { IMarketBenchmarkRepository } from '../../domain/repositories/IMarketBenchmarkRepository';
import { 
  sanitizeForAIPrompt, 
  sanitizeSkillsInput, 
  sanitizeRegionInput,
  validateEnumInput 
} from '../../shared/utils/sanitization';

interface QuickEstimateInput {
  user_id: number;
  skills: string;           // e.g., "Logo Design, Branding"
  experience_level: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  client_type?: 'startup' | 'sme' | 'corporate' | 'ngo' | 'government';
  hours_per_week: number;   // e.g., 20, 40
  region?: string;          // Default: Cambodia
  useGrounding?: boolean;   // Enable/disable Google Search grounding (default: true)
}

interface QuickEstimateOutput {
  estimate: {
    hourly_rate_min: number;
    hourly_rate_max: number;
    recommended_rate: number;
    currency: string;
  };
  user_inputs: {
    skills: string;
    experience_level: string;
    client_type: string;
    hours_per_week: number;
    region: string;
  };
  ai_researched_costs: {
    monthly_software_cost: number;
    software_details: string;
    monthly_workspace_cost: number;
    workspace_details: string;
    monthly_equipment_cost: number;
    equipment_details: string;
    monthly_utilities_cost: number;
    monthly_internet_cost: number;
    total_monthly_expenses: number;
  };
  ai_researched_income: {
    suggested_monthly_income: number;
    income_reasoning: string;
    billable_hours_ratio: number;
    estimated_billable_hours: number;
  };
  market_research: {
    median_rate: number;
    percentile_75_rate: number;
    position: string;
    market_insights: string;
  };
  calculation_breakdown: {
    total_costs: number;
    target_income: number;
    billable_hours: number;
    urea_formula_result: number;
  };
  sources: string[];
  disclaimer: string;
  recommendation: string;
}

export class QuickEstimateRate {
  constructor(
    private geminiService: GeminiService,
    private marketBenchmarkRepo: IMarketBenchmarkRepository
  ) {}

  async execute(input: QuickEstimateInput): Promise<QuickEstimateOutput> {
    // ===== INPUT SANITIZATION (Prevent Prompt Injection) =====
    const sanitizedSkills = sanitizeSkillsInput(input.skills);
    const sanitizedRegion = sanitizeRegionInput(input.region || 'cambodia');
    const sanitizedExperienceLevel = validateEnumInput(
      input.experience_level,
      ['beginner', 'intermediate', 'experienced', 'expert'],
      'intermediate'
    );
    const sanitizedClientType = validateEnumInput(
      input.client_type || 'sme',
      ['startup', 'sme', 'corporate', 'ngo', 'government'],
      'sme'
    );

    // Validate sanitized skills is not empty
    if (!sanitizedSkills) {
      throw new Error('Skills input is required and must contain valid skill names');
    }

    const region = sanitizedRegion;
    const clientType = sanitizedClientType;
    const useGrounding = input.useGrounding !== false; // Default to true

    // Map experience level to seniority
    const seniorityMap: Record<string, string> = {
      'beginner': 'junior',
      'intermediate': 'mid',
      'experienced': 'senior',
      'expert': 'expert'
    };
    const seniority = seniorityMap[sanitizedExperienceLevel] || 'mid';

    // Fetch any existing market benchmarks from database for context
    const benchmarks = await this.marketBenchmarkRepo.findByRegion(region);
    const relevantBenchmarks = benchmarks.filter(b => b.seniority_level === seniority);

    // Let Gemini do ALL the research and estimation - no hardcoded values
    // IMPORTANT: Use sanitized values to prevent prompt injection
    const aiResearch = await this.generateAIResearchedEstimate({
      skills: sanitizedSkills,  // Use sanitized skills
      experienceLevel: sanitizedExperienceLevel,  // Use sanitized experience level
      seniority,
      clientType,
      hoursPerWeek: input.hours_per_week,
      region,
      existingBenchmarks: relevantBenchmarks.length > 0 ? relevantBenchmarks : null,
      useGrounding
    });

    // Build the response with AI-researched data
    return {
      estimate: {
        hourly_rate_min: aiResearch.hourly_rate_min,
        hourly_rate_max: aiResearch.hourly_rate_max,
        recommended_rate: aiResearch.recommended_rate,
        currency: 'USD'
      },
      user_inputs: {
        skills: sanitizedSkills,  // Return sanitized version
        experience_level: sanitizedExperienceLevel,  // Return sanitized version
        client_type: clientType,
        hours_per_week: input.hours_per_week,
        region
      },
      ai_researched_costs: {
        monthly_software_cost: aiResearch.costs.software_cost,
        software_details: aiResearch.costs.software_details,
        monthly_workspace_cost: aiResearch.costs.workspace_cost,
        workspace_details: aiResearch.costs.workspace_details,
        monthly_equipment_cost: aiResearch.costs.equipment_cost,
        equipment_details: aiResearch.costs.equipment_details,
        monthly_utilities_cost: aiResearch.costs.utilities_cost,
        monthly_internet_cost: aiResearch.costs.internet_cost,
        total_monthly_expenses: aiResearch.costs.total_expenses
      },
      ai_researched_income: {
        suggested_monthly_income: aiResearch.income.suggested_income,
        income_reasoning: aiResearch.income.reasoning,
        billable_hours_ratio: aiResearch.income.billable_ratio,
        estimated_billable_hours: aiResearch.income.billable_hours
      },
      market_research: {
        median_rate: aiResearch.market.median_rate,
        percentile_75_rate: aiResearch.market.percentile_75,
        position: aiResearch.market.position,
        market_insights: aiResearch.market.insights
      },
      calculation_breakdown: {
        total_costs: aiResearch.costs.total_expenses,
        target_income: aiResearch.income.suggested_income,
        billable_hours: aiResearch.income.billable_hours,
        urea_formula_result: aiResearch.urea_calculation
      },
      sources: aiResearch.sources,
      disclaimer: 'This estimate is generated by AI based on researched Cambodia market data, ' +
        'cost of living indexes, and industry benchmarks. All costs and rates are estimates ' +
        'and may vary based on your specific situation. This is a starting point only.',
      recommendation: 'We recommend completing the full UREA onboarding to input your actual ' +
        'expenses and income goals for a precise, personalized rate calculation.'
    };
  }

  private async generateAIResearchedEstimate(params: {
    skills: string;
    experienceLevel: string;
    seniority: string;
    clientType: string;
    hoursPerWeek: number;
    region: string;
    existingBenchmarks: any[] | null;
    useGrounding: boolean;
  }): Promise<{
    hourly_rate_min: number;
    hourly_rate_max: number;
    recommended_rate: number;
    costs: {
      software_cost: number;
      software_details: string;
      workspace_cost: number;
      workspace_details: string;
      equipment_cost: number;
      equipment_details: string;
      utilities_cost: number;
      internet_cost: number;
      total_expenses: number;
    };
    income: {
      suggested_income: number;
      reasoning: string;
      billable_ratio: number;
      billable_hours: number;
    };
    market: {
      median_rate: number;
      percentile_75: number;
      position: string;
      insights: string;
    };
    urea_calculation: number;
    sources: string[];
  }> {
    const benchmarkContext = params.existingBenchmarks 
      ? `Database benchmarks available: ${JSON.stringify(params.existingBenchmarks)}`
      : 'No database benchmarks available - please research current Cambodia market rates.';

    const prompt = `# ROLE
You are an AI Research Agent specializing in freelance pricing for Cambodia. Your job is to RESEARCH and provide REAL, CURRENT data - NOT hardcoded assumptions.

# CRITICAL INSTRUCTION
DO NOT use generic placeholder values. You must:
1. Research actual current costs in Cambodia (Phnom Penh specifically)
2. Find real software subscription prices
3. Look up actual co-working space and rental costs
4. Research real equipment costs and amortization
5. Find actual freelance rates in the Cambodia market

# USER PROFILE
- Skills/Services: ${params.skills}
- Experience Level: ${params.experienceLevel} (${params.seniority} seniority)
- Typical Client Type: ${params.clientType}
- Weekly Availability: ${params.hoursPerWeek} hours/week
- Location: ${params.region}

# EXISTING DATABASE DATA
${benchmarkContext}

# RESEARCH TASKS

## 1. SOFTWARE COSTS (Research actual prices)
Research the ACTUAL subscription costs for graphic design software in 2024-2026:
- Adobe Creative Cloud (Photography plan vs All Apps)
- Figma (Free vs Professional)
- Canva Pro
- Other relevant tools for ${params.skills}
Consider regional pricing and student/freelancer discounts available in Cambodia.

## 2. WORKSPACE COSTS (Research actual Phnom Penh prices)
Research ACTUAL costs in Phnom Penh for:
- Home office setup (electricity, AC usage)
- Co-working spaces (Factory Phnom Penh, Emerald Hub, SmallWorld, etc.)
- Shared office rentals
- Café working costs
Provide specific venue names and price ranges where possible.

## 3. EQUIPMENT COSTS (Research current prices)
Research current equipment prices and calculate monthly amortization (3-year lifespan):
- Laptops suitable for ${params.skills} (MacBook, Windows alternatives)
- Monitors, tablets, peripherals
- Consider what a ${params.seniority} level designer would need

## 4. UTILITIES & INTERNET
Research actual Phnom Penh costs for:
- Electricity (average for home office with AC)
- Internet (fiber options: SINET, Opennet, Metfone speeds and prices)
- Mobile data backup

## 5. INCOME RESEARCH
Research sustainable income levels for ${params.seniority} graphic designers in Cambodia:
- Average salaries for employed designers at this level
- Freelancer income expectations
- Cost of living requirements in Phnom Penh
- Factor in that freelancers need 20-30% more than employed for benefits/taxes

## 6. MARKET RATES
Research current freelance graphic design rates in Cambodia:
- Rates on local job boards
- International platform rates (Upwork, Fiverr) for Cambodian designers
- Agency rates for comparison
- Rates specific to ${params.skills}

## 7. BILLABLE HOURS
Research realistic billable hour ratios for freelancers:
- Industry standards for ${params.seniority} level
- Time spent on admin, marketing, learning
- Realistic utilization rates

# UREA CALCULATION
After researching all costs, apply the UREA formula:
Base Rate = (Total Monthly Expenses + Desired Monthly Income) / Monthly Billable Hours

# RESPONSE FORMAT
Return ONLY valid JSON (no markdown, no explanation outside JSON):

{
  "hourly_rate_min": number,
  "hourly_rate_max": number,
  "recommended_rate": number,
  "costs": {
    "software_cost": number,
    "software_details": "string explaining what software and why this price",
    "workspace_cost": number,
    "workspace_details": "string explaining workspace choice and actual venue/prices researched",
    "equipment_cost": number,
    "equipment_details": "string explaining equipment needed and amortization calculation",
    "utilities_cost": number,
    "internet_cost": number,
    "total_expenses": number
  },
  "income": {
    "suggested_income": number,
    "reasoning": "string explaining why this income level based on research",
    "billable_ratio": number (decimal 0.0-1.0),
    "billable_hours": number (monthly)
  },
  "market": {
    "median_rate": number,
    "percentile_75": number,
    "position": "below_market|at_market|above_market|premium",
    "insights": "string with specific market insights for ${params.skills} in Cambodia"
  },
  "urea_calculation": number (the raw UREA formula result before market adjustments),
  "sources": ["array of data sources, websites, or knowledge bases used"]
}

Now research and generate the estimate with REAL data, not placeholders.`;

    try {
      let responseText: string;
      let webSources: Array<{ uri: string; title: string }> = [];
      let searchQueries: string[] = [];

      if (params.useGrounding) {
        // Use Google Search grounding for real-time web research
        console.log('[QuickEstimate] Using Google Search Grounding');
        const groundedResponse = await this.geminiService.generateContentWithGrounding(prompt, 0.2);
        
        responseText = groundedResponse.text;
        webSources = groundedResponse.groundingMetadata?.webSearchSources || [];
        searchQueries = groundedResponse.groundingMetadata?.searchQueries || [];
        
        // Log what searches were performed
        if (searchQueries.length) {
          console.log(`[QuickEstimate] AI searched for: ${searchQueries.join(', ')}`);
        }
      } else {
        // Use regular generation without grounding (AI knowledge only)
        console.log('[QuickEstimate] Using AI Knowledge Base (no grounding)');
        responseText = await this.geminiService.generateContent(prompt);
      }
      
      // Parse the AI response
      responseText = responseText
        .replace(/^```json\s*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim();

      const aiResult = JSON.parse(responseText);

      // Validate the response has all required fields
      this.validateAIResponse(aiResult);

      // Combine AI-provided sources with actual web sources from grounding
      const combinedSources = [
        ...webSources.map(s => s.title ? `${s.title} (${s.uri})` : s.uri),
        ...(aiResult.sources || [])
      ];

      // Add indicator for source type
      if (!params.useGrounding) {
        combinedSources.push('(AI Knowledge Base - No live web search)');
      }

      return {
        hourly_rate_min: Math.round(aiResult.hourly_rate_min * 100) / 100,
        hourly_rate_max: Math.round(aiResult.hourly_rate_max * 100) / 100,
        recommended_rate: Math.round(aiResult.recommended_rate * 100) / 100,
        costs: {
          software_cost: Math.round(aiResult.costs.software_cost),
          software_details: aiResult.costs.software_details || 'AI-researched software costs',
          workspace_cost: Math.round(aiResult.costs.workspace_cost),
          workspace_details: aiResult.costs.workspace_details || 'AI-researched workspace costs',
          equipment_cost: Math.round(aiResult.costs.equipment_cost),
          equipment_details: aiResult.costs.equipment_details || 'AI-researched equipment costs',
          utilities_cost: Math.round(aiResult.costs.utilities_cost || 0),
          internet_cost: Math.round(aiResult.costs.internet_cost || 0),
          total_expenses: Math.round(aiResult.costs.total_expenses)
        },
        income: {
          suggested_income: Math.round(aiResult.income.suggested_income),
          reasoning: aiResult.income.reasoning || 'Based on Cambodia market research',
          billable_ratio: aiResult.income.billable_ratio,
          billable_hours: Math.round(aiResult.income.billable_hours)
        },
        market: {
          median_rate: Math.round(aiResult.market.median_rate * 100) / 100,
          percentile_75: Math.round(aiResult.market.percentile_75 * 100) / 100,
          position: aiResult.market.position || 'at_market',
          insights: aiResult.market.insights || 'Cambodia freelance design market'
        },
        urea_calculation: Math.round(aiResult.urea_calculation * 100) / 100,
        sources: combinedSources.length > 0 ? combinedSources : ['AI market research', 'Cambodia cost of living data']
      };
    } catch (error: any) {
      console.error('[QuickEstimate] AI research failed:', {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      
      // Don't leak internal error details to user
      throw new Error(
        'Unable to generate estimate. Please try again or complete the full onboarding for manual input.'
      );
    }
  }

  private validateAIResponse(result: any): void {
    const required = ['hourly_rate_min', 'hourly_rate_max', 'recommended_rate', 'costs', 'income', 'market'];
    for (const field of required) {
      if (result[field] === undefined || result[field] === null) {
        throw new Error(`AI response missing required field: ${field}`);
      }
    }

    if (!result.costs.total_expenses || result.costs.total_expenses <= 0) {
      throw new Error('AI must research and provide actual cost estimates');
    }

    if (!result.income.suggested_income || result.income.suggested_income <= 0) {
      throw new Error('AI must research and provide income suggestions');
    }
  }
}
