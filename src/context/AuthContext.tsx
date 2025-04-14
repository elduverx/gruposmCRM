/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-console */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
    
    // Limpiar el intervalo de refresco si existe
    if (window.refreshInterval) {
      clearInterval(window.refreshInterval);
    }
    
    router.push('/login');
  }, [router]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
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
  }, []);

  const fetchUserData = useCallback(async (token: string) => {
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
      
      if (response.status === 401) {
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          const newToken = localStorage.getItem('token');
          if (newToken) {
            const retryResponse = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${newToken}`
              }
            });
            
            if (retryResponse.ok) {
              const userData = await retryResponse.json();
              setUser(userData);
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return false;
    }
  }, [refreshToken]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const success = await fetchUserData(token);
        if (!success) {
          handleLogout();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUserData, handleLogout]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(refreshToken, 14 * 60 * 1000);
    window.refreshInterval = interval;
    
    return () => clearInterval(interval);
  }, [user, refreshToken]);

  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setLoading(false);
    router.push('/dashboard');
  }, [router]);

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