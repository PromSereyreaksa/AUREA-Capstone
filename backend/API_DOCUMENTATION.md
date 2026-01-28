# AUREA Capstone API Documentation

**Base URL**: `http://localhost:3000`

> **⚠️ API Versioning**: This API supports versioning. Use `/api/v1` for production endpoints (public access) and `/api/v0` for development/testing (localhost only). See details below.

---

## API Versioning

The AUREA API supports two versions:

- **v1 (Production)** - `/api/v1/*` - Public access, stable endpoints
- **v0 (Development)** - `/api/v0/*` - Localhost only, for testing

**Example URLs:**
- Production: `POST http://localhost:3000/api/v1/users/signup`
- Development: `POST http://localhost:3000/api/v0/users/signup` (localhost only)

**Recommendation**: Use `/api/v1` for all production applications. Use `/api/v0` only for local development and testing.

---

## Table of Contents
1. [Health Check](#health-check)
2. [User Authentication](#user-authentication)
   - [Sign Up](#sign-up)
   - [Verify OTP](#verify-otp)
   - [Resend OTP](#resend-otp)
   - [Get Current User](#get-current-user-protected)
3. [Project Management](#project-management)
   - [Extract Project from PDF](#extract-project-from-pdf)
   - [Create Project Manually](#create-project-manually)
   - [Get User Projects](#get-user-projects)
   - [Get Single Project](#get-single-project)
   - [Update Project](#update-project)
   - [Delete Project](#delete-project)
4. [Error Codes](#error-codes)

---

## Endpoints

### Health Check
```
GET /health
```
Response: `{ "success": true, "status": "ok", "timestamp": "...", "environment": "development" }`

### Test Gemini API
```
GET /api/v1/pdf/test-gemini
```
Response: `{ "success": true, "data": { "message": "Gemini API is working" } }`

---

## User Authentication

### Sign Up
Creates a new user account and sends OTP to email for verification.

```
POST /api/v1/users/signup
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "designer"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "role": "designer",
      "email_verified": false,
      "created_at": "2026-01-27T13:00:00.000Z"
    },
    "otp": "123456"
  }
}
```

**Validation Rules**:
- `email`: Valid email format (required)
- `password`: Minimum 6 characters (required)
- `role`: One of `client`, `designer`, `admin` (required)

**Errors**:
- `400`: Invalid email format, weak password, invalid role
- `409`: Email already registered

**Note**: OTP is returned in response for testing. In production, it's only sent via email.

---

### Verify OTP
Verifies email with OTP code and returns JWT token for authentication.

```
POST /api/v1/users/verify-otp
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "success": true,
    "message": "Email verified successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "role": "designer",
      "email_verified": true
    }
  }
}
```

**Validation Rules**:
- `email`: Valid email format (required)
- `otp`: 6-digit numeric code (required)

**Errors**:
- `400`: Invalid email, invalid OTP format, wrong OTP code, OTP expired
- `404`: User not found

**Note**: JWT token expires in 7 days (configurable via `JWT_EXPIRES_IN` env variable).

---

### Resend OTP
Generates and sends a new OTP to user's email.

```
POST /api/v1/users/resend-otp
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "data": {
    "success": true,
    "message": "New OTP sent to your email",
    "otp": "654321"
  }
}
```

**Response if already verified**:
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "data": {
    "success": false,
    "message": "Email is already verified"
  }
}
```

**Errors**:
- `400`: Invalid email format
- `404`: User not found

---

### Get Current User (Protected)
Returns the authenticated user's profile information.

```
GET /api/v1/users/me
Authorization: Bearer <JWT_TOKEN>
```

**Headers**:
| Key | Value |
|-----|-------|
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "role": "designer",
      "email_verified": true,
      "created_at": "2026-01-27T13:00:00.000Z",
      "last_login_at": null
    }
  }
}
```

**Errors**:
- `401`: No token provided, invalid token, expired token
- `404`: User not found

---

## Project Management

### Extract Project from PDF
Extracts project details from a PDF document using Gemini AI.

```
POST /api/v1/pdf/extract
Content-Type: multipart/form-data
```

**Form Data**:
| Field | Type | Description |
|-------|------|-------------|
| pdf | File | PDF file (max 10MB) |
| user_id | Number | User ID |

**Response** (201):
```json
{
  "success": true,
  "message": "PDF extracted and project created successfully",
  "data": {
    "project": {
      "project_id": 1,
      "user_id": 1,
      "project_name": "Website Redesign",
      "title": "Complete Website Overhaul",
      "description": "...",
      "duration": 8,
      "difficulty": "High",
      "licensing": "Exclusive",
      "usage_rights": "Commercial",
      "result": "..."
    },
    "deliverables": [
      {
        "deliverable_id": 1,
        "project_id": 1,
        "deliverable_type": "UI Design",
        "quantity": 15
      }
    ]
  }
}
```

**Validation**:
- `pdf`: PDF format only, max 10MB
- `user_id`: Valid positive integer

**Errors**:
- `400`: Invalid PDF, missing file, invalid user_id
- `502`: Gemini API error

---

### Create Project Manually
Creates a project with manually provided details.

```
POST /api/v1/pdf/create-project
Content-Type: application/json
```

**Request Body**:
```json
{
  "user_id": 1,
  "project_name": "Logo Design",
  "title": "Brand Logo Creation",
  "description": "Modern minimalist logo design",
  "duration": 2,
  "difficulty": "Medium",
  "licensing": "One-Time Used",
  "usage_rights": "Personal Use",
  "result": "Logo files in various formats",
  "deliverables": [
    {
      "deliverable_type": "Logo Concept",
      "quantity": 3
    },
    {
      "deliverable_type": "Final Logo Files",
      "quantity": 1
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": { ... },
    "deliverables": [ ... ]
  }
}
```

**Validation**:
- `user_id`: Required, positive integer
- `project_name`: Required
- `deliverables`: At least 1 item, quantity >= 1

**Errors**:
- `400`: Missing required fields, invalid deliverables

---

### Get User Projects
Retrieves all projects for a specific user.

```
GET /api/v1/pdf/projects/:userId
```

**Response** (200):
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": [
    {
      "project_id": 1,
      "user_id": 1,
      "project_name": "Website Redesign",
      "title": "Complete Website Overhaul",
      "deliverables": [ ... ]
    }
  ]
}
```

**Errors**:
- `400`: Invalid user ID

---

### Get Single Project
Retrieves a specific project with all its deliverables.

```
GET /api/v1/pdf/projects/:userId/:projectId
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | Number | User ID |
| projectId | Number | Project ID |

**Response** (200):
```json
{
  "success": true,
  "data": {
    "project_id": 1,
    "user_id": 1,
    "project_name": "Website Redesign",
    "title": "Complete Website Overhaul",
    "description": "Full website redesign and modernization",
    "duration": 8,
    "difficulty": "High",
    "licensing": "Exclusive",
    "usage_rights": "Commercial",
    "result": "Production-ready website",
    "deliverables": [
      {
        "deliverable_id": 1,
        "project_id": 1,
        "deliverable_type": "UI Design",
        "quantity": 15
      }
    ]
  }
}
```

**Errors**:
- `400`: Invalid user ID or project ID
- `403`: Access denied (not project owner)
- `404`: Project not found

---

### Update Project
Updates project details. Only the project owner can update.

```
PUT /api/v1/pdf/projects/:userId/:projectId
Content-Type: application/json
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | Number | User ID |
| projectId | Number | Project ID |

**Request Body** (All fields optional):
```json
{
  "title": "Updated Project Title",
  "description": "Updated description",
  "duration": 10,
  "difficulty": "Medium",
  "licensing": "Limited Use",
  "usage_rights": "Business Use",
  "result": "Updated result description",
  "deliverables": [
    {
      "deliverable_type": "Mobile Design",
      "quantity": 5
    }
  ]
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project_id": 1,
    "user_id": 1,
    "project_name": "Website Redesign",
    "title": "Updated Project Title",
    "description": "Updated description",
    "duration": 10,
    "difficulty": "Medium",
    "licensing": "Limited Use",
    "usage_rights": "Business Use",
    "result": "Updated result description",
    "deliverables": [
      {
        "deliverable_id": 2,
        "project_id": 1,
        "deliverable_type": "Mobile Design",
        "quantity": 5
      }
    ]
  }
}
```

**Validation**:
- At least one field must be provided for update
- `duration`: Positive integer if provided
- `quantity`: Positive integer if provided

**Errors**:
- `400`: Invalid input, missing required fields
- `403`: Access denied (not project owner)
- `404`: Project not found

---

### Delete Project
Deletes a project and all associated deliverables. Only the project owner can delete.

```
DELETE /api/v1/pdf/projects/:userId/:projectId
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | Number | User ID |
| projectId | Number | Project ID |

**Response** (200):
```json
{
  "success": true,
  "message": "Project deleted successfully",
  "data": {
    "projectId": 1
  }
}
```

**Errors**:
- `400`: Invalid user ID or project ID
- `403`: Access denied (not project owner)
- `404`: Project not found

---

## Error Codes

| Code | Type | Description |
|------|------|-------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | ValidationError | Invalid input |
| 401 | UnauthorizedError | Auth required |
| 403 | ForbiddenError | Access denied |
| 404 | NotFoundError | Not found |
| 409 | ConflictError | Duplicate resource |
| 429 | RateLimitError | Rate limit exceeded |
| 500 | DatabaseError | Server error |
| 502 | BadGateway | External API error |

---

## Response Formats

**Success Response**:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Authentication Flow

```
1. POST /api/v1/users/signup     → Creates user, sends OTP email
                                 ↓
2. POST /api/v1/users/verify-otp → Verifies OTP, returns JWT token
                                 ↓
3. Use JWT token in headers      → Authorization: Bearer <token>
                                 ↓
4. Access protected routes       → GET /api/v1/users/me
```

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@aurea.com

# Gemini AI
GEMINI_API_KEY_1=your-api-key
```
