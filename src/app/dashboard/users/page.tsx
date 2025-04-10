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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const fetchUsers = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró el token de autenticación');
        return;
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar los usuarios');
      }

      const data = await response.json();
      setUsers(data);
      updateStats(data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo a login');
      router.replace('/login');
      return;
    }
    
    // Eliminar la verificación de permisos de administrador
    // if (!isAdmin) {
    //   console.log('Usuario no es administrador, redirigiendo a dashboard');
    //   router.replace('/dashboard');
    //   return;
    // }
    
    // Si el usuario está autenticado, cargar los usuarios
    console.log('Usuario autenticado, cargando usuarios');
    fetchUsers();
  }, [authLoading, isAuthenticated, router, fetchUsers]);

  const updateStats = (data: User[]) => {
    const admins = data.filter((user: User) => user.role === 'ADMIN').length;
    setStats({
      total: data.length,
      active: data.length - admins,
      inactive: admins
    });
  };

  const handleUsersChange = (newUsers: User[]) => {
    console.log('handleUsersChange llamado con:', newUsers);
    setUsers(newUsers);
    updateStats(newUsers);
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
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
            Volver al Inicio
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
          <h3 className="text-lg font-semibold text-gray-700">Usuarios Activos</h3>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Usuarios Inactivos</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.inactive}</p>
        </div>
      </div>
      <UserList users={users} onUsersChange={handleUsersChange} isAdmin={isAdmin} />
    </div>
  );
} 