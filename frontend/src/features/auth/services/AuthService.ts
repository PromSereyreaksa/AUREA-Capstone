import type { IAuthService } from './IAuthService';
import type { User } from '../../../shared/types';
import { httpClient } from '../../../shared/api/client';
import { supabase } from '../../../shared/api/supabaseClient';

// Backend API response wrapper
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export class AuthService implements IAuthService {
  async signUp(email: string, password: string): Promise<User> {
    try {
      const response = await httpClient.post<ApiResponse<{ user: User; otp?: string }>>('/users/signup', {
        email,
        password,
        role: 'designer',
      });
      
      // Store email for OTP verification
      localStorage.setItem('pending_verification_email', email);
      
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const response = await httpClient.post<ApiResponse<{ user: User; token: string }>>('/users/signin', {
        email,
        password,
      });
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response.data.user;
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
    // Use Supabase OAuth to sign in with Google
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',  // Force Google to show account picker
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to initiate Google sign in');
    }

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
      // Get the email stored during signup
      const email = localStorage.getItem('pending_verification_email');
      if (!email) {
        throw new Error('No email found for verification. Please sign up again.');
      }
      
      const response = await httpClient.post<ApiResponse<{ user: User; token: string }>>('/users/verify-otp', { 
        email, 
        otp: code 
      });
      
      // Store the token after successful verification
      if (response.data?.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      // Clear the pending email
      localStorage.removeItem('pending_verification_email');
    } catch (error: any) {
      throw new Error(error.message || 'Email verification failed');
    }
  }

  async resendOtp(): Promise<void> {
    try {
      const email = localStorage.getItem('pending_verification_email');
      if (!email) {
        throw new Error('No email found. Please sign up again.');
      }
      
      await httpClient.post<ApiResponse<{ message: string }>>('/users/resend-otp', { email });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to resend OTP');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('auth_token');
    
    // First check if there's a Supabase session (for Google OAuth users)
    const { data: { session } } = await supabase.auth.getSession();

    // If we have a Supabase session (Google user)
    if (session?.user) {
      try {
        // Try to get user from backend using stored token
        if (token) {
          const userData = await httpClient.get<{ data: { user: User } }>('/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return userData.data?.user || null;
        }
        
        // Sync with backend if no token yet
        const response = await httpClient.post<{ data: { user: User; token: string } }>('/users/google', {
          google_id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
          role: 'designer',
        });

        if (response.data?.token) {
          localStorage.setItem('auth_token', response.data.token);
        }

        return response.data?.user || {
          user_id: 0,
          email: session.user.email || '',
          role: 'designer',
          email_verified: true,
        };
      } catch (err) {
        console.error('Error fetching Google user from backend:', err);
        // Fallback: return Supabase user data
        return {
          user_id: 0,
          email: session.user.email || '',
          role: 'designer',
          email_verified: true,
        };
      }
    }

    // No token and no session
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
