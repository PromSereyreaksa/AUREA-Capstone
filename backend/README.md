# AUREA Capstone Backend

A robust, enterprise-grade backend application built with **Clean Architecture**, **TypeScript**, and **Express.js**. This system manages creative projects, pricing, deliverables, and user authentication with PDF extraction capabilities powered by Google Gemini AI.

**Status**: ✅ Production-ready | **Version**: 1.0.0 | **Last Updated**: January 2026

---

## 🏗️ Architecture Overview

This project implements **Clean Architecture** principles, separating concerns across four distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERFACES LAYER                         │
│           (Controllers, Routes, HTTP Handlers)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  APPLICATION LAYER                          │
│              (Use Cases, Business Logic)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    DOMAIN LAYER                             │
│         (Entities, Repository Interfaces)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│               INFRASTRUCTURE LAYER                          │
│    (DB Implementations, External Services)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── domain/                          # Core business logic (framework-independent)
│   │   ├── entities/                    # Business domain entities
│   │   │   ├── BasePrice.ts
│   │   │   ├── Category.ts
│   │   │   ├── Invoice.ts
│   │   │   ├── Portfolio.ts
│   │   │   ├── ProjectDeliverable.ts    # Project deliverables/work items
│   │   │   ├── ProjectPrice.ts          # Project pricing & details
│   │   │   ├── User.ts
│   │   │   ├── UserCategory.ts
│   │   │   └── UserProfile.ts
│   │   │
│   │   └── repositories/                # Repository interface contracts
│   │       ├── IProjectDeliverableRepository.ts
│   │       ├── IProjectPriceRepository.ts
│   │       └── IUserRepository.ts
│   │
│   ├── application/                     # Use cases & business rules orchestration
│   │   └── use_cases/
│   │       ├── CreateProjectManually.ts     # Manual project creation (no PDF)
│   │       ├── ExtractProjectFromPdf.ts     # AI-powered PDF extraction
│   │       └── SignUpUser.ts                # User registration
│   │
│   ├── infrastructure/                  # External frameworks & services
│   │   ├── db/
│   │   │   └── supabaseClient.ts        # Supabase PostgreSQL connection
│   │   │
│   │   ├── repositories/                # Repository implementations
│   │   │   ├── ProjectDeliverableRepository.ts
│   │   │   ├── ProjectPriceRepository.ts
│   │   │   └── UserRepository.ts
│   │   │
│   │   ├── mappers/                     # Database ↔ Entity mapping
│   │   │   ├── basePriceMapper.ts
│   │   │   ├── categoryMapper.ts
│   │   │   ├── invoiceMapper.ts
│   │   │   ├── portfolioMapper.ts
│   │   │   ├── projectDeliverableMapper.ts
│   │   │   ├── projectPriceMapper.ts
│   │   │   ├── userCategoryMapper.ts
│   │   │   ├── userMapper.ts
│   │   │   └── userProfileMapper.ts
│   │   │
│   │   └── services/
│   │       └── GeminiService.ts         # Google Gemini AI API integration
│   │
│   ├── interfaces/                      # Input/output adapters
│   │   ├── controllers/
│   │   │   ├── PdfExtractController.ts  # PDF & manual project endpoints
│   │   │   └── UserController.ts        # User signup endpoint
│   │   │
│   │   └── routes/
│   │       ├── pdfExtractRoutes.ts      # POST /projects/extract, /projects/manual
│   │       ├── testRoutes.ts            # GET /health, /test/gemini
│   │       └── userRoutes.ts            # POST /users/signup
│   │
│   ├── shared/                          # Shared utilities & cross-cutting concerns
│   │   ├── errors/
│   │   │   ├── AppError.ts              # Custom error hierarchy (9 types)
│   │   │   └── index.ts
│   │   │
│   │   ├── validators/
│   │   │   ├── BaseValidator.ts         # Base validation utilities
│   │   │   ├── PdfValidator.ts          # PDF validation logic
│   │   │   ├── ProjectValidator.ts      # Project input validation
│   │   │   ├── UserValidator.ts         # User input validation
│   │   │   └── index.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── asyncHandler.ts          # Express async error wrapper
│   │   │   ├── errorHandler.ts          # Global error handling middleware
│   │   │   ├── requestLogger.ts         # HTTP request logging with timing
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── responseHelper.ts        # Standardized API responses
│   │   │   └── index.ts
│   │   │
│   │   └── constants/
│   │       └── index.ts                 # App-wide constants
│   │
│   └── server.ts                        # Express app initialization
│
├── tests/
│   └── Gemini-api-test.sh               # Gemini API testing script
│
├── .env                                 # Environment variables
├── .env.example                         # Environment template
├── package.json
├── tsconfig.json
└── README.md                            # This file
```

---

## 🚀 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Language** | TypeScript | 5.9.3 |
| **Framework** | Express.js | 5.2.1 |
| **Database** | Supabase/PostgreSQL | Latest |
| **API Client** | Supabase JS Client | Latest |
| **AI Integration** | Google Gemini API | gemini-2.5-flash-lite, gemini-3-flash-preview |
| **File Processing** | Multer | 2.0.2 |
| **Development** | ts-node-dev | 2.0.0 |
| **Port** | 3000 | - |

---

## 📋 Feature Summary

### ✅ Core Features Implemented

1. **User Authentication**
   - User registration with email & password validation
   - Role-based access control (admin, user, artist, client)
   - Secure password requirements (min 8 characters)

2. **Project Management**
   - **PDF-Based Projects**: Upload PDF, extract project details using Gemini AI
   - **Manual Projects**: Create projects without PDF
   - Project pricing & deliverable tracking
   - Portfolio management

3. **AI-Powered PDF Extraction**
   - Automated project information extraction from PDFs
   - Deliverable quantity estimation
   - Full text preservation (no truncation)
   - Multi-key API rotation for rate limit handling

4. **Robust Error Handling**
   - 9 custom error types for different scenarios
   - Centralized error middleware
   - Graceful error responses with proper HTTP status codes

5. **Input Validation**
   - Email format validation
   - Password strength validation
   - PDF file validation (magic number check)
   - Project data sanitization
   - Role validation

6. **API Consistency**
   - Standardized response format across all endpoints
   - Request logging with timing
   - Health check endpoint

---

## 🔧 Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account with PostgreSQL database
- Google Gemini API keys (3 recommended for rate limit rotation)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/PromSereyreaksa/AUREA-Capstone.git
   cd AUREA-Capstone/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:

4. **Initialize the database**
   - Database schema is automatically created by Supabase
  

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:3000`

---

## 📡 API Endpoints

### Health & Testing
```
GET  /health              # Health check
GET  /test/gemini         # Test Gemini API integration
```

## 🔌 API Endpoints

### API Versioning

The API supports two versions:
- **v0**: `http://localhost:3000/api/v0` (🔒 Localhost/development only)
- **v1**: `http://localhost:3000/api/v1` (✅ Public access - recommended)

**For production use, always use v1 endpoints.**

### User Management
```
POST /api/v1/users/signup         # Register new user
POST /api/v1/users/verify-otp     # Verify email with OTP
POST /api/v1/users/resend-otp     # Resend OTP
GET  /api/v1/users/me             # Get current user (protected)
```

### Project Management

#### AI-Powered PDF Extraction
```
POST /api/v1/pdf/extract          # Extract project from PDF
GET  /api/v1/pdf/test-gemini      # Test Gemini API connection
```

**Request:** (multipart/form-data)
- `pdf`: PDF file (required, max 10MB)
- `user_id`: User ID (required)

#### Manual Project Creation
```
POST /api/v1/pdf/create-project   # Create project manually
```

#### Project CRUD Operations
```
GET    /api/v1/pdf/projects/:userId                    # Get all user projects
GET    /api/v1/pdf/projects/:userId/:projectId         # Get single project
PUT    /api/v1/pdf/projects/:userId/:projectId         # Update project
DELETE /api/v1/pdf/projects/:userId/:projectId         # Delete project
```

---

## Request Flow Diagram

```
Client (e.g., React app, Postman)
        |
        v
[Express Route]  (src/interfaces/routes/)
        |
        v
[Controller]     (src/interfaces/controllers/)
        |
        v
[Use Case]       (src/application/use_cases/)
        |
        v
[Repository Interface]   (src/domain/repositories/)
        |
        v
[Repository Implementation] (src/infrastructure/repositories/)
        |
        v
[Database/Supabase]      (src/infrastructure/db/)
```


---

## 🧩 Clean Architecture Benefits in This Project

1. **Testability**: Each layer can be tested independently
2. **Flexibility**: Easy to swap implementations (e.g., different database)
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Easy to add new features following the pattern
5. **Readability**: Clear flow from request to database and back
6. **Reusability**: Validators, error handling, response helpers are centralized

---

## 📖 File-by-File Guide

### Domain Layer
- **Entities**: Pure JavaScript/TypeScript classes representing business concepts
- **Repository Interfaces**: Define what data operations are available

### Application Layer
- **Use Cases**: Orchestrate business logic, use repositories and entities
- **No dependencies**: Only depend on domain layer

### Infrastructure Layer
- **Repositories**: Implement repository interfaces using Supabase
- **Mappers**: Convert between entities and database rows
- **Services**: External APIs (Gemini, etc.)
- **Database Client**: Supabase connection

### Interfaces Layer
- **Controllers**: Handle HTTP requests, validate, call use cases
- **Routes**: Map URLs to controllers
- **Middleware**: Cross-cutting concerns (logging, error handling)

### Shared Layer
- **Errors**: Custom error classes for consistent error handling
- **Validators**: Reusable validation logic
- **Middleware**: Express middleware utilities
- **Utils**: Helper functions (response formatting)
- **Constants**: Application-wide constants

---

This structure is ready for you to start implementing your business logic, use cases, and infrastructure integrations!