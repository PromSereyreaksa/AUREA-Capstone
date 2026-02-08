# Authentication Documentation

## Overview

AUREA supports two authentication methods:
1. **Email/Password Authentication** - Traditional signup with email verification via OTP
2. **Google OAuth 2.0** - Sign up/sign in using Google account (implemented)

---

## Authentication Methods

### 1. Email/Password Authentication

Users can sign up using email and password. Email verification is required via OTP (One-Time Password) sent to their email.

#### Endpoints

**Sign Up**
- **POST** `/api/users/signup`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "role": "designer"
  }
  ```
- **Response**:
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
        "created_at": "2026-02-03T..."
      },
      "otp": "123456"
    }
  }
  ```

**Verify OTP**
- **POST** `/api/users/verify-otp`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "OTP verified successfully",
    "data": {
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

**Resend OTP**
- **POST** `/api/users/resend-otp`
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

---

### 2. Google OAuth Authentication

Users can sign up or sign in using their Google account. Email is automatically verified.

#### Setup Requirements

**Google Cloud Console:**
1. Create OAuth 2.0 credentials
2. Add authorized origins: `http://localhost:5173`, `https://your-supabase-project.supabase.co`
3. Add redirect URI: `https://your-supabase-project.supabase.co/auth/v1/callback`

**Supabase:**
1. Enable Google provider in Authentication → Providers
2. Add Google Client ID and Client Secret

#### Flow

```
User clicks "Sign in with Google"
    ↓
Frontend: supabase.auth.signInWithOAuth({ provider: 'google' })
    ↓
User redirected to Google login
    ↓
User authenticates and grants permission
    ↓
Google redirects to: /auth/callback
    ↓
Frontend: AuthCallbackPage calls handleGoogleCallback()
    ↓
Backend: POST /api/users/google with user data
    ↓
Backend: Creates/updates user, returns JWT token
    ↓
Frontend: Stores token, redirects to dashboard
```

#### Backend Endpoint

**Google OAuth**
- **POST** `/api/users/google`
- **Body**:
  ```json
  {
    "google_id": "1234567890",
    "email": "user@gmail.com",
    "name": "John Doe",
    "avatar_url": "https://...",
    "role": "designer"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Google authentication successful",
    "data": {
      "user": {
        "user_id": 1,
        "email": "user@gmail.com",
        "role": "designer",
        "email_verified": true,
        "auth_provider": "google",
        "created_at": "2026-02-03T...",
        "last_login_at": "2026-02-03T..."
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### Features

✅ **New User Creation**: First-time Google users are automatically created with `email_verified: true`

✅ **Returning User Login**: Existing Google users are logged in and `last_login_at` is updated

✅ **Account Linking**: If a user signed up with email/password and later uses Google with the same email, their accounts are automatically linked

✅ **Auto-verified Email**: Google emails are trusted, so `email_verified` is always `true`

---

## Sign In (TODO - Not Yet Implemented)

Regular email/password sign in endpoint is planned but not yet implemented.

**Planned Endpoint:**
- **POST** `/api/users/signin`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```

---

## Protected Routes

All protected routes require a JWT token in the Authorization header.

**Get Current User**
- **GET** `/api/users/me`
- **Headers**:
  ```
  Authorization: Bearer <jwt_token>
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "user_id": 1,
        "email": "user@example.com",
        "role": "designer",
        "email_verified": true,
        "auth_provider": "google",
        "created_at": "2026-02-03T...",
        "last_login_at": "2026-02-03T..."
      }
    }
  }
  ```

---

## JWT Token

- **Algorithm**: HS256
- **Expiration**: 7 days (default)
- **Payload**:
  ```json
  {
    "user_id": 1,
    "email": "user@example.com",
    "role": "designer",
    "iat": 1234567890,
    "exp": 1234567890
  }
  ```

---

## Testing

Run the test scripts:

```bash
# Test email/password authentication
./backend/tests/user_auth_test/User-api-test.sh

# Test Google OAuth
./backend/tests/user_auth_test/google-oauth-test.sh
```

---

## Environment Variables

**Backend (.env):**
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@aurea.com
```

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:3000/api
```

---

## Database Schema

**users table:**
```sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_otp VARCHAR(6),
  verify_otp_expired TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  auth_provider VARCHAR(20) DEFAULT 'email'
);
```

---

## Security Notes

1. **Passwords**: Hashed using bcrypt with 10 salt rounds
2. **OTP**: 6-digit random number, expires in 15 minutes
3. **JWT**: Signed with HS256, expires in 7 days
4. **Google OAuth**: Email is automatically verified, no password required
5. **Account Linking**: Automatically links Google account to existing email users

---

## Error Handling

Common errors:
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid or expired token
- `404 Not Found`: User not found
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Database or server error
