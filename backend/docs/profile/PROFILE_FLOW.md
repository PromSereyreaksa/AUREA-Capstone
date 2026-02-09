# Profile Feature Flow Documentation

## Overview
This document describes the complete flow of the profile feature, including user interactions, backend processing, and database operations.

---

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐      ┌──────────┐
│   Frontend  │─────▶│   Express    │─────▶│   Use Cases     │─────▶│ Database │
│   (React)   │◀─────│  Controller  │◀─────│  (Business      │◀─────│(Supabase)│
└─────────────┘      └──────────────┘      │   Logic)        │      └──────────┘
                              │             └─────────────────┘
                              │                      │
                              ▼                      ▼
                      ┌──────────────┐      ┌─────────────────┐
                      │    Auth      │      │  Repository     │
                      │  Middleware  │      │  (Data Access)  │
                      └──────────────┘      └─────────────────┘
```

### Components
1. **Frontend (React)**: User interface for profile management
2. **Routes**: Express route definitions
3. **Controllers**: Handle HTTP requests/responses
4. **Middleware**: Authentication and authorization
5. **Use Cases**: Business logic and validation
6. **Repositories**: Database operations
7. **Entities**: Domain models
8. **Mappers**: Transform data between layers

---

## Data Flow Layers

### 1. Frontend Layer
**Location**: `frontend/src/features/profile/`

**Components**:
- `DesignerProfilePage.tsx` - Main profile display and editing
- `profile.css` - Styling

**Responsibilities**:
- Render profile UI
- Handle user input
- Make API calls
- Display loading/error states

### 2. Routes Layer
**Location**: `backend/src/interfaces/routes/profileRoutes.ts`

```typescript
profileRouter.post('/', authMiddleware, createProfileController);
profileRouter.get('/', authMiddleware, getProfileController);
profileRouter.get('/:userId', getUserProfileByIdController);
profileRouter.put('/', authMiddleware, updateProfileController);
profileRouter.delete('/', authMiddleware, deleteProfileController);
```

### 3. Controller Layer
**Location**: `backend/src/interfaces/controllers/ProfileController.ts`

**Responsibilities**:
- Validate request format
- Extract user info from JWT
- Call appropriate use case
- Format response
- Handle errors

### 4. Use Case Layer
**Location**: `backend/src/application/use_cases/`

**Use Cases**:
- `CreateUserProfile.ts` - Create new profile
- `GetUserProfile.ts` - Retrieve profile
- `UpdateUserProfile.ts` - Update profile
- `DeleteUserProfile.ts` - Delete profile

**Responsibilities**:
- Business logic validation
- Orchestrate operations
- Call repository methods
- Handle business rules

### 5. Repository Layer
**Location**: `backend/src/infrastructure/repositories/UserProfileRepository.ts`

**Methods**:
- `create(profile)` - Insert new profile
- `findByUserId(userId)` - Query profile
- `update(userId, data)` - Update profile
- `delete(userId)` - Delete profile

**Responsibilities**:
- Database operations
- Query execution
- Data mapping
- Error handling

### 6. Entity Layer
**Location**: `backend/src/domain/entities/UserProfile.ts`

**Entity Definition**:
```typescript
class UserProfile {
  profile_id: number;
  user_id: number;
  bio?: string;
  skills?: string;
  location?: string;
  profile_avatar?: string;
  experience_years?: number;
  seniority_level?: string;
  social_links?: object;
  updated_at: Date;
}
```

---

## Complete User Flows

### Flow 1: Create Profile

```
┌────────────┐
│  User      │
│  Signs Up  │
└─────┬──────┘
      │
      ▼
┌────────────────────────────┐
│  User navigates to         │
│  profile page              │
└─────┬──────────────────────┘
      │
      ▼
┌────────────────────────────┐
│  Frontend: Click Edit      │
│  Fill in profile fields    │
│  - Bio                     │
│  - Skills                  │
│  - Location                │
│  - Experience              │
│  - Social Links            │
└─────┬──────────────────────┘
      │
      ▼
┌────────────────────────────┐
│  Frontend: POST            │
│  /api/v1/profile           │
│  with profile data         │
└─────┬──────────────────────┘
      │
      ▼
┌────────────────────────────┐
│  authMiddleware:           │
│  - Verify JWT token        │
│  - Extract user_id         │
│  - Attach to req.user      │
└─────┬──────────────────────┘
      │
      ▼
┌────────────────────────────┐
│  Controller:               │
│  - Validate request        │
│  - Create use case         │
│  - Pass data               │
└─────┬──────────────────────┘
      │
      ▼
┌────────────────────────────┐
│  CreateUserProfile:        │
│  - Validate business rules │
│  - Create UserProfile      │
│    entity                  │
└─────┬──────────────────────┘
      │
      ▼
┌────────────────────────────┐
│  Repository:               │
│  - Check if exists         │
│  - Map to DB format        │
│  - Insert into             │
│    user_profile table      │
└─────┬──────────────────────┘
      │
      ▼
┌────────────────────────────┐
│  Fetch user data from      │
│  users table (name, email) │
└─────┬──────────────────────┘
      │
      ▼
┌────────────────────────────┐
│  Merge profile + user data │
└─────┬──────────────────────┘
      │
      ▼
┌────────────────────────────┐
│  Return 201 Created        │
│  with complete profile     │
└─────┬──────────────────────┘
      │
      ▼
┌────────────────────────────┐
│  Frontend: Display         │
│  success message           │
│  Show updated profile      │
└────────────────────────────┘
```

### Flow 2: View Own Profile

```
User logs in
    ↓
Navigate to profile page
    ↓
Frontend: GET /api/v1/profile
    ↓
authMiddleware: Verify JWT, extract user_id
    ↓
Controller: Call GetUserProfile use case
    ↓
Use Case: Validate user_id
    ↓
Repository: Query user_profile table by user_id
    ↓
Repository: Fetch user data from users table
    ↓
Merge profile + user data
    ↓
Return 200 OK with profile
    ↓
Frontend: Display profile
```

### Flow 3: View Public Profile

```
User clicks profile link (e.g., /profile/123)
    ↓
Frontend: GET /api/v1/profile/123
    ↓
Controller: No auth check (public endpoint)
    ↓
Use Case: Validate userId exists
    ↓
Repository: Query profile by user_id
    ↓
Repository: Fetch user data
    ↓
Merge and return profile
    ↓
Frontend: Display public profile
```

### Flow 4: Update Profile

```
User edits profile fields
    ↓
Click Save
    ↓
Frontend: PUT /api/v1/profile
    ↓
authMiddleware: Verify JWT
    ↓
Controller: Extract changed fields
    ↓
UpdateUserProfile use case:
    ├─ If first_name/last_name changed
    │   └─ Update users table
    │
    └─ If profile fields changed
        └─ Update user_profile table
            (or create if doesn't exist)
    ↓
Repository: Execute update queries
    ↓
Fetch updated profile + user data
    ↓
Return 200 OK with updated profile
    ↓
Frontend: Show success, refresh display
```

### Flow 5: Delete Profile

```
User clicks Delete Profile
    ↓
Frontend confirmation dialog
    ↓
User confirms
    ↓
Frontend: DELETE /api/v1/profile
    ↓
authMiddleware: Verify JWT
    ↓
Controller: Call DeleteUserProfile
    ↓
Use Case: Validate profile exists
    ↓
Repository: Delete from user_profile table
    (Users table record remains intact)
    ↓
Return 200 OK
    ↓
Frontend: Redirect to home or show empty state
```

---

## Database Operations Detail

### Create Profile Operation
```sql
-- 1. Check if profile exists
SELECT profile_id FROM user_profile WHERE user_id = ?;

-- 2. If not exists, insert
INSERT INTO user_profile (
  user_id, bio, skills, location, 
  profile_avatar, experience_years, 
  seniority_level, social_links, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW());

-- 3. Fetch user data
SELECT first_name, last_name, email 
FROM users WHERE user_id = ?;

-- 4. Return merged data
```

### Update Profile Operation
```sql
-- 1. Update users table if name changed
UPDATE users 
SET first_name = ?, last_name = ? 
WHERE user_id = ?;

-- 2. Upsert profile data
INSERT INTO user_profile (user_id, bio, skills, ...)
VALUES (?, ?, ?, ...)
ON CONFLICT (user_id) 
DO UPDATE SET 
  bio = EXCLUDED.bio,
  skills = EXCLUDED.skills,
  updated_at = NOW();

-- 3. Fetch and merge
SELECT * FROM user_profile WHERE user_id = ?;
SELECT first_name, last_name, email FROM users WHERE user_id = ?;
```

---

## State Management

### Frontend State
```typescript
const [profile, setProfile] = useState<UserProfile | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [editedProfile, setEditedProfile] = useState<UserProfile>({});
const [isLoading, setIsLoading] = useState(true);
```

### State Transitions
```
Initial Load → Loading → Loaded/Error
    ↓
Loaded → Editing → Saving → Updated/Error
    ↓
Updated → Loaded (with new data)
```

---

## Error Handling Flow

### Frontend Error Handling
```
API Error
    ↓
Catch in try-catch
    ↓
Display error message
    ↓
Log to console
    ↓
Maintain previous state (don't clear form)
```

### Backend Error Handling
```
Error occurs
    ↓
Caught by try-catch in use case/repository
    ↓
Logged to console
    ↓
Wrapped in appropriate error class
    (ValidationError, DatabaseError, etc.)
    ↓
Caught by error handler middleware
    ↓
Formatted to standard error response
    ↓
Returned to client with appropriate status code
```

---

## Security Considerations

1. **Authentication**:
   - JWT token required for all mutations
   - Token verified by authMiddleware
   - User can only modify their own profile

2. **Authorization**:
   - User ID extracted from JWT (trusted source)
   - Cannot modify other users' profiles
   - Public endpoint only allows reading

3. **Input Validation**:
   - Controller validates request format
   - Use case validates business rules
   - SQL injection prevented by parameterized queries

4. **Data Privacy**:
   - No sensitive data in profile
   - Email is public in profile view
   - Consider adding privacy settings in future

---

## Performance Considerations

1. **Database Queries**:
   - Single query for profile retrieval
   - Separate query for user data
   - Consider JOIN optimization for frequent access

2. **Caching**:
   - Not currently implemented
   - Consider Redis caching for public profiles
   - Cache invalidation on updates

3. **Response Size**:
   - Minimal data transfer
   - Skills stored as string (not expanded)
   - Social links as JSONB (efficient)

---

## Future Enhancements

1. **File Upload**:
   - Direct avatar upload instead of URL
   - Image resizing and optimization
   - CDN storage

2. **Privacy Controls**:
   - Public/private profile toggle
   - Selective field visibility
   - Block users from viewing profile

3. **Search and Discovery**:
   - Search profiles by skills
   - Filter by location/experience
   - Profile recommendations

4. **Validation**:
   - URL validation for social links
   - Email format validation
   - Skills autocomplete

5. **Analytics**:
   - Profile view counter
   - Popular skills tracking
   - User engagement metrics
