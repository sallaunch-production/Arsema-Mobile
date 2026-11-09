// Global authentication context using useReducer pattern.
// Provides signIn/signUp/signOut actions and exposes the user object + JWT token
// to all screens via the useAuth() hook. Token is required for all API calls.
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Alert } from 'react-native';
import { IUser } from '../interfaces/user';
import { API_BASE_URL, BASIC_AUTH } from '../constants/api';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signUp: (name: string, email: string, phone: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ user: IUser; token: string } | null>;
  signOut: () => void;
  verifyEmail: (otp: string) => Promise<boolean>;
  resendOtp: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SIGN_IN'; payload: { user: IUser; token: string } }
  | { type: 'SIGN_OUT' }
  | { type: 'UPDATE_USER'; payload: Partial<IUser> };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SIGN_IN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SIGN_OUT':
      return { ...initialState };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

function mapUser(apiUser: any, fallback: Partial<IUser> = {}): IUser {
  return {
    id: apiUser?.id || fallback.id || '',
    name: apiUser?.full_name || apiUser?.name || fallback.name || '',
    email: apiUser?.email || fallback.email || '',
    phone: apiUser?.phone || fallback.phone || '',
    isVerified: apiUser?.active ?? fallback.isVerified ?? false,
    hasPin: apiUser?.pin_set ?? fallback.hasPin ?? false,
    level: apiUser?.level || apiUser?.user_level || fallback.level || 'basic',
  };
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const signUp = useCallback(async (name: string, email: string, phone: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': BASIC_AUTH,
        },
        body: JSON.stringify({
          full_name: name,
          email,
          phone,
          password,
        }),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        if (!response.ok) throw new Error('Registration failed (Server Error)');
      }

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error?.message || data?.message || 'Registration failed');
      }

      const user = mapUser(data.data?.user, { name, email, phone });
      const token = data.data?.token || '';

      dispatch({ type: 'SIGN_IN', payload: { user, token } });
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.message || 'Something went wrong. Please try again.';
      Alert.alert('Sign Up Failed', message);
      throw error;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ user: IUser; token: string } | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': BASIC_AUTH,
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        if (!response.ok) throw new Error('Login failed (Server Error)');
      }

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error?.message || data?.message || 'Invalid email or password.');
      }

      const user = mapUser(data.data?.user, { email });
      const token = data.data?.token || '';

      dispatch({ type: 'SIGN_IN', payload: { user, token } });
      return { user, token };
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.message || 'Invalid email or password.';
      Alert.alert('Sign In Failed', message);
      return null;
    }
  }, []);

  const signOut = useCallback(() => {
    dispatch({ type: 'SIGN_OUT' });
  }, []);

  const verifyEmail = useCallback(async (otp: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': BASIC_AUTH,
          ...(state.token ? { 'X-Auth-Token': state.token } : {}),
        },
        body: JSON.stringify({ email: state.user?.email, otp }),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        if (!response.ok) throw new Error('Server error. Please try again.');
      }

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error?.message || 'Verification failed');
      }

      dispatch({ type: 'UPDATE_USER', payload: { isVerified: true } });
      dispatch({ type: 'SET_LOADING', payload: false });
      return true;
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      Alert.alert('Verification Failed', error.message || 'Invalid OTP code.');
      return false;
    }
  }, [state.token, state.user?.email]);

  const resendOtp = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': BASIC_AUTH,
          ...(state.token ? { 'X-Auth-Token': state.token } : {}),
        },
        body: JSON.stringify({ email: state.user?.email }),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        if (response.ok) {
          Alert.alert('OTP Sent', 'A new OTP code has been sent to your email.');
          return;
        }
        throw new Error('Server error. Please try again.');
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error?.message || 'Failed to resend OTP');
      }

      Alert.alert('OTP Sent', 'A new OTP code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP. Please try again.');
    }
  }, [state.token, state.user?.email]);

  const setPin = useCallback(async (pin: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`${API_BASE_URL}/v1/pin/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ pin }),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        if (!response.ok) throw new Error('Server error. Please try again.');
      }

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error?.message || 'Failed to set PIN');
      }

      dispatch({ type: 'UPDATE_USER', payload: { hasPin: true } });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      Alert.alert('PIN Setup Failed', error.message || 'Failed to set PIN. Please try again.');
      throw error;
    }
  }, [state.token, state.user?.email]);

  const value: AuthContextValue = {
    ...state,
    signUp,
    signIn,
    signOut,
    verifyEmail,
    resendOtp,
    setPin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
