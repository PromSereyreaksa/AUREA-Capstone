# AUREA Capstone API Documentation

**Base URL**: `http://localhost:3000`

---

## Endpoints

### Health Check
```
GET /health
```
Response: `{ "success": true, "status": "ok", "timestamp": "...", "environment": "development" }`

### Test Gemini API
```
GET /test/gemini
```
Response: `{ "success": true, "data": { "message": "Gemini API is working" } }`

---

## User Management

### Sign Up
```
POST /api/users/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "artist"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "role": "artist"
    }
  },
  "message": "User created successfully"
}
```

**Validation Rules**:
- `email`: Valid email format
- `password`: Min 8 characters
- `role`: One of `admin`, `user`, `artist`, `client`

**Errors**:
- `400`: Invalid email, weak password, invalid role
- `409`: Email already exists

---

## Project Management

### Extract Project from PDF
```
POST /api/projects/extract
Content-Type: multipart/form-data

Form Data:
- file: <PDF file>
- user_id: 1
```

**Response** (201):
```json
{
  "success": true,
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
  },
  "message": "Project created successfully"
}
```

**Validation**:
- `file`: PDF format (10MB max)
- `user_id`: Valid user ID

**Errors**:
- `400`: Invalid PDF, invalid user_id
- `502`: Gemini API error

---

### Create Project Manually
```
POST /api/projects/manual
Content-Type: application/json

{
  "user_id": 1,
  "project_name": "Logo Design",
  "title": "Brand Logo Creation",
  "description": "Modern logo",
  "duration": 2,
  "difficulty": "Medium",
  "licensing": "Exclusive",
  "usage_rights": "Commercial",
  "result": "Logo files",
  "deliverables": [
    {
      "deliverable_type": "Logo Concept",
      "quantity": 3
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "project": { ... },
    "deliverables": [ ... ]
  },
  "message": "Project created successfully"
}
```

**Validation**:
- `project_name`, `title`: Required
- `deliverables`: At least 1, quantity >= 1

**Errors**:
- `400`: Missing required fields, invalid deliverables

---

### Get User Projects
```
GET /api/projects/user/:userId
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "project_id": 1,
      "user_id": 1,
      "project_name": "Website Redesign",
      "title": "Complete Website Overhaul",
      "deliverables": [ ... ]
    }
  ],
  "message": "Projects retrieved successfully"
}
```

**Errors**:
- `400`: Invalid user ID
- `404`: User not found

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

**Success Response**:
```json
{
  "success": true,
  "data": { },
  "message": "...",
  "statusCode": 200
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "...",
  "statusCode": 400
}
```
