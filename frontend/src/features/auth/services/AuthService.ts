import type { IAuthService } from './IAuthService';
import type { User } from '../../../shared/types';
import { httpClient } from '../../../shared/api/client';

export class AuthService implements IAuthService {
  async signUp(email: string, password: string): Promise<User> {
    try {
      const response = await httpClient.post<{ user: User; token: string }>('/users/signup', {
        email,
        password,
        role: 'designer',
      });
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      return response.user;
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const response = await httpClient.post<{ user: User; token: string }>('/users/signin', {
        email,
        password,
      });
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      return response.user;
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed');
    }
  }

  async signOut(): Promise<void> {
    try {
      // Call logout endpoint if exists
      await httpClient.post('/users/signout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear token
      localStorage.removeItem('auth_token');
    }
  }

  async signInWithGoogle(): Promise<User> {
    // Redirect to backend OAuth endpoint
    window.location.href = `${httpClient.baseUrl}/auth/google`;
    
    // Return placeholder (actual user will be set after redirect)
    return {
      user_id: 0,
      email: '',
      role: 'designer',
      email_verified: false,
    };
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await httpClient.post('/users/reset-password', { email });
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  }

  async verifyEmail(code: string): Promise<void> {
    try {
      await httpClient.post('/users/verify-email', { code });
    } catch (error: any) {
      throw new Error(error.message || 'Email verification failed');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) return null;

    try {
      const user = await httpClient.get<User>('/users/me');
      return user;
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('auth_token');
      return null;
    }
  }
}
