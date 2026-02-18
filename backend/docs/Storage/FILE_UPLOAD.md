# File Upload & Storage Documentation

## Overview

AUREA uses Supabase Storage for file uploads. This document covers all storage-related features including profile avatars and portfolio PDFs.

## Storage Buckets

| Bucket | Type | Purpose |
|--------|------|---------|
| `avatars` | Public | Profile avatar images |
| `user_portfolio` | Public | Portfolio PDF files |
| `project_pdf` | Private | Extracted project PDFs |

---

## Profile Avatar Upload

### Endpoint
```
POST /api/v1/profile/avatar
```

### Authentication
Requires JWT Bearer token.

### Request
- **Content-Type**: `multipart/form-data`
- **Field Name**: `avatar`
- **Allowed Types**: JPEG, PNG, WebP
- **Max Size**: 10MB

### Example (cURL)
```bash
curl -X POST "http://localhost:3000/api/v1/profile/avatar" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

### Response
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "message": "Avatar uploaded successfully",
    "profile_avatar": "https://xxx.supabase.co/storage/v1/object/public/avatars/80/abc123.jpg",
    "profile": {
      "profile_id": 1,
      "user_id": 80,
      "first_name": "John",
      "last_name": "Doe",
      "bio": "Designer",
      "profile_avatar": "https://xxx.supabase.co/storage/v1/object/public/avatars/80/abc123.jpg"
    }
  }
}
```

### Delete Avatar
```
DELETE /api/v1/profile/avatar
```

---

## Portfolio PDF Upload

### Endpoint
```
POST /api/v1/portfolio/pdf
```

### Authentication
Requires JWT Bearer token.

### Request
- **Content-Type**: `multipart/form-data`
- **Field Name**: `pdf`
- **Allowed Types**: PDF only
- **Max Size**: 10MB

### Example (cURL)
```bash
curl -X POST "http://localhost:3000/api/v1/portfolio/pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "pdf=@/path/to/portfolio.pdf"
```

### Response
```json
{
  "success": true,
  "message": "Portfolio PDF uploaded successfully",
  "data": {
    "message": "Portfolio PDF uploaded successfully",
    "portfolio_id": 1,
    "user_id": 80,
    "portfolio_url": "https://xxx.supabase.co/storage/v1/object/public/user_portfolio/80/abc123.pdf",
    "is_public": false
  }
}
```

### Get Portfolio
```
GET /api/v1/portfolio
```

### Update Portfolio Settings
```
PUT /api/v1/portfolio
```

**Request Body:**
```json
{
  "is_public": true
}
```

### Delete Portfolio PDF
```
DELETE /api/v1/portfolio/pdf
```

---

## API Endpoints Summary

### Profile Avatar
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/profile/avatar` | Upload profile avatar |
| DELETE | `/api/v1/profile/avatar` | Delete profile avatar |

### Portfolio
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/portfolio` | Get user's portfolio |
| PUT | `/api/v1/portfolio` | Update portfolio settings |
| POST | `/api/v1/portfolio/pdf` | Upload portfolio PDF |
| DELETE | `/api/v1/portfolio/pdf` | Delete portfolio PDF |

---

## Supabase Storage Setup

### 1. Create Buckets
In Supabase Dashboard → Storage:
- Create `avatars` bucket (Public)
- Create `user_portfolio` bucket (Public)
- Create `project_pdf` bucket (Private)

### 2. RLS Policies (Using anon key)

#### For Public Buckets (avatars, user_portfolio)
```sql
-- Allow uploads
CREATE POLICY "Allow backend uploads" 
ON storage.objects FOR INSERT 
TO anon 
WITH CHECK (bucket_id = 'avatars');

-- Allow reads
CREATE POLICY "Allow public reads" 
ON storage.objects FOR SELECT 
TO anon 
USING (bucket_id = 'avatars');

-- Allow deletes
CREATE POLICY "Allow backend deletes" 
ON storage.objects FOR DELETE 
TO anon 
USING (bucket_id = 'avatars');
```

Repeat for `user_portfolio` bucket.

#### For Private Buckets (project_pdf)
```sql
CREATE POLICY "Allow backend uploads" 
ON storage.objects FOR INSERT 
TO anon 
WITH CHECK (bucket_id = 'project_pdf');

CREATE POLICY "Allow backend reads" 
ON storage.objects FOR SELECT 
TO anon 
USING (bucket_id = 'project_pdf');

CREATE POLICY "Allow backend deletes" 
ON storage.objects FOR DELETE 
TO anon 
USING (bucket_id = 'project_pdf');
```

---

## File Storage Structure

```
avatars/
└── {user_id}/
    └── {uuid}.{ext}        # e.g., 80/abc123.jpg

user_portfolio/
└── {user_id}/
    └── {uuid}.pdf          # e.g., 80/def456.pdf

project_pdf/
└── {user_id}/
    └── {project_id}/
        └── {uuid}.pdf      # e.g., 80/123/ghi789.pdf
```

---

## Error Handling

### Common Errors

| Error | Status | Description |
|-------|--------|-------------|
| No file provided | 400 | Request missing file |
| File size exceeds limit | 400 | File larger than 10MB |
| Invalid file type | 400 | File type not allowed |
| Unauthorized | 401 | Missing or invalid JWT |
| Upload failed | 500 | Supabase storage error |

### Example Error Response
```json
{
  "success": false,
  "error": {
    "message": "Only JPEG, PNG, and WebP images are allowed"
  }
}
```
