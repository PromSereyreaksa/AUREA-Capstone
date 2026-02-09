import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { IAuthService, AuthState } from '../services/IAuthService';
import { AuthService } from '../services/AuthService';

interface AuthContextValue extends AuthState {
  authService: IAuthService;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  authService?: IAuthService;
}

export const AuthProvider = ({ children, authService }: AuthProviderProps) => {
  const service = authService || new AuthService();
  
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      try {
        const user = await service.getCurrentUser();
        setState({ user, loading: false, error: null });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState({ user: null, loading: false, error: null });
      }
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setState({ ...state, loading: true, error: null });
      const user = await service.signUp(email, password, firstName, lastName);
      setState({ user, loading: false, error: null });
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState({ ...state, loading: true, error: null });
      const user = await service.signIn(email, password);
      setState({ user, loading: false, error: null });
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setState({ ...state, loading: true, error: null });
      await service.signOut();
      setState({ user: null, loading: false, error: null });
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setState({ ...state, loading: true, error: null });
      await service.signInWithGoogle();
      // User will be redirected, state will update when they return
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setState({ ...state, loading: true, error: null });
      await service.resetPassword(email);
      setState({ ...state, loading: false, error: null });
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
      throw error;
    }
  };

  const verifyEmail = async (code: string) => {
    try {
      setState({ ...state, loading: true, error: null });
      await service.verifyEmail(code);
      if (state.user) {
        setState({ 
          user: { ...state.user, email_verified: true }, 
          loading: false, 
          error: null 
        });
      }
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
      throw error;
    }
  };

  const resendOtp = async () => {
    try {
      setState({ ...state, loading: true, error: null });
      await service.resendOtp();
      setState({ ...state, loading: false, error: null });
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
      throw error;
    }
  };

  const confirmPasswordReset = async (token: string, newPassword: string) => {
    try {
      setState({ ...state, loading: true, error: null });
      await service.confirmPasswordReset(token, newPassword);
      setState({ ...state, loading: false, error: null });
    } catch (error: any) {
      setState({ ...state, loading: false, error: error.message });
      throw error;
    }
  };

  const value: AuthContextValue = {
    ...state,
    authService: service,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    resetPassword,
    confirmPasswordReset,
    verifyEmail,
    resendOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
