'use client';

import { useState, useEffect } from 'react';
import UserList from '../../../components/users/UserList';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { UsersIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, isAdmin, refreshToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    regular: 0
  });

  useEffect(() => {
    // Verificar autenticación y permisos inmediatamente
    if (!authLoading) {
      if (!isAuthenticated) {
        console.log('Usuario no autenticado, redirigiendo a login');
        router.replace('/login');
        return;
      }
      
      if (!isAdmin) {
        console.log('Usuario no es administrador, redirigiendo a dashboard');
        router.replace('/dashboard');
        return;
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const fetchUsers = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No token found');
        router.replace('/login');
        return;
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.log('Unauthorized access, attempting to refresh token');
        const refreshed = await refreshToken();
        if (refreshed) {
          // Reintentar la solicitud con el nuevo token
          const newToken = localStorage.getItem('authToken');
          const retryResponse = await fetch('/api/users', {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          });
          
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            console.log('Users fetched after token refresh:', data);
            setUsers(data);
            updateStats(data);
            return;
          }
        }
        console.log('Token refresh failed, redirecting to login');
        router.replace('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al obtener usuarios:', errorData);
        setError(errorData.message || 'Error al obtener usuarios');
        return;
      }

      const data = await response.json();
      console.log('Users fetched:', data);
      setUsers(data);
      updateStats(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data: User[]) => {
    const admins = data.filter((user: User) => user.role === 'ADMIN').length;
    setStats({
      total: data.length,
      admins,
      regular: data.length - admins
    });
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      console.log('Usuario autenticado y es administrador, cargando usuarios');
      fetchUsers();
    }
  }, [authLoading, isAuthenticated, isAdmin]);

  const handleUsersChange = (newUsers: User[]) => {
    console.log('handleUsersChange llamado con:', newUsers);
    setUsers(newUsers);
    updateStats(newUsers);
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si no es administrador, no renderizar nada (la redirección ya se maneja en el useEffect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Administración de Usuarios</h1>
        <div className="flex space-x-2">
          <button 
            onClick={fetchUsers}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Actualizar
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Usuarios</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Administradores</h3>
          <p className="text-3xl font-bold text-green-600">{stats.admins}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Usuarios Regulares</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.regular}</p>
        </div>
      </div>
      <UserList users={users} onUsersChange={handleUsersChange} />
    </div>
  );
} 