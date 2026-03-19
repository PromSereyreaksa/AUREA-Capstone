import { HttpClient, API_BASE_URL } from './client';

// Types for pricing API
export interface OnboardingSessionStart {
  user_id: number;
}

export interface OnboardingAnswer {
  session_id: string;
  answer: string | number | boolean;
}

export interface BaseRateCalculation {
  user_id: number;
  session_id?: string;
  onboarding_data?: Record<string, any>;
}

export interface ProjectRateCalculation {
  user_id: number;
  project_id?: number;
  client_type: 'startup' | 'sme' | 'corporate' | 'ngo' | 'government';
  client_region: 'cambodia' | 'southeast_asia' | 'global';
}

export interface PricingProfile {
  user_id: number;
  base_hourly_rate: number;
  fixed_costs?: Record<string, number>;
  variable_costs?: Record<string, number>;
  desired_monthly_income?: number;
  billable_hours_per_month?: number;
  profit_margin?: number;
  seniority_level?: 'junior' | 'mid' | 'senior' | 'expert';
}

export interface QuickEstimate {
  user_id: number;
  skills: string;
  experience_level: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  client_type: 'startup' | 'sme' | 'corporate' | 'ngo' | 'government';
  hours_per_week: number;
  region: 'cambodia' | 'southeast_asia' | 'global';
}

export interface BenchmarkParams {
  user_id: number;
  skill_categories?: string;
  seniority_level?: 'junior' | 'mid' | 'senior' | 'expert';
}

// API Response types
export interface OnboardingSessionResponse {
  success: boolean;
  data: {
    session_id: string;
    current_question?: {
      question: string;
      type: string;
    };
    progress?: number;
    total_questions?: number;
    answers?: Record<string, any>;
    completed?: boolean;
    user_id?: number;
  };
}

export interface AnswerResponse {
  success: boolean;
  data: {
    next_question?: {
      question: string;
      type: string;
    };
    progress?: number;
    total_questions?: number;
    completed?: boolean;
  };
}

export interface BaseRateResponse {
  success: boolean;
  data: {
    base_hourly_rate: number;
    currency: string;
    breakdown?: {
      fixed_costs_per_hour: number;
      variable_costs_per_hour: number;
      desired_income_per_hour: number;
      profit_margin: number;
    };
    calculations?: {
      total_monthly_costs: number;
      desired_monthly_income: number;
      billable_hours_per_month: number;
      profit_margin_percentage: number;
    };
  };
}

export interface ProjectRateResponse {
  success: boolean;
  data: {
    project_rate: number;
    base_rate: number;
    adjustments: {
      client_type_multiplier: number;
      region_multiplier: number;
    };
    recommended_price_range: {
      min: number;
      max: number;
    };
    market_position: string;
  };
}

export interface PricingProfileResponse {
  success: boolean;
  data: PricingProfile;
}

export interface QuickEstimateResponse {
  success: boolean;
  data: {
    estimate: {
      hourly_rate_min: number;
      hourly_rate_max: number;
      recommended_rate: number;
      currency: string;
    };
    user_inputs: {
      skills: string[];
      experience_level: string;
      hours_per_week: number;
    };
    estimated_assumptions: {
      monthly_costs_low: number;
      monthly_costs_high: number;
      desired_income_estimate: number;
      billable_hours_per_month: number;
    };
    market_context: {
      cambodia_market_range: {
        min: number;
        max: number;
      };
      seniority_benchmark: string;
    };
    disclaimer: string;
    recommendation: string;
  };
}

export interface BenchmarkResponse {
  success: boolean;
  data: {
    benchmarks: Array<{
      category_id: number;
      category_name: string;
      seniority_level: string;
      hourly_rate_min: number;
      hourly_rate_max: number;
      average_rate: number;
      currency: string;
      market: string;
    }>;
    market_context: {
      region: string;
      last_updated: string;
      sample_size: number;
    };
  };
}

export interface AcceptPortfolioRateRequest {
  hourly_rate: number;
  seniority_level?: string;
  skill_categories?: number[];
  experience_years?: number;
  researched_costs?: Record<string, number>;
  desired_monthly_income?: number;
  billable_hours_per_month?: number;
  profit_margin?: number;
}

export interface AcceptPortfolioRateResponse {
  success: boolean;
  data: {
    pricing_profile: {
      user_id: number;
      base_hourly_rate: number;
      seniority_level: string;
      created_at: string;
    };
    action: 'created' | 'updated';
    message: string;
  };
}

export interface CreateManualProjectRequest {
  user_id: number;
  project_name: string;
  title: string;
  description?: string;
  duration?: number;
  difficulty?: string;
  licensing?: string;
  usage_rights?: string;
  deliverables: Array<{
    deliverable_type: string;
    quantity: number;
    items?: string[];
  }>;
}

export interface CreateManualProjectResponse {
  success: boolean;
  data: {
    project: {
      project_id: number;
      user_id: number;
      project_name: string;
      title?: string;
      description?: string;
      duration?: number;
      difficulty?: string;
      licensing?: string;
      usage_rights?: string;
      client_type?: string;
      client_region?: string;
      calculated_rate?: number;
    };
    deliverables: Array<{
      deliverable_id: number;
      project_id: number;
      deliverable_type: string;
      quantity: number;
      items: string[];
    }>;
    calculated_rate?: number;
  };
}

export interface InvoiceItem {
  invoice_id: number;
  invoice_number: string;
  project_id: number;
  client_name: string;
  client_email: string;
  client_location: string;
  invoice_date?: string;
  created_at?: string;
}

export interface CreateInvoiceRequest {
  project_id: number;
  client_name: string;
  client_email: string;
  client_location: string;
  invoice_date?: string;
}

export interface CreateInvoiceResponse {
  success: boolean;
  data: InvoiceItem;
}

export interface ListInvoicesResponse {
  success: boolean;
  data: InvoiceItem[];
}

export interface ExtractProjectPdfResponse {
  success: boolean;
  data: {
    project: {
      project_id: number;
      project_name?: string;
      title?: string;
      description?: string;
      duration?: number;
      difficulty?: string;
      licensing?: string;
      usage_rights?: string;
    };
    deliverables: Array<{
      deliverable_id: number;
      deliverable_type: string;
      quantity: number;
      items: string[];
    }>;
    clientContext?: {
      client_type?: string;
      client_region?: string;
      budget_mentioned?: number | null;
      urgency?: string;
      estimated_project_hours?: number | null;
      complexity_indicators?: string[];
    };
  };
}

const pricingBaseUrl = `${API_BASE_URL}/pricing`;
const projectBaseUrl = `${API_BASE_URL}/pdf`;
const invoiceBaseUrl = `${API_BASE_URL}/invoices`;

export class PricingClient {
  private client: HttpClient;
  private projectClient: HttpClient;
  private invoiceClient: HttpClient;
  private invoiceBaseUrl: string;

  constructor(baseUrl?: string) {
    this.client = new HttpClient(baseUrl ? `${baseUrl}/pricing` : pricingBaseUrl);
    this.projectClient = new HttpClient(baseUrl ? `${baseUrl}/pdf` : projectBaseUrl);
    this.invoiceClient = new HttpClient(baseUrl ? `${baseUrl}/invoices` : invoiceBaseUrl);
    this.invoiceBaseUrl = baseUrl ? `${baseUrl}/invoices` : invoiceBaseUrl;
  }

  // Onboarding endpoints
  async startOnboarding(data: OnboardingSessionStart): Promise<OnboardingSessionResponse> {
    return this.client.post<OnboardingSessionResponse>('/onboarding/start', data);
  }

  async answerOnboardingQuestion(data: OnboardingAnswer): Promise<AnswerResponse> {
    return this.client.post<AnswerResponse>('/onboarding/answer', data);
  }

  async getOnboardingSession(sessionId: string): Promise<OnboardingSessionResponse> {
    return this.client.get<OnboardingSessionResponse>(`/onboarding/session/${sessionId}`);
  }

  // Calculation endpoints
  async calculateBaseRate(data: BaseRateCalculation): Promise<BaseRateResponse> {
    return this.client.post<BaseRateResponse>('/calculate/base-rate', data);
  }

  async calculateProjectRate(data: ProjectRateCalculation): Promise<ProjectRateResponse> {
    return this.client.post<ProjectRateResponse>('/calculate/project-rate', data);
  }

  // Profile endpoints
  async getPricingProfile(userId: number): Promise<PricingProfileResponse> {
    return this.client.get<PricingProfileResponse>(`/profile?user_id=${userId}`);
  }

  async updatePricingProfile(userId: number, data: Partial<PricingProfile>): Promise<PricingProfileResponse> {
    return this.client.put<PricingProfileResponse>(`/profile?user_id=${userId}`, data);
  }

  // AI-powered estimation
  async quickEstimate(data: QuickEstimate): Promise<QuickEstimateResponse> {
    return this.client.post<QuickEstimateResponse>('/quick-estimate', data);
  }

  // Portfolio-assisted pricing
  async portfolioAssist(data: FormData | Record<string, any>): Promise<any> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // If data is FormData, don't set Content-Type (let browser set it)
    // If data is JSON, set Content-Type
    let body: string | FormData;
    if (data instanceof FormData) {
      body = data;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const response = await fetch(`${this.client.baseUrl}/portfolio-assist`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({
          error: { message: 'Network error. Please try again.' },
        }));
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
  }

  async acceptPortfolioRate(data: AcceptPortfolioRateRequest): Promise<AcceptPortfolioRateResponse> {
    return this.client.post<AcceptPortfolioRateResponse>('/portfolio-assist/accept', data);
  }

  // Manual project creation (for project-based estimator)
  async createManualProject(data: CreateManualProjectRequest): Promise<CreateManualProjectResponse> {
    return this.projectClient.post<CreateManualProjectResponse>('/create-project', data);
  }

  // Invoice endpoints
  async createInvoice(data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    return this.invoiceClient.post<CreateInvoiceResponse>('/', data);
  }

  async listInvoices(): Promise<ListInvoicesResponse> {
    return this.invoiceClient.get<ListInvoicesResponse>('/');
  }

  async downloadInvoicePdf(invoiceId: number): Promise<Blob> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.invoiceBaseUrl}/${invoiceId}/pdf`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: 'Failed to download invoice PDF' },
      }));
      throw new Error(error.error?.message || 'Failed to download invoice PDF');
    }

    return response.blob();
  }

  async extractProjectFromPdf(file: File, userId: number): Promise<ExtractProjectPdfResponse> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('user_id', String(userId));

    const response = await fetch(`${projectBaseUrl}/extract?calculate_pricing=true&use_grounding=true`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: 'PDF extraction failed' },
      }));
      throw new Error(error.error?.message || 'PDF extraction failed');
    }

    return response.json();
  }

  // Benchmark data
  async getBenchmarks(params: BenchmarkParams): Promise<BenchmarkResponse> {
    const queryString = new URLSearchParams({
      user_id: params.user_id.toString(),
      ...(params.skill_categories && { skill_categories: params.skill_categories }),
      ...(params.seniority_level && { seniority_level: params.seniority_level }),
    }).toString();

    return this.client.get<BenchmarkResponse>(`/benchmark?${queryString}`);
  }
}

// Export singleton instance
export const pricingClient = new PricingClient();
