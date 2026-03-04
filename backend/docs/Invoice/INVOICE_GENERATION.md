# FR25: Invoice Generation Backend

## Overview

The Invoice Generation feature allows freelancers to create professional PDF invoices for their projects. The system collects client information (name, email, location), combines it with freelancer profile data and project details, and generates a downloadable PDF invoice.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Invoice Flow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client Request                                                 │
│        │                                                         │
│        ▼                                                         │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│   │  Controller │ ──▶ │  Use Case   │ ──▶ │ Repository  │       │
│   └─────────────┘     └─────────────┘     └─────────────┘       │
│        │                    │                    │               │
│        │                    ▼                    ▼               │
│        │              ┌─────────────┐     ┌─────────────┐       │
│        │              │ PDF Service │     │  Supabase   │       │
│        │              └─────────────┘     └─────────────┘       │
│        │                    │                                    │
│        ▼                    ▼                                    │
│   ┌─────────────────────────────────────┐                       │
│   │           PDF Response               │                       │
│   └─────────────────────────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

The `invoice` table stores invoice records:

```sql
CREATE TABLE invoice (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    project_id INTEGER REFERENCES project_price(project_id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_location TEXT NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id)  -- One invoice per project
);
```

## API Endpoints

### Base URL
- Development: `http://localhost:3000/api/v0/invoices`
- Production: `https://api.aurea.com/api/v1/invoices`

---

### 1. Create Invoice

Creates a new invoice for a project.

**Endpoint:** `POST /invoices`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "project_id": 389,
  "client_name": "Chea Dara",
  "client_email": "cheadara133@gmail.com",
  "client_location": "Phnom Penh, Cambodia",
  "invoice_date": "2026-03-04"  // Optional, defaults to today
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "invoice_id": 11,
    "invoice_number": "INV-20260304-389",
    "project_id": 389,
    "client_name": "Chea Dara",
    "client_email": "cheadara133@gmail.com",
    "client_location": "Phnom Penh, Cambodia",
    "invoice_date": "2026-03-04",
    "created_at": "2026-03-04T11:44:07.471Z",
    "updated_at": "2026-03-04T11:44:07.471Z"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | ValidationError | Missing or invalid fields |
| 401 | Unauthorized | Missing or invalid auth token |
| 404 | NotFoundError | Project not found |
| 409 | ConflictError | Invoice already exists for this project |

---

### 2. List User Invoices

Get all invoices belonging to the authenticated user.

**Endpoint:** `GET /invoices`

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invoices retrieved successfully",
  "data": [
    {
      "invoice_id": 11,
      "invoice_number": "INV-20260304-389",
      "project_id": 389,
      "client_name": "Chea Dara",
      "client_email": "cheadara133@gmail.com",
      "client_location": "Phnom Penh, Cambodia",
      "invoice_date": "2026-03-04T00:00:00.000Z",
      "created_at": "2026-03-04T11:44:07.471Z",
      "updated_at": "2026-03-04T11:44:07.471Z"
    }
  ]
}
```

---

### 3. Get Invoice Detail

Get complete invoice information including freelancer, project, and deliverables.

**Endpoint:** `GET /invoices/:invoiceId`

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invoice retrieved successfully",
  "data": {
    "invoice": {
      "invoice_id": 11,
      "invoice_number": "INV-20260304-389",
      "project_id": 389,
      "client_name": "Chea Dara",
      "client_email": "cheadara133@gmail.com",
      "client_location": "Phnom Penh, Cambodia",
      "invoice_date": "2026-03-04",
      "created_at": "2026-03-04T11:44:07.471Z"
    },
    "freelancer": {
      "full_name": "Prom Sereyreaksa",
      "email": "prom@example.com",
      "location": "Phnom Penh, Cambodia"
    },
    "project": {
      "project_name": "Tech Startup Branding Package",
      "title": "Complete Brand Identity",
      "description": "Full branding suite for a tech startup",
      "duration": 21,
      "difficulty": "Hard",
      "licensing": "Multi-Use",
      "usage_rights": "Corporate",
      "calculated_rate": 1500.00
    },
    "deliverables": [
      {
        "deliverable_type": "Logo Design",
        "quantity": 1,
        "items": []
      },
      {
        "deliverable_type": "Brand Guidelines",
        "quantity": 1,
        "items": []
      }
    ]
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | ValidationError | Invalid invoice ID format |
| 401 | Unauthorized | Missing or invalid auth token |
| 404 | NotFoundError | Invoice not found |

---

### 4. Download Invoice PDF

Generate and download the invoice as a PDF file.

**Endpoint:** `GET /invoices/:invoiceId/pdf`

**Authentication:** Required (Bearer Token)

**Success Response (200):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="INV-20260304-389.pdf"`
- Body: Binary PDF data

**PDF Layout:**

```
┌─────────────────────────────────────────────────────────┐
│ ████████████████  ORANGE HEADER BAR  ████████████████  │
│                                                         │
│  AUREA                              INVOICE             │
│  Logo                               INV-20260304-389    │
│                                     Date: 2026-03-04    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  INVOICE FROM                    INVOICE TO             │
│  ─────────────                   ──────────             │
│  Prom Sereyreaksa               Chea Dara              │
│  prom@example.com               cheadara133@gmail.com  │
│  Phnom Penh, Cambodia           Phnom Penh, Cambodia   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PROJECT DETAILS                                        │
│  ───────────────                                        │
│  Tech Startup Branding Package                         │
│  Duration: 21 days | Difficulty: Hard                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  DELIVERABLES                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ #  │ Item              │ Qty │ Rate   │ Amount │   │
│  ├────┼───────────────────┼─────┼────────┼────────┤   │
│  │ 1  │ Logo Design       │  1  │ $200   │ $200   │   │
│  │ 2  │ Brand Guidelines  │  1  │ $300   │ $300   │   │
│  │ 3  │ Business Card     │  2  │ $50    │ $100   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                          Subtotal:           $600.00   │
│                          Licensing (1.5x):   $300.00   │
│                          ─────────────────────────     │
│                          TOTAL:              $900.00   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 5. Delete Invoice

Delete an invoice. Only the owner can delete their invoices.

**Endpoint:** `DELETE /invoices/:invoiceId`

**Authentication:** Required (Bearer Token)

**Success Response (204):** No Content

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | ValidationError | Invalid invoice ID format |
| 401 | Unauthorized | Missing or invalid auth token |
| 404 | NotFoundError | Invoice not found or not owned by user |

---

## Invoice Number Format

Invoice numbers follow the pattern: `INV-YYYYMMDD-{project_id}`

Example: `INV-20260304-389`

- `INV` - Prefix
- `20260304` - Date (YYYY-MM-DD without dashes)
- `389` - Project ID

---

## Validation Rules

### Create Invoice

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| project_id | integer | Yes | Must be positive integer, project must exist |
| client_name | string | Yes | Non-empty string |
| client_email | string | Yes | Valid email format |
| client_location | string | Yes | Non-empty string |
| invoice_date | string | No | ISO date format (YYYY-MM-DD), defaults to today |

### Invoice ID Parameter

- Must be a positive integer
- Invalid formats return 400 Bad Request

---

## Code Structure

```
backend/src/
├── domain/
│   └── entities/
│       └── Invoice.ts              # Invoice entity definition
├── infrastructure/
│   ├── mappers/
│   │   └── invoiceMapper.ts        # DB ↔ Entity mapping
│   ├── repositories/
│   │   └── InvoiceRepository.ts    # Supabase implementation
│   └── services/
│       └── InvoicePdfService.ts    # PDF generation (pdfkit)
├── application/
│   └── use_cases/
│       ├── CreateInvoice.ts        # Create invoice use case
│       ├── GetInvoice.ts           # Get invoice detail
│       ├── GetUserInvoices.ts      # List user invoices
│       ├── DeleteInvoice.ts        # Delete invoice
│       └── GenerateInvoicePdf.ts   # Generate PDF
├── interfaces/
│   ├── controllers/
│   │   └── InvoiceController.ts    # HTTP handlers
│   └── routes/
│       └── invoiceRoutes.ts        # Route definitions
└── shared/
    └── validators/
        └── InvoiceValidator.ts     # Input validation
```

---

## Usage Examples

### cURL Examples

**Create Invoice:**
```bash
curl -X POST "http://localhost:3000/api/v0/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "project_id": 389,
    "client_name": "Chea Dara",
    "client_email": "cheadara133@gmail.com",
    "client_location": "Phnom Penh, Cambodia"
  }'
```

**List Invoices:**
```bash
curl -X GET "http://localhost:3000/api/v0/invoices" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Invoice Detail:**
```bash
curl -X GET "http://localhost:3000/api/v0/invoices/11" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Download PDF:**
```bash
curl -X GET "http://localhost:3000/api/v0/invoices/11/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o invoice.pdf
```

**Delete Invoice:**
```bash
curl -X DELETE "http://localhost:3000/api/v0/invoices/11" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Dependencies

- **pdfkit** - PDF generation library
- **@types/pdfkit** - TypeScript definitions

Install:
```bash
npm install pdfkit @types/pdfkit
```

---

## Testing

Run the comprehensive test suite:

```bash
cd backend
bash tests/invoice_test/invoice-api-test.sh
```

**Test Coverage:**
- Authentication (401 for unauthenticated requests)
- Validation errors (400 for invalid input)
- Happy path (create, list, get, download PDF, delete)
- Duplicate prevention (409 conflict)
- Not found errors (404)
- Ownership verification

---

## Swagger Documentation

The endpoints are documented in Swagger UI at `/api-docs`.

Schema definitions:
- `Invoice` - Basic invoice fields
- `InvoiceDetail` - Complete invoice with freelancer, project, deliverables

---

## Future Enhancements

1. **Email Integration** - Send invoice PDF to client via email
2. **Payment Status** - Track paid/unpaid status
3. **Invoice Templates** - Multiple PDF templates/themes
4. **Tax Calculations** - Support for VAT/tax fields
5. **Currency Support** - Multi-currency invoicing
6. **Bulk Operations** - Create/download multiple invoices

---

## Related Documentation

- [Authentication](../Authentication/AUTHENTICATION.md)
- [Pricing Engine](../CALCULATION_ENGINE/PRICING_ENGINE_REPORT.md)
- [File Upload](../Storage/FILE_UPLOAD.md)
