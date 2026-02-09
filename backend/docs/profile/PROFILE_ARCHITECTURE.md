# Profile Feature Architecture

## Clean Architecture Implementation

The profile feature follows clean architecture principles with clear separation of concerns across multiple layers.

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  (Controllers, Routes, Middleware)                          │
│  - HTTP handling                                            │
│  - Request/Response formatting                              │
│  - Authentication                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  (Use Cases)                                                │
│  - Business logic                                           │
│  - Orchestration                                            │
│  - Validation rules                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│  (Entities, Interfaces)                                     │
│  - Core business objects                                    │
│  - Repository interfaces                                    │
│  - Domain rules                                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  (Repositories, Database, External Services)                │
│  - Database operations                                      │
│  - Data persistence                                         │
│  - External API calls                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
backend/src/
├── interfaces/                    # Presentation Layer
│   ├── controllers/
│   │   └── ProfileController.ts  # HTTP handlers
│   └── routes/
│       └── profileRoutes.ts      # Route definitions
│
├── application/                   # Application Layer
│   └── use_cases/
│       ├── CreateUserProfile.ts  # Create profile logic
│       ├── GetUserProfile.ts     # Retrieve profile logic
│       ├── UpdateUserProfile.ts  # Update profile logic
│       └── DeleteUserProfile.ts  # Delete profile logic
│
├── domain/                        # Domain Layer
│   ├── entities/
│   │   └── UserProfile.ts        # Profile entity
│   └── repositories/
│       └── IUserProfileRepository.ts  # Repository interface
│
└── infrastructure/                # Infrastructure Layer
    ├── repositories/
    │   └── UserProfileRepository.ts  # DB implementation
    ├── mappers/
    │   └── userProfileMapper.ts     # Data transformation
    └── db/
        └── supabase.ts              # Database client
```

---

## Layer Responsibilities

### 1. Presentation Layer (Interfaces)

#### ProfileController.ts
**Purpose**: Handle HTTP requests and responses

**Responsibilities**:
- Parse request body and parameters
- Call appropriate use cases
- Format responses
- Handle HTTP-specific errors

**Key Functions**:
```typescript
createProfileController(req, res)
getProfileController(req, res)
getUserProfileByIdController(req, res)
updateProfileController(req, res)
deleteProfileController(req, res)
```

**Example Flow**:
```typescript
async createProfileController(req: Request, res: Response) {
  try {
    // 1. Extract data from request
    const userId = req.user!.user_id;
    const profileData = req.body;
    
    // 2. Call use case
    const createUserProfile = new CreateUserProfile();
    const profile = await createUserProfile.execute(userId, profileData);
    
    // 3. Format response
    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: profile
    });
  } catch (error) {
    // 4. Handle errors
    handleControllerError(res, error);
  }
}
```

#### profileRoutes.ts
**Purpose**: Define API endpoints

**Configuration**:
```typescript
const profileRouter = Router();

profileRouter.post('/', authMiddleware, createProfileController);
profileRouter.get('/', authMiddleware, getProfileController);
profileRouter.get('/:userId', getUserProfileByIdController);
profileRouter.put('/', authMiddleware, updateProfileController);
profileRouter.delete('/', authMiddleware, deleteProfileController);
```

**Middleware Chain**:
```
Request → authMiddleware → Controller → Response
```

---

### 2. Application Layer (Use Cases)

#### CreateUserProfile.ts
**Purpose**: Handle profile creation business logic

**Input**:
```typescript
interface CreateUserProfileInput {
  bio?: string;
  skills?: string;
  location?: string;
  profile_avatar?: string;
  experience_years?: number;
  seniority_level?: string;
  social_links?: object;
}
```

**Logic**:
1. Validate input data
2. Check if profile already exists
3. Create UserProfile entity
4. Save via repository
5. Return created profile

**Example**:
```typescript
class CreateUserProfile {
  async execute(userId: number, input: CreateUserProfileInput) {
    // Business validation
    if (input.experience_years && input.experience_years < 0) {
      throw new ValidationError("Experience years cannot be negative");
    }
    
    // Create entity
    const profile = new UserProfile({
      user_id: userId,
      bio: input.bio,
      skills: input.skills,
      // ... other fields
    });
    
    // Persist
    const repository = new UserProfileRepository();
    return await repository.create(profile);
  }
}
```

#### UpdateUserProfile.ts
**Purpose**: Handle profile updates with complex logic

**Special Features**:
- Updates `users` table for name changes
- Updates `user_profile` table for profile fields
- Uses upsert logic (create if not exists)
- Merges data from multiple tables

**Logic**:
```typescript
async execute(userId: number, input: UpdateProfileInput) {
  // 1. Update names in users table if provided
  if (input.first_name || input.last_name) {
    await updateUserNames(userId, input.first_name, input.last_name);
  }
  
  // 2. Update profile in user_profile table
  const repository = new UserProfileRepository();
  const profile = await repository.update(userId, {
    bio: input.bio,
    skills: input.skills,
    // ... other fields
  });
  
  return profile;
}
```

---

### 3. Domain Layer

#### UserProfile Entity
**Purpose**: Represent profile business object

**Definition**:
```typescript
class UserProfile {
  profile_id: number;
  user_id: number;
  bio?: string;
  skills?: string;
  location?: string;
  profile_avatar?: string;
  experience_years?: number;
  seniority_level?: 'junior' | 'mid' | 'senior' | 'expert';
  social_links?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    behance?: string;
    dribbble?: string;
  };
  updated_at: Date;
  
  constructor(data: Partial<UserProfile>) {
    this.profile_id = data.profile_id!;
    this.user_id = data.user_id!;
    this.bio = data.bio;
    this.skills = data.skills;
    this.location = data.location;
    this.profile_avatar = data.profile_avatar;
    this.experience_years = data.experience_years;
    this.seniority_level = data.seniority_level;
    this.social_links = data.social_links;
    this.updated_at = data.updated_at || new Date();
  }
}
```

**Domain Rules**:
- User ID is immutable
- Skills stored as JSON string
- Social links stored as object
- Updated timestamp auto-managed

#### IUserProfileRepository Interface
**Purpose**: Define data access contract

```typescript
interface IUserProfileRepository {
  create(profile: UserProfile): Promise<UserProfile>;
  findByUserId(userId: number): Promise<UserProfile | null>;
  update(userId: number, data: Partial<UserProfile>): Promise<UserProfile>;
  delete(userId: number): Promise<void>;
}
```

**Benefits**:
- Decouples domain from infrastructure
- Enables testing with mock implementations
- Allows swapping database implementations

---

### 4. Infrastructure Layer

#### UserProfileRepository.ts
**Purpose**: Implement data persistence

**Methods**:

1. **create(profile)**
   ```typescript
   async create(profile: UserProfile): Promise<UserProfile> {
     const row = mapUserProfileToDb(profile);
     
     const { data, error } = await supabase
       .from('user_profile')
       .insert(row)
       .select()
       .single();
     
     if (error) throw new DatabaseError(error.message);
     
     // Fetch user data to merge
     const userData = await getUserData(profile.user_id);
     
     return mapUserProfileFromDb({ ...data, ...userData });
   }
   ```

2. **findByUserId(userId)**
   ```typescript
   async findByUserId(userId: number): Promise<UserProfile | null> {
     const { data, error } = await supabase
       .from('user_profile')
       .select('*')
       .eq('user_id', userId)
       .single();
     
     if (error && error.code === 'PGRST116') return null;
     if (error) throw new DatabaseError(error.message);
     
     const userData = await getUserData(userId);
     return mapUserProfileFromDb({ ...data, ...userData });
   }
   ```

3. **update(userId, data)**
   - Checks if profile exists
   - Creates new if not found (upsert)
   - Updates existing profile
   - Returns updated profile with user data

4. **delete(userId)**
   ```typescript
   async delete(userId: number): Promise<void> {
     const { error } = await supabase
       .from('user_profile')
       .delete()
       .eq('user_id', userId);
     
     if (error) throw new DatabaseError(error.message);
   }
   ```

#### userProfileMapper.ts
**Purpose**: Transform between domain and database formats

**Functions**:

1. **mapUserProfileToDb(profile)**
   - Domain entity → Database row
   - Strips computed fields
   - Formats for Supabase

2. **mapUserProfileFromDb(row)**
   - Database row → Domain entity
   - Adds default values
   - Creates UserProfile instance

---

## Data Merging Strategy

### Problem
Profile data is split across two tables:
- `users` table: first_name, last_name, email
- `user_profile` table: bio, skills, location, etc.

### Solution
Merge data in repository layer before returning to use cases:

```typescript
async findByUserId(userId: number): Promise<UserProfile | null> {
  // 1. Fetch profile data
  const profileData = await fetchFromUserProfileTable(userId);
  
  // 2. Fetch user data
  const userData = await fetchFromUsersTable(userId);
  
  // 3. Merge and return
  return mapUserProfileFromDb({
    ...profileData,
    first_name: userData.first_name,
    last_name: userData.last_name,
    email: userData.email
  });
}
```

**Benefits**:
- Use cases work with complete profile object
- Controllers don't need to merge data
- Single source of truth for merged data

---

## Dependency Injection Pattern

### Controller → Use Case
```typescript
// Controllers create new use case instances
const createUserProfile = new CreateUserProfile();
const profile = await createUserProfile.execute(userId, data);
```

### Use Case → Repository
```typescript
// Use cases create new repository instances
const repository = new UserProfileRepository();
const profile = await repository.create(profileEntity);
```

**Future Enhancement**: Use DI container for better testability

---

## Error Handling Architecture

### Error Types
```typescript
ValidationError      // Invalid input data
NotFoundError        // Resource doesn't exist
ConflictError        // Resource already exists
DatabaseError        // Database operation failed
UnauthorizedError    // Authentication failed
```

### Error Flow
```
Error thrown in any layer
    ↓
Caught by try-catch in controller
    ↓
Passed to error handler middleware
    ↓
Formatted to standard response
    ↓
Sent to client
```

### Error Handler
```typescript
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message,
    error: {
      code: error.code,
      details: error.details
    }
  });
});
```

---

## Authentication Flow

```
Request with JWT token
    ↓
authMiddleware extracts and verifies token
    ↓
Attaches user data to req.user
    ↓
Controller accesses req.user.user_id
    ↓
Use case receives userId as parameter
    ↓
Repository uses userId for queries
```

**Security**:
- User ID comes from JWT (trusted)
- Cannot be manipulated by client
- Use cases don't need to verify authentication

---

## Testing Strategy

### Unit Tests
- Test each use case independently
- Mock repository with in-memory implementation
- Test business logic validation

### Integration Tests
- Test controller + use case + repository
- Use test database
- Verify complete flows

### E2E Tests
- Test complete API endpoints
- Real HTTP requests
- Verify responses

---

## Performance Optimizations

1. **Single Query for Profile**
   - Fetch profile and user data separately
   - Merge in application layer
   - Consider JOIN optimization

2. **Index Strategy**
   - Index on `user_profile.user_id` (foreign key)
   - Index on `users.user_id` (primary key)
   - Fast lookups guaranteed

3. **Response Caching** (future)
   - Cache public profiles
   - Invalidate on update
   - Redis implementation

---

## Scalability Considerations

1. **Horizontal Scaling**
   - Stateless application layer
   - Can run multiple instances
   - Load balancer distributes requests

2. **Database Scaling**
   - Read replicas for public profiles
   - Write to primary database
   - Connection pooling

3. **CDN Integration** (future)
   - Serve profile avatars from CDN
   - Reduce bandwidth costs
   - Improve load times

---

## Maintenance and Extensibility

### Adding New Profile Fields

1. **Update Migration**:
   ```sql
   ALTER TABLE user_profile ADD COLUMN new_field VARCHAR(255);
   ```

2. **Update Entity**:
   ```typescript
   class UserProfile {
     new_field?: string;
   }
   ```

3. **Update Mapper**:
   ```typescript
   function mapUserProfileFromDb(row) {
     return new UserProfile({
       // ... existing fields
       new_field: row.new_field
     });
   }
   ```

4. **Update Swagger**: Add to profile.yaml

### Adding New Endpoints

1. Create new use case in `application/use_cases/`
2. Add controller method in `ProfileController.ts`
3. Add route in `profileRoutes.ts`
4. Update Swagger documentation
5. Add tests

---

## Deployment Considerations

1. **Environment Variables**:
   - Database connection string
   - JWT secret
   - API keys

2. **Database Migrations**:
   - Run migrations before deployment
   - Verify schema changes
   - Backup data before major changes

3. **Monitoring**:
   - Log all errors
   - Track API response times
   - Monitor database performance

4. **Rollback Strategy**:
   - Keep previous version ready
   - Database migration rollback scripts
   - Feature flags for new functionality
