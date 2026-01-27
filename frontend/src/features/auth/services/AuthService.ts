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

    try {
      const userData = await httpClient.get<User>(`/users/${session.user.id}`);
      return userData;
    } catch (err) {
      throw new Error("User can't be found");
    }
  }
}