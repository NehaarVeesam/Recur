import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearAuthToken, getAuthToken, setAuthToken } from '../utils/authStorage';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  checking: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const logout = useCallback(() => {
    clearAuthToken();
    setIsAuthenticated(false);
    setUsername(null);
  }, []);

  const verifySession = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsAuthenticated(false);
      setUsername(null);
      setChecking(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        logout();
        return;
      }
      const data = await res.json();
      setIsAuthenticated(true);
      setUsername(typeof data.username === 'string' ? data.username : null);
    } catch {
      logout();
    } finally {
      setChecking(false);
    }
  }, [logout]);

  useEffect(() => {
    void verifySession();
  }, [verifySession]);

  const login = useCallback(async (inputUsername: string, inputPassword: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: inputUsername, password: inputPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    if (typeof data.token !== 'string' || !data.token) {
      throw new Error('Invalid server response');
    }
    setAuthToken(data.token);
    setIsAuthenticated(true);
    setUsername(inputUsername.trim());
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
