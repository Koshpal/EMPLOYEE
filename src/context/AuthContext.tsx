import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthResponse } from '../types/employee.types';
import { employeeService } from '../services/employee.service';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Fast path: restore from localStorage (same-portal login)
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          setUser(JSON.parse(raw));
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('user');
        }
      }

      // Slow path: localStorage empty — check the shared .koshpal.com cookie.
      // This fires when the user was redirected here from the landing page after
      // logging in there. The httpOnly cookie is already set for .koshpal.com and
      // the browser sends it automatically (withCredentials: true).
      try {
        const me = await employeeService.getCurrentUser();
        if (me && (me as any).role === 'EMPLOYEE') {
          setUser(me);
          localStorage.setItem('user', JSON.stringify(me));
        }
      } catch {
        // Not authenticated — ProtectedRoute will redirect to /login
      } finally {
        setLoading(false);
      }
    };

    void initAuth();
  }, []);

  const login = async (credentials: any) => {
    const response = await employeeService.login(credentials);
    setUser(response.user);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const logout = async () => {
    await employeeService.logout(); // revokes refresh token + clears cookie
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
