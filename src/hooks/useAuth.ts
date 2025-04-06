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

  // Función para verificar si el token está próximo a expirar (30 minutos antes)
  const isTokenNearExpiration = (token: string) => {
    try {
      const decoded = jwt.decode(token) as { exp: number };
      if (!decoded || !decoded.exp) return true;
      
      const expirationTime = decoded.exp * 1000; // Convertir a milisegundos
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      // Si faltan menos de 30 minutos para expirar, considerar como próximo a expirar
      return timeUntilExpiration < 30 * 60 * 1000;
    } catch (error) {
      console.error('Error al verificar expiración del token:', error);
      return true;
    }
  };

  // Función para verificar la autenticación
  const verifyAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      router.push('/login');
      return;
    }

    try {
      // Si el token está próximo a expirar, intentar refrescarlo
      if (isTokenNearExpiration(token)) {
        console.log('Token próximo a expirar, intentando refrescar...');
        const refreshed = await refreshToken();
        if (!refreshed) {
          setLoading(false);
          return;
        }
      }

      // Verificar el token con el servidor
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAuth();
    
    // Configurar un intervalo para verificar la autenticación periódicamente
    const interval = setInterval(verifyAuth, 5 * 60 * 1000); // Verificar cada 5 minutos
    
    return () => clearInterval(interval);
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
        console.error('Error al refrescar el token:', await response.text());
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