import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { apiRequest } from '../api/client';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('chess_token'));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!token) { setUser(null); return; }
    apiRequest<{ user: User }>('/api/auth/me', { token })
      .then((res) => setUser(res.user))
      .catch(() => { localStorage.removeItem('chess_token'); setToken(null); });
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('chess_token', res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName })
    });
    localStorage.setItem('chess_token', res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('chess_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
