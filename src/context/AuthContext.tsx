'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

// Extender el tipo Window para incluir refreshInterval
declare global {
  interface Window {
    refreshInterval?: NodeJS.Timeout;
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAdmin = user?.role === 'ADMIN';

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (window.refreshInterval) {
      clearInterval(window.refreshInterval);
    }
    router.push('/login');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const success = await fetchUserData(token);
        if (!success) {
          handleLogout();
        } else if (window.location.pathname === '/') {
          router.push('/dashboard');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (!token) {
        handleLogout();
        return;
      }

      const interval = setInterval(async () => {
        const success = await fetchUserData(token);
        if (!success) {
          handleLogout();
        }
      }, 5 * 60 * 1000);
      
      window.refreshInterval = interval;
      return () => {
        clearInterval(interval);
      };
    }
  }, [user]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setLoading(false);
    router.push('/dashboard');
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user && !!localStorage.getItem('token'),
    isAdmin,
    login,
    logout: handleLogout,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 