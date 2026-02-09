import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { JwtService } from '../../infrastructure/services/JwtService';
import bcrypt from 'bcrypt';

export interface SignInResult {
  user: {
    user_id: number;
    email: string;
    email_verified: boolean;
    auth_provider?: string;
    first_name?: string;
    last_name?: string;
    created_at?: Date;
    last_login_at?: Date;
  };
  token: string;
}

export class SignInUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(email: string, password: string): Promise<SignInResult> {
    // Find user by email
    const user = await this.userRepo.findByEmail(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user signed up with Google (no password)
    if (user.auth_provider === 'google' && !user.password) {
      throw new Error('This account uses Google sign-in. Please sign in with Google.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if email is verified
    if (!user.email_verified) {
      throw new Error('Please verify your email before signing in');
    }

    // Generate JWT token
    const token = JwtService.generateToken({
      user_id: user.user_id,
      email: user.email
    });

    // Update last login timestamp
    await this.userRepo.updateLastLogin(user.user_id);

    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        email_verified: user.email_verified,
        auth_provider: user.auth_provider,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        last_login_at: new Date()
      },
      token
    };
  }
}
