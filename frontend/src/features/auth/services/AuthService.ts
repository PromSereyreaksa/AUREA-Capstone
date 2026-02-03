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

  // Handle the callback after Google OAuth redirect
  async handleGoogleCallback(): Promise<User> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    if (!session?.user) throw new Error('No session found after Google authentication');

    const googleUser = session.user;

    // Sync with backend - create or get user
    try {
      const response = await httpClient.post<{ data: { user: User; token: string } }>('/users/google', {
        google_id: googleUser.id,
        email: googleUser.email,
        name: googleUser.user_metadata?.full_name || googleUser.user_metadata?.name,
        avatar_url: googleUser.user_metadata?.avatar_url,
        role: 'designer',
      });

      // Store the backend JWT token
      if (response.data?.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      return response.data?.user || {
        user_id: 0,
        email: googleUser.email || '',
        role: 'designer',
        email_verified: true,
      };
    } catch (err) {
      console.error('Backend Google auth error:', err);
      // Return basic user data even if backend sync fails
      return {
        user_id: 0,
        email: googleUser.email || '',
        role: 'designer',
        email_verified: true,
      };
    }
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

    // Check if this is a Google user
    if (session.user.app_metadata?.provider === 'google') {
      try {
        // Try to get user from backend using stored token
        const token = localStorage.getItem('auth_token');
        if (token) {
          const userData = await httpClient.get<{ data: { user: User } }>('/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return userData.data?.user || null;
        }
      } catch (err) {
        console.error('Error fetching Google user from backend:', err);
      }
      
      // Fallback: return Supabase user data
      return {
        user_id: 0,
        email: session.user.email || '',
        role: 'designer',
        email_verified: true,
      };
    }

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
