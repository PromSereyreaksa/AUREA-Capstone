import type { User } from '../../../shared/types';

export interface IAuthService {
  signUp(email: string, password: string): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  signInWithGoogle(): Promise<User>;
  handleGoogleCallback(): Promise<User>;
  resetPassword(email: string): Promise<void>;
  verifyEmail(code: string): Promise<void>;
  resendOtp(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
