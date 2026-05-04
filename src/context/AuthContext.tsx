import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { User, AuthState } from '../types';
import { authApi } from '../services/api';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  guestLogin: () => Promise<void>;
  logout: () => void;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH'; payload: { user: User; token: string } }
  | { type: 'CLEAR_AUTH' };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'CLEAR_AUTH':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('hld_token');
    const storedUser = localStorage.getItem('hld_user');
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        dispatch({ type: 'SET_AUTH', payload: { user, token } });
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const persistAuth = (user: User, token: string) => {
    localStorage.setItem('hld_token', token);
    localStorage.setItem('hld_user', JSON.stringify(user));
    dispatch({ type: 'SET_AUTH', payload: { user, token } });
  };

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    persistAuth(data.user, data.token);
  };

  const loginWithToken = (token: string, user: User) => {
    persistAuth(user, token);
  };

  const guestLogin = async () => {
    const { data } = await authApi.guest();
    persistAuth(data.user, data.token);
  };

  const logout = () => {
    localStorage.removeItem('hld_token');
    localStorage.removeItem('hld_user');
    dispatch({ type: 'CLEAR_AUTH' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithToken, guestLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
