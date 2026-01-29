# Capstone Backend - Clean Architecture Skeleton

This project uses Clean Architecture principles for a modular, testable, and maintainable backend.

## Folder Structure

```
/capstone-backend
│
├── src/
│   ├── domain/                        # Core business logic and rules
│   │   ├── entities/                  # Business entities (e.g., User, Invoice, etc.)
│   │   └── repositories/              # Repository interfaces (contracts)
│   │
│   ├── application/                   # Application-specific business rules
│   │   └── use_cases/                 # Use case implementations (e.g., SignUpUser)
│   │
│   ├── infrastructure/                # External frameworks and services
│   │   ├── db/                        # Database clients (e.g., Supabase)
│   │   └── repositories/              # Repository implementations (e.g., UserRepository)
│   │   └── services/                  # External services (e.g., PDF extraction)
│   │
│   ├── interfaces/                    # Interface adapters (input/output)
│   │   ├── controllers/               # HTTP controllers (handle requests)
│   │   └── routes/                    # Express routes (define endpoints)
│   │
│   └── server.ts                      # Application entry point (Express app)
│
├── tests/                             # Unit and integration tests
│
├── .env                               # Environment variables (e.g., Supabase keys)
├── package.json                       # Project dependencies and scripts
└── tsconfig.json                      # TypeScript configuration
```

## Layer Descriptions

- **domain/**: Core business entities and repository interfaces. Independent of frameworks.
- **application/**: Use cases that implement business rules by orchestrating entities and repositories.
- **infrastructure/**: Implementations for external services (like databases, PDF extraction, etc.).
- **interfaces/**: Controllers and routes that handle HTTP requests and responses, adapting them to use cases.
- **server.ts**: Entry point that sets up the Express server and connects all the layers.

This structure makes the codebase modular, testable, and easy to maintain or extend.

---

## Example: User Sign-Up Flow (with Interface & Implementation)

### 1. Define the Repository Interface
```typescript
// src/domain/repositories/IUserRepository.ts
export interface IUserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}
```

### 2. Implement the Repository
```typescript
// src/infrastructure/repositories/UserRepository.ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { supabase } from '../db/supabaseClient';

export class UserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    // ...code to insert user into DB...
  }
  async findByEmail(email: string): Promise<User | null> {
    // ...code to find user by email...
  }
}
```

### 3. Use Case (Business Logic)
```typescript
// src/application/use_cases/SignUpUser.ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class SignUpUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(email: string, password: string, role: string): Promise<User> {
    const user = new User(0, email, password, role);
    return await this.userRepo.create(user);
  }
}
```

### 4. Controller (HTTP Layer)
```typescript
// src/interfaces/controllers/UserController.ts
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { SignUpUser } from '../../application/use_cases/SignUpUser';

const userRepo = new UserRepository(); // Implements IUserRepository
const signUpUser = new SignUpUser(userRepo); // Use case expects IUserRepository

export const signUpUserController = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }
    const user = await signUpUser.execute(email, password, role);
    return res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};
```

### 5. Route
```typescript
// src/interfaces/routes/userRoutes.ts
router.post('/', signUpUserController);
```

---

## Why Use an Interface?
- The use case (`SignUpUser`) only knows about the interface (`IUserRepository`), not the implementation.
- You can swap out `UserRepository` for a mock or another database without changing the use case.
- This makes your code flexible, testable, and decoupled.

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

This structure is ready for you to start implementing your business logic, use cases, and infrastructure integrations!