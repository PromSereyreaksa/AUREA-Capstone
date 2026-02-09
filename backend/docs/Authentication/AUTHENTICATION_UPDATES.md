# AUREA Backend - User Authentication Updates

## Summary of Changes (February 2026)

This document outlines the recent updates to the AUREA backend authentication system, including user names, password recovery, role removal, and security improvements.

### Key Updates
1. **Role Field Removed** - Completely removed from database and all application code
2. **User Names Added** - first_name and last_name fields for all users
3. **Password Recovery** - Full forgot/reset password flow with email verification
4. **OTP Security** - All OTPs now hashed with bcrypt before storage
5. **Frontend Integration** - Complete password reset flow with ResetPasswordPage component

### Breaking Changes

**1. Role Field Removed**
- The `role` field has been **completely removed** from:
  - Database schema (`users` table)
  - All API requests and responses
  - Domain entities, use cases, controllers
  - Validators, mappers, JWT payload
  - Swagger documentation
- **Action Required:** Remove `role` from all API calls in frontend/clients

**2. Password Reset API Changed**
- **Old:** `POST /api/v1/users/reset-password` with `{ email, token, new_password, confirm_password }`
- **New:** `POST /api/v1/users/reset-password` with `{ token, newPassword }`
- Password matching validation removed (done on frontend)
- User is found by token (no email needed in request)
- **Action Required:** Update frontend to send new format

**3. OTP Column Expanded**
- `verification_otp` column changed from `VARCHAR(10)` to `VARCHAR(255)`
- Now stores bcrypt hashes (60 characters) instead of plain OTPs
- **Action Required:** Run migration 008 before deploying

---

## Security Improvements

### OTP Hashing
- **All OTPs are now hashed using bcrypt** before storing in the database
- OTPs are hashed with salt rounds = 10 (same as passwords)
- Plain OTP is returned in signup/resend responses for testing/development
- OTP verification now uses `bcrypt.compare()` to validate against hashed value
- **Files Modified:**
  - `src/application/use_cases/SignUpUser.ts`
  - `src/application/use_cases/VerifyOTP.ts`
  - `src/application/use_cases/ResendOTP.ts`
  - `src/interfaces/controllers/UserController.ts`

---

## User Names (first_name / last_name)

### Database Changes
**New columns added to `users` table:**
- `first_name` VARCHAR(100) - nullable
- `last_name` VARCHAR(100) - nullable

### API Changes

#### Signup (`POST /api/v1/users/signup`)
**Now requires:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Returns:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "email_verified": false,
      "created_at": "2026-02-09T10:00:00.000Z"
    },
    "otp": "123456"
  }
}
```

#### Sign In (`POST /api/v1/users/signin`)
**Returns user names:**
```json
{
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    ...
  },
  "token": "eyJhbGc..."
}
```

#### Google OAuth (`POST /api/v1/users/google`)
**Accepts name parsing:**
```json
{
  "google_id": "117234567890123456789",
  "email": "john.doe@gmail.com",
  "name": "John Doe",  // Will be split into first_name/last_name
  // OR explicitly:
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Get Current User (`GET /api/v1/users/me`)
**Returns names:**
```json
{
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    ...
  }
}
```

---

## Password Recovery (Forgot Password)

### New Endpoints

#### 1. Request Password Reset
**`POST /api/v1/users/forgot-password`**

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent.",
  "data": {
    "success": true,
    "message": "If an account with that email exists, a password reset link has been sent."
  }
}
```

**Security Features:**
- Always returns success (prevents email enumeration)
- Token is hashed with SHA-256 before storing
- Token expires after 1 hour
- Email contains link: `{FRONTEND_URL}/reset-password?token=xxx&email=yyy`
- Checks if account is Google-only (no password set)

#### 2. Reset Password
**`POST /api/v1/users/reset-password`**

**Request:**
```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "newSecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now sign in with your new password.",
  "data": {
    "success": true,
    "message": "Password has been reset successfully. You can now sign in with your new password."
  }
}
```

**Validation:**
- Token must match stored hash (finds user by token)
- Token must not be expired (1 hour validity)
- New password must be at least 6 characters
- Clears reset token after successful reset

---

## Testing

### Updated Test Scripts

1. **`tests/user_auth_test/User-api-test.sh`**
   - Includes first_name/last_name in signup
   - Tests OTP verification with hashed OTPs (bcrypt)
   - Validates names are returned in responses
   - Role field has been removed

2. **`tests/user_auth_test/password-recovery-test.sh`** (NEW)
   - Tests signup with names (no role field)
   - Tests forgot-password endpoint
   - Tests reset-password with token validation
   - Tests security features (email enumeration prevention)

### Run Tests
```bash
# Basic auth test with names and OTP hashing
cd backend/tests/user_auth_test
./User-api-test.sh

# Password recovery flow test
./password-recovery-test.sh
```

---

## Environment Variables

### Required
Add to your `.env` file:

```env
# Email Configuration (for OTP and password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@aurea.com

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Database (Supabase)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

---

## Code Architecture

### New Use Cases
- **`ForgotPassword.ts`** - Generates reset token, sends email
- **`ResetPassword.ts`** - Validates token, updates password

### Updated Use Cases
- **`SignUpUser.ts`** - Accepts first_name/last_name, hashes OTP
- **`SignInUser.ts`** - Returns first_name/last_name
- **`SignUpWithGoogle.ts`** - Parses Google name into first_name/last_name
- **`VerifyOTP.ts`** - Compares hashed OTP
- **`ResendOTP.ts`** - Hashes new OTP

### Updated Repository
**`IUserRepository.ts`** - New methods:
- `updatePassword(user_id, hashedPassword)`
- `updatePasswordResetToken(user_id, token, expiration)`
- `clearPasswordResetToken(user_id)`
- `findByResetToken(token)`

### Updated Validators
**`UserValidator.ts`** - New methods:
- `validateFirstName(firstName)`
- `validateLastName(lastName)`
- `validateResetToken(token)`
- `validateNewPassword(password)`
- `validateConfirmPassword(password, confirmPassword)`

---

## Security Considerations

### OTP Security
 **Implemented:**
- OTPs are hashed using bcrypt (10 salt rounds)
- OTPs expire after 15 minutes
- Plain OTP only returned in API response (for testing)

### Password Reset Security
 **Implemented:**
- Reset tokens are 64 random hex characters (crypto.randomBytes)
- Tokens are hashed with SHA-256 before storage
- Tokens expire after 1 hour
- Generic success messages prevent email enumeration
- Tokens are cleared after successful reset or expiration
- Validates password match and minimum length

### Production Recommendations
 **For production:**
1. Consider removing plain OTP from API responses
2. Implement rate limiting on forgot-password endpoint
3. Add email notification when password is changed
4. Consider CAPTCHA on forgot-password to prevent abuse
5. Log all password reset attempts for security monitoring

---

## Swagger Documentation

All endpoints are documented in:
- `src/swagger/paths/auth.yaml` - Auth endpoints with new fields
- `src/swagger/paths/users.yaml` - User endpoints with names
- `src/config/swagger.ts` - Schema definitions

Access Swagger UI at: `http://localhost:3000/api/v0/docs`

---

## Checklist

### Backend
- [x] Database migrations created and applied (006, 007, 008)
- [x] OTP hashing implemented (bcrypt with 10 salt rounds)
- [x] User names (first_name/last_name) added to all endpoints
- [x] Password recovery flow implemented (ForgotPassword + ResetPassword use cases)
- [x] Email service configured for OTP and password reset
- [x] Validators updated (removed role validation, added name validation)
- [x] Test scripts updated (removed role from all tests)
- [x] Swagger documentation updated (auth.yaml, users.yaml, swagger.ts)
- [x] TypeScript compilation verified (no errors)
- [x] Role field completely removed from codebase
- [x] Password reset accepts token + newPassword (simplified)

### Frontend
- [x] ResetPasswordPage component created
- [x] AuthService updated with confirmPasswordReset method
- [x] AuthContext updated with confirmPasswordReset
- [x] Route added: /reset-password
- [x] MockAuthService updated for testing
- [ ] Signup form updated to include first_name/last_name
- [ ] Role field removed from signup form
- [ ] Login/profile UI updated to display names
- [ ] Password recovery flow fully tested end-to-end

---

## Known Issues / Future Improvements

1. **Email Delivery**: Requires valid SMTP credentials configured
2. **Testing**: Full password reset flow requires checking real email
3. **Rate Limiting**: Consider adding rate limits to prevent abuse
4. **Localization**: Error messages are currently English-only

---

## Support

For questions or issues:
- Check Swagger docs at `/api/v0/docs`
- Review test scripts in `tests/user_auth_test/`
- Contact the backend development team

---

**Last Updated:** February 9, 2026  
**Version:** 2.0.0  
**Major Changes:** Role removal, password reset API update, OTP hashing  

---

## Detailed Change Log

### Version 2.0.0 (February 9, 2026)

#### Breaking Changes
- Removed `role` field from entire codebase
- Changed password reset API from `{ email, token, new_password, confirm_password }` to `{ token, newPassword }`
- Expanded `verification_otp` column from VARCHAR(10) to VARCHAR(255)

#### Features Added
- Password recovery flow (forgot-password + reset-password endpoints)
- User names support (first_name, last_name)
- OTP bcrypt hashing for security
- Frontend ResetPasswordPage component
- Email service for OTP and password reset

#### Database Changes
- Migration 006: Added first_name, last_name columns
- Migration 007: Added password_reset_token, password_reset_expires columns
- Migration 008: Expanded verification_otp to VARCHAR(255)
- Removed role column (manual migration required)

#### Files Modified
**Backend:**
- `src/domain/entities/User.ts` - Removed role
- `src/infrastructure/services/JwtService.ts` - Removed role from JWT payload
- `src/infrastructure/mappers/userMapper.ts` - Removed role mapping
- `src/shared/validators/UserValidator.ts` - Removed validateRole, added name validators
- `src/application/use_cases/SignUpUser.ts` - Removed role, added OTP hashing
- `src/application/use_cases/SignInUser.ts` - Removed role from response
- `src/application/use_cases/VerifyOTP.ts` - Added bcrypt.compare for OTP
- `src/application/use_cases/SignUpWithGoogle.ts` - Removed role, added name parsing
- `src/application/use_cases/ForgotPassword.ts` - **NEW**
- `src/application/use_cases/ResetPassword.ts` - **NEW** (updated to use token-only lookup)
- `src/interfaces/controllers/UserController.ts` - Removed role, updated resetPasswordController
- `src/config/swagger.ts` - Removed role from User schema
- `src/swagger/paths/auth.yaml` - Removed role, updated reset-password parameters
- `src/swagger/paths/users.yaml` - Removed role from examples
- `tests/user_auth_test/User-api-test.sh` - Removed role
- `tests/user_auth_test/password-recovery-test.sh` - **NEW**, removed role

**Frontend:**
- `src/features/auth/components/ResetPasswordPage.tsx` - **NEW**
- `src/features/auth/services/AuthService.ts` - Fixed resetPassword endpoint, added confirmPasswordReset
- `src/features/auth/services/IAuthService.ts` - Added confirmPasswordReset interface
- `src/features/auth/services/MockAuthService.ts` - Added confirmPasswordReset mock
- `src/features/auth/context/AuthContext.tsx` - Added confirmPasswordReset method
- `src/features/auth/index.ts` - Exported ResetPasswordPage
- `src/App.tsx` - Added /reset-password route

---