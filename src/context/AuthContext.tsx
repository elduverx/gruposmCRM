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
      console.log('Fetching user data with token:', token.substring(0, 10) + '...');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User data fetched successfully:', userData);
        setUser(userData);
        return true;
      } else if (response.status === 401) {
        console.log('Token expired, attempting to refresh...');
        // Token might be expired, try to refresh it
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          console.log('Token refreshed successfully');
          // If refresh was successful, try fetching user data again with the new token
          const newToken = localStorage.getItem('token');
          if (newToken) {
            const retryResponse = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${newToken}`
              }
            });
            
            if (retryResponse.ok) {
              const userData = await retryResponse.json();
              console.log('User data fetched successfully after token refresh');
              setUser(userData);
              return true;
            }
          }
        } else {
          console.log('Token refresh failed');
        }
      }
      return false;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return false;
    }
  };

  const handleLogout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    setUser(null);
    if (window.refreshInterval) {
      clearInterval(window.refreshInterval);
    }
    router.push('/login');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing authentication');
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Token found in localStorage, fetching user data');
        const success = await fetchUserData(token);
        if (!success) {
          console.log('Failed to fetch user data, logging out');
          handleLogout();
        } else if (window.location.pathname === '/') {
          console.log('Redirecting to dashboard');
          router.push('/dashboard');
        }
      } else {
        console.log('No token found in localStorage');
      }
      console.log('Setting loading to false');
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

      // Clear any existing interval
      if (window.refreshInterval) {
        clearInterval(window.refreshInterval);
      }

      // Set up a new interval to refresh the token every 5 minutes
      const interval = setInterval(async () => {
        console.log('Refreshing token on interval');
        const success = await fetchUserData(token);
        if (!success) {
          console.log('Token refresh failed on interval, logging out');
          handleLogout();
        }
      }, 5 * 60 * 1000);
      
      window.refreshInterval = interval;
      return () => {
        console.log('Clearing refresh interval');
        clearInterval(interval);
      };
    }
  }, [user]);

  const login = (token: string, userData: User) => {
    console.log('Logging in user:', userData.email);
    localStorage.setItem('token', token);
    setUser(userData);
    setLoading(false);
    router.push('/dashboard');
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('Attempting to refresh token');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for refresh');
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Token refreshed successfully');
        localStorage.setItem('token', data.token);
        return true;
      }
      console.log('Token refresh failed with status:', response.status);
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