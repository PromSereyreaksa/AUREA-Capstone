import type { IAuthService } from './IAuthService';
import type { User } from '../../../shared/types';

export class MockAuthService implements IAuthService {
  private currentUser: User | null = null;

  async signUp(email: string, password: string): Promise<User> {
    console.log('[Mock] Sign up:', email);
    
    const user: User = {
      user_id: Math.floor(Math.random() * 1000),
      email,
      role: 'designer',
      email_verified: false,
      created_at: new Date(),
    };

    this.currentUser = user;
    return new Promise((resolve) => setTimeout(() => resolve(user), 1000));
  }

  async signIn(email: string, password: string): Promise<User> {
    console.log('[Mock] Sign in:', email);
    
    const user: User = {
      user_id: 1,
      email,
      role: 'designer',
      email_verified: true,
      last_login_at: new Date(),
    };

    this.currentUser = user;
    return new Promise((resolve) => setTimeout(() => resolve(user), 1000));
  }

  async signOut(): Promise<void> {
    console.log('[Mock] Sign out');
    this.currentUser = null;
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  async signInWithGoogle(): Promise<User> {
    console.log('[Mock] Sign in with Google');
    
    const user: User = {
      user_id: 1,
      email: 'mock@google.com',
      role: 'designer',
      email_verified: true,
      google_id: 'mock-google-id',
    };

    this.currentUser = user;
    return new Promise((resolve) => setTimeout(() => resolve(user), 1000));
  }

  async resetPassword(email: string): Promise<void> {
    console.log('[Mock] Reset password for:', email);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async verifyEmail(code: string): Promise<void> {
    console.log('[Mock] Verify email with code:', code);
    if (this.currentUser) {
      this.currentUser.email_verified = true;
    }
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('[Mock] Get current user');
    return new Promise((resolve) => setTimeout(() => resolve(this.currentUser), 500));
  }
}