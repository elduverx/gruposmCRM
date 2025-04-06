import { useState, useEffect } from 'react';
import jwt from 'jsonwebtoken';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Verificar el token con el servidor
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('Usuario verificado:', userData);
            setUser(userData);
            setTokenExpired(false);
          } else {
            console.error('Token inválido o expirado');
            setTokenExpired(true);
            localStorage.removeItem('authToken');
            router.push('/login');
          }
        } catch (error) {
          console.error('Error al verificar el token:', error);
          setTokenExpired(true);
          localStorage.removeItem('authToken');
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    verifyAuth();
  }, [router]);

  const login = (token: string, userData: User) => {
    console.log('Login con usuario:', userData);
    localStorage.setItem('authToken', token);
    setUser(userData);
    setTokenExpired(false);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setTokenExpired(false);
    router.push('/login');
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        setTokenExpired(false);
        return true;
      } else {
        setTokenExpired(true);
        localStorage.removeItem('authToken');
        router.push('/login');
        return false;
      }
    } catch (error) {
      console.error('Error al refrescar el token:', error);
      setTokenExpired(true);
      localStorage.removeItem('authToken');
      router.push('/login');
      return false;
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user && !tokenExpired,
    isAdmin: user?.role === 'ADMIN',
    tokenExpired
  };
} 