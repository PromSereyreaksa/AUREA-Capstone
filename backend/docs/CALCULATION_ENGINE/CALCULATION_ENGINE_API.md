# AUREA Calculation Engine - API Documentation

## Overview

The AUREA Calculation Engine provides AI-powered pricing calculation for freelance designers. It implements the AUREA pricing framework (Administration, Utility, Rent, Equipment, Amortization) to help freelancers calculate sustainable hourly rates.

**Base URL:** `http://localhost:3000/api/v1`

---

## Security

### Authentication
All endpoints require Bearer token authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Authorization
**Resource ownership is enforced server-side.** The `user_id` parameter in requests is automatically overwritten with the authenticated user's ID from the JWT token. Users can only access their own resources.

### Rate Limiting
Rate limits are applied to protect the API and control costs:

| Endpoint Type | Rate Limit | Window |
|--------------|------------|--------|
| Quick Estimate (AI) | 5 requests | 1 minute |
| Calculation endpoints | 30 requests | 1 minute |
| Profile endpoints | 20 requests | 1 minute |
| Standard endpoints | 100 requests | 1 minute |

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1706784000000
```

When rate limited, you'll receive a `429 Too Many Requests` response:
```json
{
  "success": false,
  "error": {
    "message": "AI estimation limit reached. Please wait before making another request (max 5/minute).",
    "retryAfter": 45
  }
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message"
  }
}
```

### Common Status Codes
| Status | Description |
|--------|-------------|
| 400 | Validation error (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (accessing another user's resource) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Endpoints

### 1. Start Onboarding Session

Start a new pricing onboarding session or resume an existing one.

```
POST /pricing/onboarding/start
```

#### Request Headers
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |

#### Request Body
```json
{
  "user_id": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| user_id | integer | Yes | User's unique identifier |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Onboarding session started",
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "first_question": "What are your monthly rent or office costs? (Enter amount in USD)",
    "progress": {
      "current": 1,
      "total": 10,
      "percentage": 10
    }
  }
}
```

#### Error Responses
| Status | Description |
|--------|-------------|
| 400 | Validation error (invalid user_id) |
| 401 | Unauthorized (missing/invalid token) |

---

### 2. Answer Onboarding Question

Submit an answer to the current onboarding question.

```
POST /pricing/onboarding/answer
```

#### Request Headers
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |

#### Request Body
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "answer": "400"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| session_id | string (UUID) | Yes | Onboarding session ID |
| answer | string | Yes | User's answer (max 500 chars) |

#### Response (200 OK) - Next Question
```json
{
  "success": true,
  "message": "Answer recorded successfully",
  "data": {
    "is_valid": true,
    "next_question": "What are your monthly equipment and software costs?",
    "onboarding_complete": false,
    "progress": {
      "current": 2,
      "total": 10,
      "percentage": 20
    },
    "extracted_value": 400
  }
}
```

#### Response (200 OK) - Invalid Answer
```json
{
  "success": true,
  "message": "Answer recorded successfully",
  "data": {
    "is_valid": false,
    "validation_error": "Please provide a valid number in USD (e.g., 400)",
    "next_question": "What are your monthly rent or office costs?",
    "progress": {
      "current": 1,
      "total": 10,
      "percentage": 10
    }
  }
}
```

#### Response (200 OK) - Onboarding Complete
```json
{
  "success": true,
  "message": "Answer recorded successfully",
  "data": {
    "is_valid": true,
    "onboarding_complete": true,
    "progress": {
      "current": 10,
      "total": 10,
      "percentage": 100
    }
  }
}
```

---

### 3. Get Onboarding Session

Retrieve details of an onboarding session.

```
GET /pricing/onboarding/session/{session_id}
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| session_id | string (UUID) | Yes | Onboarding session ID |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Session retrieved successfully",
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 1,
    "status": "in_progress",
    "current_question": {
      "question_key": "fixed_costs_rent",
      "question_text": "What are your monthly rent or office costs?",
      "expected_type": "number"
    },
    "progress": {
      "current": 3,
      "total": 10,
      "percentage": 30
    },
    "collected_data": {
      "fixed_costs_rent": 400,
      "fixed_costs_equipment": 150
    }
  }
}
```

---

### 4. Calculate Base Rate

Calculate the AUREA base hourly rate using user's profile data.

```
POST /pricing/calculate/base-rate
```

#### Request Body
```json
{
  "user_id": 1,
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| user_id | integer | Yes | User's unique identifier |
| session_id | string (UUID) | No | Completed onboarding session ID |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Base rate calculated successfully",
  "data": {
    "base_hourly_rate": 18.75,
    "breakdown": {
      "fixed_costs_total": 725.00,
      "variable_costs_total": 50.00,
      "desired_income": 1500.00,
      "total_monthly_costs": 2275.00,
      "profit_margin_percentage": 15,
      "profit_amount": 341.25,
      "total_required": 2616.25,
      "billable_hours": 140
    },
    "created_profile": true
  }
}
```

#### Error Responses
| Status | Description |
|--------|-------------|
| 400 | No pricing profile found (complete onboarding first) |
| 400 | Onboarding session not completed |

---

### 5. Calculate Project Rate

Calculate a project-specific hourly rate with client context multipliers.

```
POST /pricing/calculate/project-rate
```

#### Request Body
```json
{
  "user_id": 1,
  "project_id": 5,
  "client_type": "corporate",
  "client_region": "global"
}
```

| Field | Type | Required | Allowed Values |
|-------|------|----------|----------------|
| user_id | integer | Yes | - |
| project_id | integer | No | - |
| client_type | string | Yes | `startup`, `sme`, `corporate`, `ngo`, `government` |
| client_region | string | Yes | `cambodia`, `southeast_asia`, `global` |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Project rate calculated successfully",
  "data": {
    "base_rate": 18.75,
    "seniority_level": "senior",
    "seniority_multiplier": 1.3,
    "client_type": "corporate",
    "client_region": "global",
    "context_multiplier": 1.56,
    "final_hourly_rate": 38.03,
    "monthly_revenue_estimate": 5324.20,
    "annual_revenue_estimate": 63890.40,
    "project_updated": true
  }
}
```

#### Multiplier Reference

**Seniority Multipliers:**
| Level | Multiplier |
|-------|------------|
| junior | 0.8x |
| mid | 1.0x |
| senior | 1.3x |
| expert | 1.5x |

**Client Type Multipliers:**
| Type | Multiplier |
|------|------------|
| startup | 0.9x |
| sme | 1.0x |
| corporate | 1.2x |
| ngo | 0.85x |
| government | 1.1x |

**Region Multipliers:**
| Region | Multiplier |
|--------|------------|
| cambodia | 1.0x |
| southeast_asia | 1.15x |
| global | 1.3x |

---

### 6. Quick Estimate (AI-Powered)

Generate a quick rate estimate using AI research. Ideal for users who don't know their exact costs.

```
POST /pricing/quick-estimate
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| use_grounding | boolean | true | Enable Google Search grounding for real-time web data |

#### Request Body
```json
{
  "user_id": 1,
  "skills": "Logo Design, Branding, Social Media Graphics",
  "experience_level": "intermediate",
  "client_type": "sme",
  "hours_per_week": 30,
  "region": "cambodia"
}
```

| Field | Type | Required | Allowed Values |
|-------|------|----------|----------------|
| user_id | integer | Yes | - |
| skills | string | Yes | Comma-separated list |
| experience_level | string | Yes | `beginner`, `intermediate`, `experienced`, `expert` |
| client_type | string | No | `startup`, `sme`, `corporate`, `ngo`, `government` |
| hours_per_week | integer | Yes | 5-80 |
| region | string | No | Default: `cambodia` |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Quick estimate generated successfully",
  "data": {
    "estimate": {
      "hourly_rate_min": 12.50,
      "hourly_rate_max": 22.00,
      "recommended_rate": 17.50,
      "currency": "USD"
    },
    "user_inputs": {
      "skills": "Logo Design, Branding, Social Media Graphics",
      "experience_level": "intermediate",
      "client_type": "sme",
      "hours_per_week": 30,
      "region": "cambodia"
    },
    "ai_researched_costs": {
      "monthly_software_cost": 45,
      "software_details": "Adobe CC Photography Plan ($9.99/mo), Figma Professional ($15/mo), Canva Pro ($12.99/mo)",
      "monthly_workspace_cost": 120,
      "workspace_details": "Mekong Space co-working ($100/mo) or Factory Phnom Penh ($150/mo hot desk)",
      "monthly_equipment_cost": 85,
      "equipment_details": "MacBook Pro M3 ($1,999) amortized over 36 months + peripherals",
      "monthly_utilities_cost": 45,
      "monthly_internet_cost": 35,
      "total_monthly_expenses": 330
    },
    "ai_researched_income": {
      "suggested_monthly_income": 1200,
      "income_reasoning": "Based on Phnom Penh cost of living ($600-900/mo) plus 30% buffer for freelancer benefits/taxes",
      "billable_hours_ratio": 0.65,
      "estimated_billable_hours": 78
    },
    "market_research": {
      "median_rate": 12.00,
      "percentile_75_rate": 20.00,
      "position": "above_median",
      "market_insights": "Intermediate designers in Cambodia earn $10-25/hr. Branding specialists command premium rates."
    },
    "calculation_breakdown": {
      "total_costs": 330,
      "target_income": 1200,
      "billable_hours": 78,
      "urea_formula_result": 19.62
    },
    "sources": [
      "Factory Phnom Penh (https://factoryphnompenh.com/office-spaces)",
      "Mekong Space (https://mekongspace.com/)",
      "Upwork Cambodia Rates (https://upwork.com/)",
      "Adobe Creative Cloud Pricing (https://adobe.com/)",
      "Numbeo Cost of Living (https://numbeo.com/cost-of-living/in/Phnom-Penh)"
    ],
    "disclaimer": "This estimate is generated by AI based on researched Cambodia market data...",
    "recommendation": "We recommend completing the full AUREA onboarding..."
  }
}
```

#### Comparison: With vs Without Grounding

| Aspect | With Grounding | Without Grounding |
|--------|----------------|-------------------|
| Data Source | Real-time web search | AI knowledge base |
| Response Time | 3-5 seconds | 2-3 seconds |
| Source URLs | ✅ Actual URLs | ❌ Generic labels |
| Accuracy | Current prices | May be outdated |

---

### 7. Get Market Benchmark

Retrieve market rate benchmarks for comparison.

```
GET /pricing/benchmark
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | integer | Yes | User's unique identifier |
| skill_categories | string | No | Comma-separated category IDs (e.g., "1,3,5") |
| seniority_level | string | No | `junior`, `mid`, `senior`, `expert` |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Market benchmarks retrieved successfully",
  "data": {
    "user_rate": 18.75,
    "user_seniority": "mid",
    "benchmarks": [
      {
        "category": "graphic_design",
        "region": "cambodia",
        "seniority_level": "mid",
        "median_hourly_rate": 15.00,
        "percentile_75_rate": 22.00,
        "percentile_90_rate": 35.00,
        "sample_size": 127
      }
    ],
    "position": "above_median",
    "recommendation": "Your rate is competitive for mid-level designers in Cambodia."
  }
}
```

---

### 8. Get Pricing Profile

Retrieve user's saved pricing profile.

```
GET /pricing/profile?user_id={user_id}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Pricing profile retrieved successfully",
  "data": {
    "pricing_profile_id": 1,
    "user_id": 1,
    "fixed_costs": {
      "rent": 400,
      "equipment": 150,
      "insurance": 50,
      "utilities": 75,
      "taxes": 50
    },
    "variable_costs": {
      "materials_per_project": 25,
      "outsourcing_per_project": 0,
      "marketing_per_project": 25
    },
    "desired_monthly_income": 1500,
    "billable_hours_per_month": 140,
    "profit_margin": 0.15,
    "experience_years": 5,
    "seniority_level": "senior",
    "skill_categories": [1, 3, 5],
    "base_hourly_rate": 18.75,
    "created_at": "2026-01-15T10:30:00.000Z",
    "updated_at": "2026-01-28T14:22:00.000Z"
  }
}
```

---

### 9. Update Pricing Profile

Update user's pricing profile for manual adjustments.

```
PUT /pricing/profile?user_id={user_id}
```

#### Request Body
```json
{
  "fixed_costs": {
    "rent": 500,
    "equipment": 175
  },
  "desired_monthly_income": 1800,
  "billable_hours_per_month": 120,
  "profit_margin": 0.20,
  "seniority_level": "senior"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| fixed_costs | object | Non-negative numbers |
| variable_costs | object | Non-negative numbers |
| desired_monthly_income | number | 0-100,000 |
| billable_hours_per_month | integer | 40-200 |
| profit_margin | number | 0.05-0.50 |
| seniority_level | string | `junior`, `mid`, `senior`, `expert` |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Pricing profile updated successfully",
  "data": {
    "pricing_profile_id": 1,
    "user_id": 1,
    "...": "updated profile fields"
  }
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message description",
  "statusCode": 400
}
```

### Common Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Validation Error | Invalid input data |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 502 | Bad Gateway | External service (Gemini) error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| /pricing/quick-estimate | 5 requests/minute |
| /pricing/onboarding/* | 30 requests/minute |
| /pricing/calculate/* | 20 requests/minute |
| /pricing/profile | 30 requests/minute |

---

## AUREA Calculation Formula

```
Base Hourly Rate = (Total Monthly Costs + Desired Income + Profit) / Billable Hours

Where:
- Total Monthly Costs = Fixed Costs + Variable Costs
- Profit = (Total Costs + Desired Income) × Profit Margin
- Billable Hours = Working Hours × Utilization Ratio (typically 60-85%)
```

### Example Calculation

```
Fixed Costs:     $725 (rent + equipment + insurance + utilities + taxes)
Variable Costs:   $50 (materials + marketing)
Desired Income: $1,500
Profit Margin:    15%

Total Costs: $775 + $1,500 = $2,275
Profit: $2,275 × 0.15 = $341.25
Total Required: $2,275 + $341.25 = $2,616.25
Billable Hours: 140

Base Rate: $2,616.25 ÷ 140 = $18.69/hour
```

---

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: AUREA Calculation Engine API
  description: AI-powered pricing calculation for freelance designers
  version: 1.0.0
  contact:
    email: support@aurea-pricing.com

servers:
  - url: http://localhost:3000/api/v1
    description: Development server
  - url: https://api.aurea-pricing.com/api/v1
    description: Production server

tags:
  - name: Onboarding
    description: Pricing onboarding flow endpoints
  - name: Calculation
    description: Rate calculation endpoints
  - name: Profile
    description: User pricing profile management

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
        statusCode:
          type: integer

    Progress:
      type: object
      properties:
        current:
          type: integer
        total:
          type: integer
        percentage:
          type: integer

    FixedCosts:
      type: object
      properties:
        rent:
          type: number
          minimum: 0
        equipment:
          type: number
          minimum: 0
        insurance:
          type: number
          minimum: 0
        utilities:
          type: number
          minimum: 0
        taxes:
          type: number
          minimum: 0

    VariableCosts:
      type: object
      properties:
        materials_per_project:
          type: number
          minimum: 0
        outsourcing_per_project:
          type: number
          minimum: 0
        marketing_per_project:
          type: number
          minimum: 0

    SeniorityLevel:
      type: string
      enum: [junior, mid, senior, expert]

    ClientType:
      type: string
      enum: [startup, sme, corporate, ngo, government]

    ClientRegion:
      type: string
      enum: [cambodia, southeast_asia, global]

    ExperienceLevel:
      type: string
      enum: [beginner, intermediate, experienced, expert]

security:
  - BearerAuth: []

paths:
  /pricing/onboarding/start:
    post:
      tags: [Onboarding]
      summary: Start onboarding session
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [user_id]
              properties:
                user_id:
                  type: integer
      responses:
        '200':
          description: Session started
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      session_id:
                        type: string
                        format: uuid
                      first_question:
                        type: string
                      progress:
                        $ref: '#/components/schemas/Progress'

  /pricing/onboarding/answer:
    post:
      tags: [Onboarding]
      summary: Answer onboarding question
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [session_id, answer]
              properties:
                session_id:
                  type: string
                  format: uuid
                answer:
                  type: string
                  maxLength: 500
      responses:
        '200':
          description: Answer processed

  /pricing/calculate/base-rate:
    post:
      tags: [Calculation]
      summary: Calculate AUREA base rate
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [user_id]
              properties:
                user_id:
                  type: integer
                session_id:
                  type: string
                  format: uuid
      responses:
        '200':
          description: Base rate calculated

  /pricing/calculate/project-rate:
    post:
      tags: [Calculation]
      summary: Calculate project-specific rate
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [user_id, client_type, client_region]
              properties:
                user_id:
                  type: integer
                project_id:
                  type: integer
                client_type:
                  $ref: '#/components/schemas/ClientType'
                client_region:
                  $ref: '#/components/schemas/ClientRegion'
      responses:
        '200':
          description: Project rate calculated

  /pricing/quick-estimate:
    post:
      tags: [Calculation]
      summary: AI-powered quick estimate
      parameters:
        - name: use_grounding
          in: query
          schema:
            type: boolean
            default: true
          description: Enable Google Search grounding
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [user_id, skills, experience_level, hours_per_week]
              properties:
                user_id:
                  type: integer
                skills:
                  type: string
                  description: Comma-separated skills
                experience_level:
                  $ref: '#/components/schemas/ExperienceLevel'
                client_type:
                  $ref: '#/components/schemas/ClientType'
                hours_per_week:
                  type: integer
                  minimum: 5
                  maximum: 80
                region:
                  type: string
                  default: cambodia
      responses:
        '200':
          description: Estimate generated

  /pricing/benchmark:
    get:
      tags: [Profile]
      summary: Get market benchmarks
      parameters:
        - name: user_id
          in: query
          required: true
          schema:
            type: integer
        - name: skill_categories
          in: query
          schema:
            type: string
          description: Comma-separated category IDs
        - name: seniority_level
          in: query
          schema:
            $ref: '#/components/schemas/SeniorityLevel'
      responses:
        '200':
          description: Benchmarks retrieved

  /pricing/profile:
    get:
      tags: [Profile]
      summary: Get pricing profile
      parameters:
        - name: user_id
          in: query
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Profile retrieved
        '404':
          description: Profile not found

    put:
      tags: [Profile]
      summary: Update pricing profile
      parameters:
        - name: user_id
          in: query
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                fixed_costs:
                  $ref: '#/components/schemas/FixedCosts'
                variable_costs:
                  $ref: '#/components/schemas/VariableCosts'
                desired_monthly_income:
                  type: number
                  minimum: 0
                  maximum: 100000
                billable_hours_per_month:
                  type: integer
                  minimum: 40
                  maximum: 200
                profit_margin:
                  type: number
                  minimum: 0.05
                  maximum: 0.50
                seniority_level:
                  $ref: '#/components/schemas/SeniorityLevel'
      responses:
        '200':
          description: Profile updated
        '404':
          description: Profile not found
```

---

**Documentation Version:** 1.0.0  
**Last Updated:** February 1, 2026
