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
  relatedType?: string;
  goalId?: string | null;
  goalTitle?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface ActivityStats {
  activities: number;
  dpvs: number;
  news: number;
  assignments: number;
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

          // Separar actividades por tipo
          const propertyActivities = activities.filter(a => a.type === 'ACTIVIDAD' || a.relatedType === 'PROPERTY_ACTIVITY');
          const dpvActivities = activities.filter(a => a.type === 'DPV' || a.relatedType === 'PROPERTY_DPV');
          const newsActivities = activities.filter(a => a.type === 'NOTICIA' || a.relatedType === 'PROPERTY_NEWS');
          const assignmentActivities = activities.filter(a => a.type === 'ENCARGO' || a.relatedType === 'PROPERTY_ASSIGNMENT');

          statsByUser[user.id] = {
            activities: propertyActivities.length, // Solo contar actividades de propiedades
            dpvs: dpvActivities.length,
            news: newsActivities.length,
            assignments: assignmentActivities.length
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
      {/* Header modernizado */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">👥</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Administración de Usuarios
                </h1>
                <p className="text-gray-600 mt-1">Gestiona usuarios y supervisa actividades</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={fetchUsers}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl blur opacity-60 group-hover:opacity-80 transition-opacity"></span>
                <span className="relative">🔄 Actualizar</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                ← Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estadísticas modernizadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Usuarios</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {userStats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">👤</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuarios Activos</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {userStats.active}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">✅</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Administradores</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {userStats.inactive}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">👑</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda modernizada */}
      <div className="mb-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm group-focus-within:blur-md transition-all duration-300"></div>
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, email, rol o actividades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-12 pr-12 text-sm bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {searchQuery && (
          <div className="mt-3 px-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              📊 {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full">
        <div className="overflow-x-auto pb-6">
          <div className="inline-flex gap-6 min-w-full px-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="group relative w-[400px] min-h-[500px]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden flex flex-col min-h-[500px] hover:shadow-2xl transition-all duration-300">
                  <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                    <div className="flex flex-col items-start mb-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">{user.email}</p>
                          <span className="mt-2 inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize" 
                            style={{
                              backgroundColor: user.role === 'ADMIN' ? '#FED7D7' : '#C6F6D5',
                              color: user.role === 'ADMIN' ? '#9B2C2C' : '#276749'
                            }}>
                            {user.role === 'ADMIN' ? '👑 Admin' : '👤 Usuario'} 
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/20">
                          <div className="flex items-center mb-2">
                            <span className="text-blue-600 text-lg mr-2">📋</span>
                            <h3 className="text-sm font-medium text-blue-900">Actividades</h3>
                          </div>
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            {stats[user.id]?.activities || 0}
                          </p>
                        </div>
                      </div>

                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/20">
                          <div className="flex items-center mb-2">
                            <span className="text-green-600 text-lg mr-2">📊</span>
                            <h3 className="text-sm font-medium text-green-900">DPVs</h3>
                          </div>
                          <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {stats[user.id]?.dpvs || 0}
                          </p>
                        </div>
                      </div>

                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/20">
                          <div className="flex items-center mb-2">
                            <span className="text-yellow-600 text-lg mr-2">📰</span>
                            <h3 className="text-sm font-medium text-yellow-900">Noticias</h3>
                          </div>
                          <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                            {stats[user.id]?.news || 0}
                          </p>
                        </div>
                      </div>

                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/20">
                          <div className="flex items-center mb-2">
                            <span className="text-purple-600 text-lg mr-2">📦</span>
                            <h3 className="text-sm font-medium text-purple-900">Encargos</h3>
                          </div>
                          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {stats[user.id]?.assignments || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="p-4 border-t border-gray-100/50">
                      <button
                        onClick={() => toggleActivities(user.id)}
                        className="w-full px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none flex items-center justify-center bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl hover:from-blue-100/50 hover:to-purple-100/50 transition-all duration-300 border border-blue-200/30"
                      >
                        {visibleActivities[user.id] ? (
                          <>
                            <ChevronUpIcon className="h-5 w-5 mr-2" />
                            🔼 Ocultar Actividades
                          </>
                        ) : (
                          <>
                            <ChevronDownIcon className="h-5 w-5 mr-2" />
                            🔽 Mostrar Actividades ({userActivities[user.id]?.length || 0})
                          </>
                        )}
                      </button>
                    </div>
                    
                    {visibleActivities[user.id] && (
                      <div className="max-h-[300px] overflow-y-auto px-4">
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                          <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10 rounded-t-xl">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  📅 Fecha
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  🏷️ Tipo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  📝 Descripción
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-gray-200/50">
                              {(userActivities[user.id] || []).map((activity) => (
                                <tr key={activity.id} className="hover:bg-white/50 transition-colors duration-200">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {format(new Date(activity.timestamp), 'dd MMM yyyy HH:mm', { locale: es })}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200/30">
                                      {activity.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
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
                                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                                    <div className="flex flex-col items-center">
                                      <span className="text-4xl mb-2">📭</span>
                                      <span>No hay actividades registradas</span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-gray-100/50">
                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/dashboard/users/${user.id}`)}
                        className="group relative flex-1 px-4 py-3 text-sm font-medium overflow-hidden rounded-xl transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative text-white font-medium">👤 Ver Perfil</span>
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/users/${user.id}?tab=goals`)}
                        className="group relative flex-1 px-4 py-3 text-sm font-medium overflow-hidden rounded-xl transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative text-white font-medium">🎯 Ver Metas</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute left-0 bottom-0 h-6 w-full bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
      </div>
        
      {isAdmin && <AdminBanner />}
      
      {error && (
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl blur-sm"></div>
          <div className="relative bg-red-50/90 backdrop-blur-sm border border-red-200/50 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <UserList users={users} onUsersChange={handleUsersChange} isAdmin={isAdmin} />
      </div>
    </div>
  );
}