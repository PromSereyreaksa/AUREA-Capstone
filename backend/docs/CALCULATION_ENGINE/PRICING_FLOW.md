# AUREA Pricing Flow — Full End-to-End Documentation

## Overview

This document describes the complete pricing pipeline from base rate calculation through to the final invoice total. It covers the five multiplier layers, the two pricing endpoints, and how the invoice system consumes the computed values.

**Flow:** Base Rate → Seniority → Client Context → Difficulty → Licensing → Invoice

---

## Pricing Formula

```
final_hourly_rate  = base_rate × seniority_multiplier × context_multiplier
project_price      = final_hourly_rate × duration_hours × difficulty_multiplier
total_project_price = project_price × licensing_multiplier
```

- `base_rate` — Calculated via the AUREA framework (Administration + Utility + Rent + Equipment) / billable hours
- `seniority_multiplier` — Reflects experience level
- `context_multiplier` — Combined client type + client region adjustment
- `difficulty_multiplier` — Project complexity scaling
- `licensing_multiplier` — Usage rights pricing

---

## Multiplier Reference Tables

### Seniority

| Level   | Multiplier |
|---------|-----------|
| junior  | 0.8       |
| mid     | 1.0       |
| senior  | 1.3       |
| expert  | 1.5       |

Source: `backend/src/domain/entities/SeniorityLevel.ts`

### Client Type

| Type       | Multiplier |
|-----------|-----------|
| startup   | 0.9       |
| sme       | 1.0       |
| corporate | 1.2       |
| gov       | 1.1       |
| ngo       | 0.85      |

### Client Region

| Region         | Multiplier |
|---------------|-----------|
| cambodia       | 1.0       |
| southeast_asia | 1.15      |
| global         | 1.3       |

Source: `backend/src/domain/entities/ClientContext.ts`

`context_multiplier` = client_type_multiplier × client_region_multiplier

### Difficulty

| Level   | Multiplier |
|---------|-----------|
| easy    | 1.0       |
| medium  | 1.5       |
| hard    | 2.0       |
| complex | 2.5       |

Source: `backend/src/domain/entities/DifficultyLevel.ts`

### Licensing

| Type          | Multiplier |
|--------------|-----------|
| one_time      | 1.0       |
| one_time_use  | 1.0       |
| multi_use     | 1.2       |
| limited       | 1.2       |
| exclusive     | 1.5       |
| buyout        | 2.0       |
| royalty       | 1.3       |

Source: `backend/src/domain/entities/LicensingLevel.ts`

---

## Duration Units

Duration is stored and computed in **hours** everywhere. The frontend inputs hours, the backend stores hours in `project_price.duration`, and multiplications treat it as hours.

> **Note:** A prior version multiplied duration by 8 (treating it as days). This was removed. If you see `* 8` in any code path, it is a bug.

---

## Database Storage

| Column              | Table           | Type    | Description                                         |
|---------------------|-----------------|---------|-----------------------------------------------------|
| `duration`          | `project_price` | INTEGER | Duration in hours                                   |
| `difficulty`        | `project_price` | TEXT    | e.g. "Medium", "Hard"                               |
| `licensing`         | `project_price` | TEXT    | e.g. "One-Time Use", "Multi-Use"                    |
| `calculated_rate`   | `project_price` | DECIMAL | project_price (pre-licensing: rate × hours × diff)  |
| `client_type`       | `project_price` | TEXT    | e.g. "startup", "sme"                               |
| `client_region`     | `project_price` | TEXT    | e.g. "cambodia", "southeast_asia"                   |

`total_project_price` is **not** stored — it is always computed on the fly as `calculated_rate × licensing_multiplier` to stay consistent when multiplier tables change.

---

## API Endpoints

### 1. Calculate Project Rate

**`POST /api/v1/pricing/calculate/project-rate`**

Calculates the final hourly rate and, when `project_id` is provided, also computes the full project total with difficulty and licensing multipliers.

**Request:**
```json
{
  "user_id": 1,
  "project_id": 392,
  "client_type": "startup",
  "client_region": "cambodia"
}
```

**Response (with project_id):**
```json
{
  "success": true,
  "data": {
    "base_rate": 42.9,
    "seniority_level": "mid",
    "seniority_multiplier": 1,
    "client_type": "startup",
    "client_region": "cambodia",
    "context_multiplier": 0.9,
    "final_hourly_rate": 38.61,
    "monthly_revenue_estimate": 3088.8,
    "annual_revenue_estimate": 37065.6,
    "duration_hours": 14,
    "difficulty_multiplier": 1.5,
    "licensing_multiplier": 1,
    "total_project_price": 810.81,
    "project_updated": true
  }
}
```

**Side effect:** Persists `calculated_rate`, `client_type`, `client_region` to `project_price` table.

Use case: `CalculateProjectRate.ts`

---

### 2. Project Pricing Breakdown

**`GET /api/v1/pricing/project-breakdown/:projectId`**

Returns the full pricing breakdown including deliverables. All multipliers are expanded so the frontend can display them individually.

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": 392,
    "base_rate": 42.9,
    "seniority_level": "mid",
    "seniority_multiplier": 1,
    "client_type": "startup",
    "client_region": "cambodia",
    "context_multiplier": 0.9,
    "final_hourly_rate": 38.61,
    "duration_hours": 14,
    "difficulty": "Medium",
    "difficulty_multiplier": 1.5,
    "licensing": "One-Time Use",
    "licensing_multiplier": 1,
    "usage_rights": "Small Business",
    "project_price": 810.81,
    "total_project_price": 810.81,
    "deliverables": [
      {
        "deliverable_type": "Logo",
        "quantity": 2,
        "items": ["Primary Logo", "Icon Logo"]
      }
    ]
  }
}
```

**Side effect:** Same as calculate/project-rate — persists `calculated_rate`.

Use case: `GetProjectPricingBreakdown.ts`

---

### 3. Invoice Detail (GET)

**`GET /api/v1/invoices/:invoiceId`**

Returns invoice metadata + freelancer + project + deliverables. The `project` section now includes multiplier fields:

```json
{
  "project": {
    "project_name": "Tech Start Up Branding",
    "title": "Branding Package",
    "description": "Complete branding for a tech startup",
    "duration": 14,
    "difficulty": "Medium",
    "licensing": "One-Time Use",
    "usage_rights": "Small Business",
    "calculated_rate": 810.81,
    "difficulty_multiplier": 1.5,
    "licensing_multiplier": 1,
    "total_project_price": 810.81
  }
}
```

If `calculated_rate` is not yet set (project never priced), the invoice use case will compute it on-the-fly from the pricing profile.

Use case: `GetInvoice.ts`

---

### 4. Invoice PDF (GET)

**`GET /api/v1/invoices/:invoiceId/pdf`**

Generates a PDF using the same data as the invoice detail endpoint. The PDF service uses the shared `LicensingMultiplier` class and includes licensing as a line item when the multiplier is > 1.

Service: `InvoicePdfService.ts`

---

## Frontend ↔ Backend Consistency

The three frontend panels and their backend data sources:

| Frontend Panel       | Backend Source                       | Key Fields                                |
|---------------------|--------------------------------------|-------------------------------------------|
| Project Summary      | `POST /pdf/create-project`           | project_name, duration, difficulty, licensing, deliverables |
| Pricing Breakdown    | `GET /pricing/project-breakdown/:id` | base_rate, seniority, context, difficulty, licensing multipliers, project_price, total_project_price |
| Invoice              | `GET /invoices/:id`                  | calculated_rate, difficulty_multiplier, licensing_multiplier, total_project_price |

All three should show the **same** `total_project_price` for a given project.

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     Domain Entities (Shared)                       │
├───────────────────────────────────────────────────────────────────┤
│  SeniorityLevel.ts  │  ClientContext.ts  │  DifficultyLevel.ts    │
│  LicensingLevel.ts  │  ProjectPrice.ts   │  Invoice.ts            │
└──────────┬────────────────────┬───────────────────┬───────────────┘
           │                    │                   │
    ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
    │ Calculate   │     │  Breakdown  │     │ Get Invoice │
    │ ProjectRate │     │  Use Case   │     │  Use Case   │
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                   │                    │
           └───────┬───────────┘                    │
                   │                                │
           ┌───────▼──────────┐            ┌────────▼─────────┐
           │ PricingController│            │ InvoiceController │
           └───────┬──────────┘            └────────┬─────────┘
                   │                                │
           ┌───────▼──────────┐            ┌────────▼─────────┐
           │ /pricing/...     │            │ /invoices/...     │
           └──────────────────┘            └──────────────────┘
```

---

## Code Files

| File | Purpose |
|------|---------|
| `domain/entities/DifficultyLevel.ts` | Difficulty enum + multiplier map |
| `domain/entities/LicensingLevel.ts` | Licensing enum + multiplier map |
| `domain/entities/SeniorityLevel.ts` | Seniority enum + multiplier map |
| `domain/entities/ClientContext.ts` | Client type/region enums + combined multiplier |
| `application/use_cases/CalculateProjectRate.ts` | Rate calculation + project update |
| `application/use_cases/GetProjectPricingBreakdown.ts` | Full breakdown with deliverables |
| `application/use_cases/GetInvoice.ts` | Invoice detail with multiplier fields |
| `infrastructure/services/InvoicePdfService.ts` | PDF generation with licensing line item |
| `infrastructure/services/PricingCalculatorService.ts` | Core rate math (base × seniority × context) |
| `interfaces/controllers/PricingController.ts` | HTTP handlers for pricing routes |
| `interfaces/routes/pricingRoutes.ts` | Route definitions + Swagger JSDoc |

---

## Testing

Run the comprehensive test suite (59 tests):

```bash
cd backend
bash src/invoice-api-test.sh
```

**Test sections covering pricing flow:**
- **Section 2B** — `POST /pricing/calculate/project-rate` with project_id: verifies difficulty_multiplier, licensing_multiplier, duration_hours, total_project_price
- **Section 2C** — `GET /pricing/project-breakdown/:projectId`: validates all multiplier fields, checks `difficulty_multiplier=1.5` for Medium, `licensing_multiplier=1.0` for One-Time Use, verifies `total = project_price × licensing`, tests Multi-Use project with `licensing_multiplier=1.2`
- **Section 2D** — Auth check: 401 without token
- **Section 8 (tests 8.7–8.11)** — Invoice detail: verifies difficulty_multiplier, licensing_multiplier, total_project_price, duration in hours, math check `total = calculated_rate × licensing`
- **Section 9** — PDF download saved to `./test-output/` for visual inspection
- **Section 10** — Second invoice PDF with Multi-Use licensing

---

## Related Documentation

- [Calculation Engine API](./CALCULATION_ENGINE_API.md)
- [Pricing Engine Report](./PRICING_ENGINE_REPORT.md)
- [Invoice Generation](../Invoice/INVOICE_GENERATION.md)
