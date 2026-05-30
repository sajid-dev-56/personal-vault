import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('Supabase Auth (Get Session) Error:', error);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) throw signInError;
    } catch (err: any) {
      console.error('Supabase Auth (Sign In) Error details:', err);
      const message = getErrorMessage(err.message);
      setError(message);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setError('');
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });
      if (signUpError) throw signUpError;
    } catch (err: any) {
      console.error('Supabase Auth (Sign Up) Error details:', err);
      const message = getErrorMessage(err.message);
      setError(message);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error('Supabase Auth (Google Sign In) Error details:', err);
      const message = getErrorMessage(err.message);
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    setError('');
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (err: any) {
      console.error('Supabase Auth (Sign Out) Error details:', err);
      setError('Failed to sign out. Please try again.');
      throw err;
    }
  };

  const clearError = () => setError('');

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function getErrorMessage(message: string): string {
  if (!message) return 'Authentication failed. Please try again.';
  const msg = message.toLowerCase();

  if (msg.includes('invalid login credentials')) return 'Incorrect email or password. Please try again.';
  if (msg.includes('email not confirmed')) return 'Please confirm your email address before signing in.';
  if (msg.includes('user already registered')) return 'An account with this email already exists.';
  if (msg.includes('weak password')) return 'Password must be at least 6 characters long.';
  if (msg.includes('invalid email')) return 'Please enter a valid email address.';
  if (msg.includes('popup')) return 'Sign-in popup was blocked. Please allow popups for this site.';
  if (msg.includes('provider is not enabled')) return 'Google sign-in is disabled. Enable it in Supabase Auth settings.';
  if (msg.includes('network')) return 'Network error. Please check your internet connection.';

  return message;
}
