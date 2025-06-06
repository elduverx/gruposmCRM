'use client';

import { useState, useEffect, useCallback } from 'react';
import UserList from '../../../components/users/UserList';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminBanner from '../../../components/users/AdminBanner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, ChartBarIcon, ClockIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserActivity {
  id: string;
  userId: string;
  type: string;
  description: string;
  timestamp: string;
  points: number;
  goalId?: string | null;
  goalTitle?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface ActivityStats {
  total: number;
  completed: number;
  inProgress: number;
  points: number;
}

export default function UsersPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userActivities, setUserActivities] = useState<{ [key: string]: UserActivity[] }>({});
  const [stats, setStats] = useState<{ [key: string]: ActivityStats }>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [visibleActivities, setVisibleActivities] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");

  const toggleActivities = (userId: string) => {
    setVisibleActivities(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const fetchUsers = useCallback(async () => {
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
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message || 'Error al cargar los usuarios');
      }

      const data = await response.json() as User[];
      setUsers(data);
      updateStats(data);

      // Obtener actividades para cada usuario
      const activitiesByUser: { [key: string]: UserActivity[] } = {};
      const statsByUser: { [key: string]: ActivityStats } = {};

      for (const user of data) {
        const activitiesResponse = await fetch(`/api/activities/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (activitiesResponse.ok) {
          const activities = await activitiesResponse.json();
          activitiesByUser[user.id] = activities;

          // Calcular estadísticas
          statsByUser[user.id] = {
            total: activities.length,
            completed: activities.filter((a: UserActivity) => a.goalId).length,
            inProgress: activities.filter((a: UserActivity) => !a.goalId).length,
            points: activities.reduce((acc: number, curr: UserActivity) => acc + (curr.points || 0), 0)
          };
        }
      }

      setUserActivities(activitiesByUser);
      setStats(statsByUser);
    } catch (err: unknown) {
      console.error('Error al cargar usuarios:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    fetchUsers();
  }, [authLoading, isAuthenticated, router, fetchUsers]);

  const updateStats = (data: User[]) => {
    const admins = data.filter((user: User) => user.role === 'ADMIN').length;
    setUserStats({
      total: data.length,
      active: data.length - admins,
      inactive: admins
    });
  };

  const handleUsersChange = (newUsers: User[]) => {
    setUsers(newUsers);
    updateStats(newUsers);
  };

  const filteredUsers = users.filter(user => {
    const matchUser = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     user.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (matchUser) return true;

    // Buscar en las actividades del usuario
    const activities = userActivities[user.id] || [];
    return activities.some(activity =>
      activity.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.goalTitle && activity.goalTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

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
        <h1 className="text-2xl font-bold text-gray-800 font-audiowide">Administración de Usuarios</h1>
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

      {isAdmin && <AdminBanner />}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 font-audiowide">Total Usuarios</h3>
          <p className="text-3xl font-bold text-blue-600">{userStats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 font-audiowide">Usuarios Activos</h3>
          <p className="text-3xl font-bold text-green-600">{userStats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 font-audiowide">Usuarios Inactivos</h3>
          <p className="text-3xl font-bold text-purple-600">{userStats.inactive}</p>
        </div>
      </div>

      {/* Vista de actividades por usuario */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, email, rol o actividades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 pr-12 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="relative w-full">
        <div className="overflow-x-auto pb-6">
          <div className="inline-flex gap-6 min-w-full px-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col w-[400px] min-h-[500px]">
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex flex-col items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
                    <p className="text-gray-600 text-sm">{user.email}</p>
                    <span className="mt-2 px-3 py-1 rounded-full text-sm font-medium capitalize" 
                      style={{
                        backgroundColor: user.role === 'ADMIN' ? '#FED7D7' : '#C6F6D5',
                        color: user.role === 'ADMIN' ? '#9B2C2C' : '#276749'
                      }}>
                      {user.role.toLowerCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="text-sm font-medium text-blue-900">Total</h3>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        {stats[user.id]?.total || 0}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="text-sm font-medium text-green-900">Completadas</h3>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        {stats[user.id]?.completed || 0}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                        <h3 className="text-sm font-medium text-yellow-900">En Progreso</h3>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600 mt-2">
                        {stats[user.id]?.inProgress || 0}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-5 w-5 text-purple-600 mr-2" />
                        <h3 className="text-sm font-medium text-purple-900">Puntos</h3>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 mt-2">
                        {stats[user.id]?.points || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => toggleActivities(user.id)}
                      className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none flex items-center justify-center bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      {visibleActivities[user.id] ? (
                        <>
                          <ChevronUpIcon className="h-5 w-5 mr-1" />
                          Ocultar Actividades
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="h-5 w-5 mr-1" />
                          Mostrar Actividades ({userActivities[user.id]?.length || 0})
                        </>
                      )}
                    </button>
                  </div>
                  
                  {visibleActivities[user.id] && (
                    <div className="max-h-[300px] overflow-y-auto px-4">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Descripción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(userActivities[user.id] || []).map((activity) => (
                            <tr key={activity.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(activity.timestamp), 'dd MMM yyyy HH:mm', { locale: es })}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {activity.type}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {activity.type.toLowerCase() === 'llamada' && activity.user && (
                                  <span className="text-blue-600 font-medium mr-1">
                                    {activity.user.name || activity.user.email}:
                                  </span>
                                )}
                                {activity.description}
                              </td>
                            </tr>
                          ))}
                          {(!userActivities[user.id] || userActivities[user.id].length === 0) && (
                            <tr>
                              <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                                No hay actividades registradas
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute left-0 bottom-0 h-6 w-full bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
      </div>

      <div className="mt-8">
        <UserList users={users} onUsersChange={handleUsersChange} isAdmin={isAdmin} />
      </div>
    </div>
  );
}