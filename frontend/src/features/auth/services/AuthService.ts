import type { IAuthService } from './IAuthService';
import type { User } from '../../../shared/types';
import { supabase, httpClient } from '../../../shared/api/client';

export class AuthService implements IAuthService {
  async signUp(email: string, password: string): Promise<User> {
    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Create user record in backend
    try {
      const userData = await httpClient.post<User>('/users/signup', {
        email,
        password,
        role: 'designer',
      });
      return userData;
    } catch (err) {
      console.error('Backend signup error:', err);
      throw new Error("User can't be created in backend.");
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to sign in');

    // Fetch full user data from backend
    try {
      const userData = await httpClient.post<User>('/users/signin', {
        email,
        password,
      });
      return userData;
    } catch (err) {
      console.error('Backend signin error:', err);
      throw new Error("User can't be found in backend.");
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async signInWithGoogle(): Promise<User> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    // User will be redirected, so we return a placeholder
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  async verifyEmail(code: string): Promise<void> {
    // Placeholder - implement when backend supports it
    try {
      await httpClient.post('/users/verify-email', { code });
    } catch (err) {
      console.log('Email verification placeholder:', code);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return null;

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
      const userData = await httpClient.get<User>(`/users/${session.user.id}`);
      return userData;
    } catch (err) {
      throw new Error("User can't be found");
    }
  }
}