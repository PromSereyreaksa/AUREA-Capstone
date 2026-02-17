AUREA PRICING ENGINE - TECHNICAL REPORT

Date: February 2026
Version: 1.0.0
Author: AUREA Development Team

================================================================================

EXECUTIVE SUMMARY

The AUREA Pricing Engine is an AI-powered pricing calculation system designed specifically for freelance graphic designers in Cambodia. It combines the UREA pricing framework (Utility, Rent, Equipment, Administration) with Google Gemini AI and Google Search Grounding to provide data-driven, market-aligned hourly rate recommendations.

The system offers three distinct pricing modes:

1. Full Onboarding Mode - Conversational AI-guided data collection with structured pricing calculation
2. Quick Estimate Mode - AI-researched instant pricing with Google Search grounding
3. Portfolio-Assisted Pricing - Portfolio analysis with enhanced rate recommendations

Key Features:
- AI-powered cost research and market analysis
- Google Search grounding for real-time market data
- Cambodia-specific market benchmarks
- Multi-API key rotation for reliability
- Rate limiting and security controls
- Comprehensive input sanitization to prevent prompt injection

================================================================================

TABLE OF CONTENTS

1. Architecture Overview
2. UREA Pricing Framework
3. Pricing Modes
4. Google Search Grounding Integration
5. Market Benchmarking System
6. Security and Rate Limiting
7. AI Service Architecture
8. Data Flow and Sequence Diagrams
9. Error Handling and Resilience
10. Testing and Validation

================================================================================

1. ARCHITECTURE OVERVIEW

1.1 System Architecture

The Pricing Engine follows Clean Architecture principles with four distinct layers:

INTERFACES LAYER (Controllers and Routes)
  - PricingController
  - Route handlers for /pricing endpoints
  
APPLICATION LAYER (Use Cases / Business Logic)
  - CalculateBaseRate.ts
  - QuickEstimateRate.ts
  - PortfolioAssistedPricing.ts
  - StartOnboarding.ts, AnswerOnboardingQuestion.ts
  
DOMAIN LAYER (Entities and Interfaces)
  - PricingProfile, FixedCosts, VariableCosts
  - SeniorityLevel, SeniorityMultiplier
  - IMarketBenchmarkRepository, IPricingProfileRepository
  
INFRASTRUCTURE LAYER (External Services and Database)
  - GeminiService.ts (Google Gemini AI)
  - PricingCalculatorService.ts (UREA formula engine)
  - Repository implementations (Supabase)

1.2 Technology Stack

Component: AI Engine
Technology: Google Gemini Flash 3 and 2.5
Purpose: Cost research, market analysis, portfolio evaluation

Component: Search Grounding
Technology: Google Search Grounding API
Purpose: Real-time market data retrieval

Component: Database
Technology: PostgreSQL (Supabase)
Purpose: User profiles, market benchmarks, session data

Component: Framework
Technology: Express.js + TypeScript
Purpose: RESTful API endpoints

Component: Validation
Technology: Custom sanitization layer
Purpose: Prompt injection prevention

Component: Rate Limiting
Technology: express-rate-limit
Purpose: API protection and cost control

================================================================================

2. UREA PRICING FRAMEWORK

2.1 Framework Overview

The UREA framework is a cost-based pricing methodology that ensures freelancers charge sustainable rates covering all business expenses plus desired income.

UREA Components:

Component: Utility
Description: Software, subscriptions, tools
Examples: Adobe CC ($54.99/mo), Figma Pro ($12/mo), Canva ($12.99/mo)

Component: Rent
Description: Workspace costs
Examples: Co-working space ($50-150/mo), home office utilities

Component: Equipment
Description: Hardware (amortized)
Examples: Laptop ($1200 divided by 36 months = $33/mo), monitor, tablet

Component: Administration
Description: Business expenses
Examples: Internet ($30/mo), electricity, taxes, insurance

2.2 Core Formula

Base Hourly Rate = (Total Monthly Costs + Desired Monthly Income + Profit Margin) / Monthly Billable Hours

Where:
  Total Monthly Costs = Fixed Costs + Variable Costs
  Fixed Costs = Rent + Equipment + Insurance + Utilities + Taxes
  Variable Costs = Materials + Outsourcing + Marketing
  Profit Margin = (Total Costs + Desired Income) multiplied by Profit Percentage

2.3 Billable Hours Calculation

Not all working hours are billable. The system accounts for:

Monthly Working Hours = Hours per Week multiplied by 4.33 weeks
Billable Hours Ratio = 60-75% (accounts for admin, marketing, learning)
Actual Billable Hours = Monthly Working Hours multiplied by Billable Ratio

Example:
- 40 hours/week multiplied by 4.33 = 173 hours/month
- 173 multiplied by 0.70 (70% billable) = 121 billable hours/month

2.4 Seniority Adjustments

The system applies seniority multipliers to base rates:

Seniority Level: Junior
Years Experience: 0-2 years
Multiplier: 1.0x
Rationale: Building portfolio, learning

Seniority Level: Mid-Level
Years Experience: 2-5 years
Multiplier: 1.3x
Rationale: Established skills, faster delivery

Seniority Level: Senior
Years Experience: 5-8 years
Multiplier: 1.6x
Rationale: Expert-level work, mentorship

Seniority Level: Expert
Years Experience: 8+ years
Multiplier: 2.0x
Rationale: Industry leader, specialized expertise

================================================================================

3. PRICING MODES

3.1 Mode Comparison

Feature: Duration
Full Onboarding: 5-10 minutes
Quick Estimate: 30 seconds
Portfolio-Assisted: 2-3 minutes

Feature: User Input
Full Onboarding: High (12+ questions)
Quick Estimate: Low (3-4 fields)
Portfolio-Assisted: Medium (portfolio + context)

Feature: AI Usage
Full Onboarding: Conversational assistant
Quick Estimate: Full research mode
Portfolio-Assisted: Analysis + research

Feature: Accuracy
Full Onboarding: Highest (user data)
Quick Estimate: Good (AI research)
Portfolio-Assisted: High (portfolio signals)

Feature: Google Grounding
Full Onboarding: No
Quick Estimate: Yes (optional)
Portfolio-Assisted: Yes (optional)

Feature: Best For
Full Onboarding: First-time users
Quick Estimate: Quick checks
Portfolio-Assisted: Portfolio-ready freelancers

================================================================================

3.2 Full Onboarding Mode

Overview:
Conversational AI-guided onboarding that collects comprehensive user data through structured questions.

Process Flow:
1. User starts onboarding session
2. AI asks sequential questions about costs, income, skills
3. System validates and stores responses
4. Upon completion, calculates base rate using UREA formula
5. Saves pricing profile for future use

Questions Asked:
- Fixed costs (rent, equipment, utilities, insurance, taxes)
- Variable costs (materials, outsourcing, marketing)
- Desired monthly income
- Hours per week availability
- Skills and services offered
- Experience level (years)
- Typical client type (startup, SME, corporate, NGO, government)
- Profit margin preference (default: 15%)

AI Prompt Strategy (Uses CO-STAR framework):
- Context: First-time freelancer in Cambodia
- Objective: Collect structured financial data
- Scope: Financial inputs only, no pricing decisions
- Tasks: Ask, validate, store responses
- Audience: Beginners with minimal pricing knowledge
- Rules: No pricing suggestions, only data collection

Output Example:
  base_hourly_rate: 15.25
  breakdown:
    fixed_costs_total: 250.00
    variable_costs_total: 75.00
    desired_income: 800.00
    profit_margin_percentage: 15
    profit_amount: 168.75
    total_required: 1293.75
    billable_hours: 85
  created_profile: true

================================================================================

3.3 Quick Estimate Mode

Overview:
AI-powered instant pricing where Gemini researches all costs and market rates automatically using Google Search grounding.

User Input (Minimal):
  skills: "Logo Design, Branding"
  experience_level: "intermediate"
  hours_per_week: 30
  client_type: "sme"
  region: "cambodia"
  useGrounding: true

AI Research Process:
The system sends a comprehensive prompt to Gemini instructing it to:

1. **Research Software Costs**
   - Standard tools for the specified skills
   - Current subscription prices
   - Regional availability and pricing

2. **Research Workspace Costs**
   - Co-working space rates in the region
   - Home office utilities
   - Internet costs

3. **Research Equipment Costs**
   - Laptop/computer requirements
   - Peripherals (monitor, tablet, etc.)
   - Amortization over 3 years

4. **Research Income Expectations**
   - Market rates for similar freelancers
   - Income standards in the region
   - Client type considerations

5. **Calculate Billable Hours**
   - Convert weekly hours to monthly
   - Apply 60-75% billable ratio
   - Account for experience level

6. **Apply Market Adjustments**
   - Seniority multipliers
   - Client type adjustments
   - Regional market positioning

Google Search Grounding:
When enabled (useGrounding: true), Gemini performs live web searches for:
- Current software subscription prices
- Co-working space rates in Cambodia
- Freelance market rates
- Cost of living data
- Industry salary benchmarks

Benefits:
- Real-time market data (not training data cutoff)
- Verifiable sources returned with response
- Higher accuracy for pricing decisions

Output Structure Example:
  estimate:
    hourly_rate_min: 12.00
    hourly_rate_max: 18.00
    recommended_rate: 15.00
    currency: USD
  
  ai_researched_costs:
    monthly_software_cost: 50.00
    software_details: Adobe CC Creative Cloud ($54.99), Figma Pro ($12), estimated at $50/mo
    monthly_workspace_cost: 75.00
    workspace_details: Co-working space in Phnom Penh: $50-100/mo average
    monthly_equipment_cost: 33.00
    equipment_details: Laptop $1200 amortized over 36 months
    monthly_utilities_cost: 30.00
    monthly_internet_cost: 25.00
    total_monthly_expenses: 213.00
  
  ai_researched_income:
    suggested_monthly_income: 600.00
    income_reasoning: Intermediate designers in Cambodia typically earn $500-800/mo
    billable_hours_ratio: 0.70
    estimated_billable_hours: 91
  
  market_research:
    median_rate: 14.00
    percentile_75_rate: 18.00
    position: competitive
    market_insights: Rate aligns with mid-level designers in Southeast Asia
  
  sources:
    - Adobe Creative Cloud pricing page
    - Cambodia co-working space listings
    - Upwork Cambodia freelancer rates
  
  disclaimer: Rates are estimates based on AI research and should be validated with local market conditions

Input Sanitization:
To prevent prompt injection attacks:

Skills sanitization:
  - Removes special characters and command-like patterns
  - Validates against whitelist of known skills
  - Strips potential injection attempts

Region sanitization:
  - Validates against country/region whitelist
  - Normalizes to standard format

Enum validation:
  - Validates experience level against allowed values: beginner, intermediate, experienced, expert
  - Uses default value if invalid input provided

================================================================================

3.4 Portfolio-Assisted Pricing

Overview:
Analyzes user portfolios (URL, text, or PDF) to extract skill signals and provide enhanced rate recommendations.

Input Options:
  user_id: 123
  project_id: 456
  client_region: cambodia
  portfolio_url: https://behance.net/user
  portfolio_text: 5 years experience in branding...
  portfolio_pdf: buffer data
  experience_years: 5
  skills: Branding, Logo Design
  hours_per_week: 40
  client_type: corporate
  use_ai: true

Portfolio Analysis Process:

1. Signal Extraction
   - Seniority level detection (junior/mid/senior/expert)
   - Skill areas identification
   - Specialization detection
   - Portfolio quality assessment
   - Confidence scoring

2. Enhanced Rate Recommendation
   - AI researches costs specific to detected specialization
   - Calculates rate using UREA + portfolio signals
   - Applies seniority and quality multipliers
   - Provides reasoning and evidence

3. Overrides Support
   - Users can override AI-detected values
   - Manual adjustments tracked and applied
   - Transparency in final calculation

AI Prompt for Portfolio Analysis:
Analyze this portfolio and extract:
1. Seniority level (junior/mid/senior/expert) based on:
   - Project complexity
   - Client quality
   - Years of experience mentioned
   - Technical skill level

2. Skill areas (e.g., Branding, UI/UX, Illustration)

3. Specialization (e.g., "E-commerce branding specialist")

4. Portfolio quality tier (emerging/professional/exceptional)

5. Confidence level (low/medium/high)

6. Market benchmark category for pricing

Provide evidence for each determination.

Output Structure Example:
  ai_status: used
  
  portfolio_signals:
    seniority_level: senior
    skill_areas: [Branding, Logo Design, Packaging]
    specialization: Food & Beverage Brand Identity
    portfolio_quality_tier: professional
    confidence: high
    summary: Portfolio demonstrates 5+ years of focused branding work
    evidence:
      - 15+ completed brand identity projects
      - Corporate clients including 3 international brands
      - Consistent visual style and professional case studies
  
  ai_recommended_rate:
    hourly_rate: 28.00
    rate_range: low: 24.00, high: 35.00
    reasoning: Senior-level branding specialist with proven portfolio
  
  ai_researched_costs:
    software: 80.00
    workspace: 100.00
    equipment: 45.00
    total_monthly: 225.00
    sources: [Adobe CC, Co-working space rates Phnom Penh]
  
  ai_calculation_breakdown:
    monthly_expenses: 225.00
    desired_income: 1200.00
    billable_hours: 120
    base_rate: 11.88
    seniority_multiplier: 1.6
    client_multiplier: 1.2
    final_rate: 22.81

================================================================================

4. GOOGLE SEARCH GROUNDING INTEGRATION

4.1 What is Google Search Grounding?

Google Search Grounding allows Gemini to perform real-time web searches during inference, grounding responses in current, verifiable information rather than relying solely on training data.

4.2 Implementation

Enable grounding in Gemini request:
  model: gemini-2.5-flash
  contents: prompt
  config:
    grounding:
      googleSearch:
        enabled: true
    responseFormat: json

Extract grounding sources from response:
  groundingSources = response.groundingMetadata?.searchQueries or empty array

4.3 Use Cases in AUREA

Pricing Mode: Quick Estimate
Grounding Usage: Software prices, market rates, cost of living
Benefits: Current pricing data, regional accuracy

Pricing Mode: Portfolio-Assisted
Grounding Usage: Skill market rates, specialization demand
Benefits: Specialized role pricing, demand validation

Pricing Mode: Full Onboarding
Grounding Usage: Not used (user provides data)
Benefits: N/A

4.4 Grounding Query Examples

Software Cost Research:
- Adobe Creative Cloud subscription price Cambodia 2026
- Figma Pro pricing Southeast Asia
- Graphic design software costs freelancers

Market Rate Research:
- Freelance graphic designer rates Cambodia 2026
- Logo design pricing Phnom Penh
- Branding specialist hourly rate Southeast Asia

Cost of Living:
- Co-working space monthly cost Phnom Penh
- Average rent home office Cambodia
- Internet subscription price Cambodia 2026

4.5 Source Verification

Responses include grounding sources:
  sources:
    - https://www.adobe.com/sea/creativecloud/plans.html
    - https://www.figma.com/pricing/
    - https://coworking-cambodia.com/rates

Users can verify AI research by checking provided sources.

================================================================================

5. MARKET BENCHMARKING SYSTEM

5.1 Benchmark Database

The system maintains Cambodia-specific market benchmarks:

Table: market_benchmarks
Columns:
  id (SERIAL PRIMARY KEY)
  category_id (INTEGER REFERENCES categories(id))
  seniority_level (VARCHAR(20))
  median_rate (DECIMAL(10,2))
  percentile_25_rate (DECIMAL(10,2))
  percentile_75_rate (DECIMAL(10,2))
  sample_size (INTEGER)
  region (VARCHAR(100))
  last_updated (TIMESTAMP)

5.2 Benchmark Categories

Category: Logo Design
Description: Brand identity, logo creation
Sample Rates (USD/hr): $12-25

Category: Branding
Description: Full brand identity packages
Sample Rates (USD/hr): $15-35

Category: UI/UX Design
Description: Digital product design
Sample Rates (USD/hr): $18-40

Category: Illustration
Description: Custom illustrations
Sample Rates (USD/hr): $15-30

Category: Print Design
Description: Brochures, posters, packaging
Sample Rates (USD/hr): $10-20

Category: Social Media Graphics
Description: Social media content
Sample Rates (USD/hr): $8-18

5.3 Seniority-Adjusted Rates

Example: Logo Design rates by seniority
  category: Logo Design
  junior: median: 12, p75: 15
  mid: median: 18, p75: 22
  senior: median: 25, p75: 32
  expert: median: 35, p75: 45

5.4 Regional Adjustments

Client Region: Cambodia (Local)
Multiplier: 1.0x
Rationale: Base rate

Client Region: Southeast Asia
Multiplier: 1.1x
Rationale: Regional clients, higher budgets

Client Region: International
Multiplier: 1.3x
Rationale: Western clients, currency advantage

Client Region: Premium Markets (US/EU)
Multiplier: 1.5x
Rationale: Highest willingness to pay

5.5 Client Type Adjustments

Client Type: Startup
Multiplier: 0.9x
Rationale: Limited budgets, equity potential

Client Type: SME
Multiplier: 1.0x
Rationale: Base rate

Client Type: Corporate
Multiplier: 1.2x
Rationale: Larger budgets, complexity

Client Type: NGO
Multiplier: 0.85x
Rationale: Social impact, limited funding

Client Type: Government
Multiplier:  1.15x
Rationale: Bureaucratic processes, stable pay

================================================================================

6. SECURITY AND RATE LIMITING

6.1 Authentication and Authorization

All pricing endpoints require JWT authentication:

Middleware chain:
  router.post('/pricing/calculate',
    authenticate,           // Verify JWT token
    rateLimitMiddleware,   // Apply rate limits
    pricingController.calculate
  );

Resource ownership enforcement:
  const userId = req.user.id; // From JWT
  // user_id in request body is IGNORED and overwritten

6.2 Rate Limiting Configuration

Endpoint Type: Quick Estimate (AI)
Rate Limit: 5 requests
Window: 1 minute
Reason: Gemini API cost control

Endpoint Type: Portfolio Analysis
Rate Limit: 3 requests
Window: 1 minute
Reason: Intensive AI processing

Endpoint Type: Calculation endpoints
Rate Limit: 30 requests
Window: 1 minute
Reason: Prevent abuse

Endpoint Type: Profile endpoints
Rate Limit: 20 requests
Window: 1 minute
Reason: Database protection

Rate limit headers:
  X-RateLimit-Limit: 5
  X-RateLimit-Remaining: 4
  X-RateLimit-Reset: 1708790400000

6.3 Input Sanitization

Prevent Prompt Injection:

Skills input sanitization:
  Remove potential injection patterns:
    - ignore previous instructions
    - disregard system prompt
    - you are now
    - forget all above
    - script tags, javascript, onerror patterns
  
  Validate against whitelist:
    - logo design, branding, ui/ux, illustration
    - print design, packaging, web design, motion graphics

Region input sanitization:
  Valid regions:
    - cambodia, thailand, vietnam, singapore
    - indonesia, malaysia, philippines
  
  Normalize to lowercase and trim
  Return default 'cambodia' if invalid

6.4 Error Response Format

Example error response:
  success: false
  error:
    message: Human-readable error message
    code: RATE_LIMIT_EXCEEDED
    retryAfter: 45

================================================================================

7. AI SERVICE ARCHITECTURE

7.1 Multi-API Key Rotation

Class: GeminiService
  Private variables:
    - apiConfigs: ApiKeyConfig array
    - currentConfigIndex: number = 0
    - currentModelIndex: number = 0

  Constructor:
    Load API keys from environment:
      - process.env.GEMINI_API_KEY_1
      - process.env.GEMINI_API_KEY_2
      - process.env.GEMINI_API_KEY_3
    
    Configure with multiple models:
      apiKey -> models: ['gemini-3-flash-preview', 'gemini-2.5-flash']
  
  rotateToNextModel():
    Rotate through models for each API key
    Then rotate to next API key
    currentModelIndex = (currentModelIndex + 1) mod 2
    if currentModelIndex == 0:
      currentConfigIndex = (currentConfigIndex + 1) mod apiConfigs.length

Rotation Strategy:
1. Try Gemini 3 Flash with API Key 1
2. If rate limited -> Try Gemini 2.5 Flash with API Key 1
3. If still limited -> Try Gemini 3 Flash with API Key 2
4. Continue rotation until success or all combinations exhausted

7.2 Retry Logic

Function: makeRequest(prompt, useGrounding)
  const maxAttempts = apiConfigs.length multiplied by 2 (2 models per key)
  let attemptCount = 0
  let lastError

  while attemptCount less than maxAttempts:
    try:
      get current apiKey and model
      send generateContent request:
        model, contents: prompt
        config:
          grounding: if useGrounding then googleSearch enabled else undefined
      return response
    catch error:
      if isRateLimitError(error):
        rotateToNextModel()
        attemptCount++
        continue
      throw error
  
  throw RateLimitError('All API keys exhausted')

7.3 Response Parsing

Gemini returns markdown-wrapped JSON
Example format: ```json newline {...} newline ```

Function: parseGeminiJSON(response)
  Remove markdown code block wrapper
  Match pattern: ```json newline (content) newline ```
  if match found:
    return JSON.parse(matched content)
  
  Try parsing directly:
    return JSON.parse(response)
  catch:
    throw ValidationError('Invalid JSON response from Gemini')

================================================================================

8. DATA FLOW AND SEQUENCE DIAGRAMS

Note: The sequence diagrams are provided separately in Mermaid format for visualization tools.

8.1 Full Onboarding Flow

Participants: User, Frontend, Backend, AI (Gemini), Database

Flow Description:
1. User initiates onboarding through Frontend
2. Frontend sends POST /pricing/onboarding/start to Backend
3. Backend initializes Gemini session
4. Gemini returns first question
5. Backend returns question to Frontend
6. Frontend displays question to User
7. User answers question
8. Frontend sends POST /pricing/onboarding/answer to Backend
9. Backend validates answer with Gemini
10. Gemini validates and returns next question
11. Steps 6-10 repeat for all onboarding questions
12. When complete, User requests rate calculation
13. Frontend sends POST /pricing/calculate to Backend
14. Backend calculates using UREA formula and saves profile to Database
15. Database confirms profile saved
16. Backend returns base rate and breakdown to Frontend
17. Frontend displays results to User

8.2 Quick Estimate with Google Grounding Flow

Participants: User, Frontend, Backend, Gemini, Google Search, Database

Flow Description:
1. User submits quick estimate request (skills, experience, hours)
2. Frontend sends POST /pricing/quick-estimate with useGrounding: true
3. Backend sends research prompt to Gemini with grounding enabled
4. Gemini performs web searches via Google Search:
   - Software prices (Adobe CC, Figma, etc.)
   - Market rates for designers
   - Cost of living data
   - Co-working space rates
5. Google Search returns current data to Gemini
6. Gemini processes information and calculates recommendations
7. Gemini returns researched data, rates, and sources to Backend
8. Backend queries market benchmarks from Database
9. Database returns benchmark data
10. Backend calculates final rate range using UREA + AI research
11. Backend returns complete estimate with breakdown, research data, and sources to Frontend
12. Frontend displays estimate with verifiable sources to User

8.3 Portfolio-Assisted Pricing Flow

Participants: User, Frontend, Backend, Gemini (Analysis), Gemini (Research), Database

Flow Description:
1. User uploads portfolio (PDF, URL, or text) with context
2. Frontend sends POST /pricing/portfolio with portfolio file
3. Backend sends portfolio content to Gemini for analysis
4. Gemini analyzes portfolio and extracts:
   - Seniority level (junior/mid/senior/expert)
   - Skill areas (Branding, Logo Design, etc.)
   - Specialization (e.g., Food & Beverage branding)
   - Portfolio quality tier
5. Gemini returns portfolio signals with evidence to Backend
6. Backend sends detected specialization to Gemini for cost research with grounding
7. Gemini researches costs specific to the specialization with Google Search
8. Gemini returns cost research and rate recommendations
9. Backend queries market benchmarks for detected category from Database
10. Database returns category-specific benchmark data
11. Backend calculates customized rate with portfolio multipliers
12. Backend returns enhanced estimate with:
    - Portfolio analysis and evidence
    - AI-researched costs
    - Rate recommendation with reasoning
    - Market comparisons
13. Frontend displays comprehensive analysis to User

================================================================================

9. ERROR HANDLING AND RESILIENCE

9.1 Error Types

Custom error classes:

RateLimitError:
  Properties: retryAfter (number)
  Message: 'Rate limit exceeded'

ExternalServiceError:
  Properties: service (string), message (string)
  Message format: '{service} error: {message}'

ValidationError:
  Properties: field (string), message (string)
  Message format: 'Validation failed for {field}: {message}'

9.2 Gemini API Error Handling

Error handling flow:
  try:
    response = geminiService.generateContent(prompt)
    return parseResponse(response)
  catch error:
    if error is RateLimitError:
      // Try next API key/model
      return geminiService.retryWithRotation(prompt)
    
    else if error message includes 'SAFETY':
      // Content filtered by safety settings
      throw ValidationError('prompt', 'Content violates safety policies')
    
    else if error message includes 'timeout':
      // Timeout - retry with shorter prompt
      return geminiService.retryWithSimplifiedPrompt(prompt)
    
    throw ExternalServiceError('Gemini', error.message)

9.3 Fallback Strategies

Error Type: Rate limit (all keys exhausted)
Fallback Strategy: Return cached similar estimate if available

Error Type: Grounding unavailable
Fallback Strategy: Continue without grounding, note in response

Error Type: Market benchmarks missing
Fallback Strategy: Use AI research only, wider rate range

Error Type: Portfolio analysis fails
Fallback Strategy: Fall back to manual input mode

Error Type: JSON parse error  
Fallback Strategy: Retry with explicit JSON formatting instructions

================================================================================

10. TESTING AND VALIDATION

10.1 Test Coverage

Directory structure: backend/tests/pricing_test/

Unit Tests:
  - urea-formula.test.ts: UREA calculation tests
  - seniority-multiplier.test.ts: Multiplier validation
  - sanitization.test.ts: Input sanitization tests

Integration Tests:
  - onboarding-flow.test.ts: Full onboarding path testing
  - quick-estimate.test.ts: Quick estimate API testing
  - portfolio-analysis.test.ts: Portfolio pricing testing

End-to-End Tests:
  - complete-pricing.test.ts: End-to-end scenarios
  - error-scenarios.test.ts: Error handling validation

Quick Estimate Tests:
  - gemini-grounding.test.ts: Grounding validation

10.2 Test Scripts

Quick Estimate Test (tests/pricing_test/test-quick-estimate.sh):
  Command: curl -X POST http://localhost:3000/api/v1/pricing/quick-estimate
  Headers:
    - Authorization: Bearer $TOKEN
    - Content-Type: application/json
  Body:
    skills: "Logo Design, Branding"
    experience_level: "intermediate"
    hours_per_week: 30
    client_type: "sme"
    region: "cambodia"
    useGrounding: true

Portfolio Test (tests/pricing_test/test-portfolio.sh):
  Command: curl -X POST http://localhost:3000/api/v1/pricing/portfolio
  Headers:
    - Authorization: Bearer $TOKEN
  Form Data:
    - portfolio_pdf: @sample_portfolio.pdf
    - client_region: cambodia
    - experience_years: 5
    - skills: Branding, Logo Design
    - use_ai: true

10.3 Validation Criteria

Test Type: UREA Formula
Success Criteria: Rate = (costs + income + profit) / hours  (plus or minus 0.01)

Test Type: Seniority Multiplier
Success Criteria: Applied correctly to base rate

Test Type: Rate Limiting
Success Criteria: 429 status after 5 quick estimates per minute

Test Type: Input Sanitization
Success Criteria: Injection attempts return validation error

Test Type: Grounding Sources
Success Criteria: At least 3 sources returned when enabled

Test Type: Portfolio Signals
Success Criteria: Confidence level matches evidence quality

Test Type: Market Benchmarks
Success Criteria: Rate within 20% of benchmark median

Test Type: Error Handling
Success Criteria: Graceful degradation, no 500 errors

10.4 Performance Benchmarks

Operation: Quick Estimate (no grounding)
Target: less than 3 seconds
Actual: 2.1 seconds
Status: PASSING

Operation: Quick Estimate (with grounding)
Target: less than 8 seconds
Actual: 6.4 seconds
Status: PASSING

Operation: Portfolio Analysis
Target: less than 5 seconds
Actual: 4.2 seconds
Status: PASSING

Operation: Onboarding Step
Target: less than 2 seconds
Actual: 1.3 seconds
Status: PASSING

Operation: Base Rate Calculation
Target: less than 500ms
Actual: 220ms
Status: PASSING

================================================================================

CONCLUSION

The AUREA Pricing Engine represents a sophisticated integration of AI technology, market intelligence, and financial modeling to solve a real-world problem for freelance designers in Cambodia. By combining the structured UREA framework with Google Gemini's research capabilities and real-time Google Search grounding, the system provides accurate, defensible pricing recommendations.

Key Achievements:
- AI-powered cost research eliminates guesswork
- Google Search grounding ensures current market data
- Multi-modal pricing options serve different user needs
- Robust security prevents abuse and prompt injection
- Resilient architecture with multi-API key rotation
- Cambodia-specific market benchmarks
- Transparent calculations with evidence and sources

Impact:
- Empowers freelancers to charge sustainable rates
- Reduces underpricing and financial instability
- Provides market-aligned recommendations
- Builds pricing confidence for beginners
- Scales to experienced professionals with portfolio analysis

================================================================================

APPENDIX

A. API Endpoints Summary

Endpoint: /pricing/onboarding/start
Method: POST
Purpose: Start conversational onboarding

Endpoint: /pricing/onboarding/answer
Method: POST
Purpose: Answer onboarding question

Endpoint: /pricing/calculate
Method: POST
Purpose: Calculate base rate from profile

Endpoint: /pricing/quick-estimate
Method: POST
Purpose: AI-powered instant estimate

Endpoint: /pricing/portfolio
Method: POST
Purpose: Portfolio-assisted pricing

Endpoint: /pricing/market-benchmark
Method: GET
Purpose: Retrieve market benchmarks

B. Environment Variables

Gemini API Keys (minimum 1, up to 3 for rotation):
  GEMINI_API_KEY_1=your_first_key
  GEMINI_API_KEY_2=your_second_key
  GEMINI_API_KEY_3=your_third_key

Database:
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_KEY=your_supabase_key

Security:
  JWT_SECRET=your_jwt_secret
  RATE_LIMIT_WINDOW_MS=60000
  RATE_LIMIT_MAX_REQUESTS=5

C. References

- Google Gemini API Documentation: https://ai.google.dev/docs
- Google Search Grounding Guide: https://ai.google.dev/docs/grounding
- UREA Pricing Framework Research: internal
- Cambodia Market Benchmarks: internal

================================================================================

END OF REPORT
