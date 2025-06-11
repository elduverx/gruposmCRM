'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Tab } from '@headlessui/react';
import { CalendarIcon, FlagIcon, ClockIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { GoalCategory } from '@prisma/client';
import { createUserGoal, deleteUserGoal, createUserActivity } from '../../metas/actions';
import { toast } from 'sonner';

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
  description?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
  relatedId?: string | null;
  relatedType?: string | null;
  points: number;
  goalId?: string | null;
  goalTitle?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface UserGoal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  targetCount: number;
  currentCount: number;
  startDate: string;
  endDate?: string | null;
  isCompleted: boolean;
  category: GoalCategory;
  createdAt: string;
  updatedAt: string;
  activities?: UserActivity[];
  progress?: number;
}

interface Zone {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  coordinates: { lat: number; lng: number }[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreateGoalInput {
  title: string;
  description?: string;
  targetCount: number;
  category: GoalCategory;
  endDate?: string;
  userId?: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const defaultTab = searchParams.get('tab') === 'goals' ? 1 : 0;
  const userId = params?.id as string;
  const { loading: authLoading, isAuthenticated, isAdmin } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [assignedZones, setAssignedZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(defaultTab);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [isDeleteGoalModalOpen, setIsDeleteGoalModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [newGoalData, setNewGoalData] = useState<CreateGoalInput>({
    title: '',
    description: '',
    targetCount: 5,
    category: GoalCategory.GENERAL,
    endDate: ''
  });

  const fetchUserData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No se encontró el token de autenticación');
        return;
      }

      // Fetch user details
      const userResponse = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Error al cargar los datos del usuario');
      }

      const userData = await userResponse.json() as User;
      setUser(userData);

      // Fetch user activities
      const activitiesResponse = await fetch(`/api/activities/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json() as UserActivity[];
        setActivities(activitiesData);
      }

      // Fetch user goals
      const goalsResponse = await fetch(`/api/goals/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json() as UserGoal[];
        setGoals(goalsData);
      }

      // Fetch zones assigned to the user
      try {
        const zonesResponse = await fetch(`/api/zones/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json() as Zone[];
          setAssignedZones(zonesData);
        }
      } catch (zonesError) {
        console.error('Error loading zones:', zonesError);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    fetchUserData();
  }, [authLoading, isAuthenticated, router, fetchUserData]);

  const handleAddActivity = async (goalId: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Find the goal
      const goal = goals.find(g => g.id === goalId);
      if (!goal) {
        throw new Error('Meta no encontrada');
      }

      // Create a manual activity for the goal
      const activity = await createUserActivity({
        goalId,
        type: 'OTROS',
        description: 'Actividad registrada manualmente por el administrador',
        points: 1,
        timestamp: new Date()
      });

      // Add activity to list
      setActivities([activity, ...activities]);

      // Refresh goal data
      const updatedGoalResponse = await fetch(`/api/goals/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (updatedGoalResponse.ok) {
        const updatedGoals = await updatedGoalResponse.json();
        setGoals(updatedGoals);
      }

      toast.success('Actividad registrada correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar la actividad');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      
      const goal = await createUserGoal({
        ...newGoalData
      });
      
      setGoals(prev => [...prev, goal]);
      setNewGoalData({
        title: '',
        description: '',
        targetCount: 5,
        category: GoalCategory.GENERAL,
        endDate: ''
      });
      setIsNewGoalModalOpen(false);
      
      toast.success('Meta creada correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear la meta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      setIsLoading(true);
      await deleteUserGoal(goalToDelete);
      
      // Update goals list
      setGoals(prev => prev.filter(g => g.id !== goalToDelete));
      
      setGoalToDelete(null);
      setIsDeleteGoalModalOpen(false);
      
      toast.success('Meta eliminada correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la meta');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
          </div>
          <p className="text-slate-700 text-lg font-medium">👤 Cargando perfil de usuario...</p>
          <p className="text-slate-500 text-sm mt-2">Obteniendo información detallada</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="container mx-auto py-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-3xl blur-sm"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">⚠️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-700 font-audiowide">Error al cargar usuario</h2>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/dashboard/users')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                ← Volver a Usuarios
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="container mx-auto py-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-3xl blur-sm"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">👤</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-yellow-700 font-audiowide">Usuario no encontrado</h2>
                  <p className="text-yellow-600">El usuario solicitado no existe en el sistema</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/dashboard/users')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                ← Volver a Usuarios
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isUserAdmin = user.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto py-8 space-y-8">
        {/* Enhanced Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-audiowide">
                    👤 {user.name}
                  </h1>
                  <p className="text-slate-600">Perfil detallado de usuario</p>
                  <span className={`mt-2 inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    isUserAdmin 
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800' 
                      : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                  }`}>
                    {isUserAdmin ? '👑 Administrador' : '👤 Usuario'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => router.push('/dashboard/users')}
                className="px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-700 rounded-xl border border-slate-200 hover:bg-white hover:shadow-lg transition-all duration-300 font-medium"
              >
                ← Volver a Usuarios
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced User Information Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-blue-50/50 rounded-3xl blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 p-6 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-slate-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 font-audiowide">📋 Información del Usuario</h3>
                  <p className="text-slate-600 text-sm">Datos personales y configuración</p>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-2 rounded-lg shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">👤 Nombre completo</p>
                        <p className="font-bold text-blue-800">{user.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">📧 Correo electrónico</p>
                        <p className="font-bold text-purple-800">{user.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 4v6m-4-6h8m-8 0H4a1 1 0 00-1 1v8a1 1 0 001 1h16a1 1 0 001-1v-8a1 1 0 00-1-1H4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">📅 Fecha de registro</p>
                        <p className="font-bold text-green-800">
                          {new Date(user.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-orange-500 to-yellow-600 p-2 rounded-lg shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-orange-600 font-medium">🗺️ Zonas asignadas</p>
                        {assignedZones.length === 0 ? (
                          <p className="text-orange-700 italic text-sm">No tiene zonas asignadas</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {assignedZones.map(zone => (
                              <span 
                                key={zone.id} 
                                className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium shadow-lg"
                                style={{ 
                                  backgroundColor: `${zone.color}25`, 
                                  color: zone.color,
                                  border: `1px solid ${zone.color}`
                                }}
                              >
                                📍 {zone.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-purple-50/50 rounded-3xl blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden">
            <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
              {/* Enhanced Tab List */}
              <Tab.List className="flex bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-2 rounded-t-3xl">
                <Tab
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-xl py-3 px-4 text-sm font-medium leading-5 flex items-center justify-center transition-all duration-300',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                      selected
                        ? 'bg-white shadow-lg text-blue-700 border border-white/20'
                        : 'text-slate-600 hover:bg-white/50 hover:text-blue-700'
                    )
                  }
                >
                  <ClockIcon className="w-5 h-5 mr-2" />
                  📋 Actividades ({activities.length})
                </Tab>
                <Tab
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-xl py-3 px-4 text-sm font-medium leading-5 flex items-center justify-center transition-all duration-300',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                      selected
                        ? 'bg-white shadow-lg text-purple-700 border border-white/20'
                        : 'text-slate-600 hover:bg-white/50 hover:text-purple-700'
                    )
                  }
                >
                  <FlagIcon className="w-5 h-5 mr-2" />
                  🎯 Metas ({goals.length})
                </Tab>
              </Tab.List>

              {/* Enhanced Tab Panels */}
              <Tab.Panels className="p-6">
                {/* Activities Panel */}
                <Tab.Panel className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                      <ClockIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 font-audiowide">📋 Historial de Actividades</h3>
                      <p className="text-slate-600 text-sm">Registro completo de actividades del usuario</p>
                    </div>
                  </div>

                  {activities.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-3xl blur-sm"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
                          <div className="text-6xl mb-4">📋</div>
                          <h4 className="text-lg font-semibold text-slate-700 mb-2">No hay actividades registradas</h4>
                          <p className="text-slate-500">Las actividades del usuario aparecerán aquí una vez que se registren</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-2 rounded-xl shadow-lg">
                                  <CalendarIcon className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-bold text-slate-800">
                                    📌 {activity.type}
                                  </p>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800">
                                    {new Date(activity.timestamp).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600">
                                  {activity.description || 'Sin descripción adicional'}
                                </p>
                                {activity.goalTitle && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    🎯 Meta: {activity.goalTitle}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1 rounded-full">
                                  <span className="text-green-800 text-sm font-medium">
                                    +{activity.points} pts
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Tab.Panel>

                {/* Goals Panel */}
                <Tab.Panel className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
                        <FlagIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 font-audiowide">🎯 Metas y Objetivos</h3>
                        <p className="text-slate-600 text-sm">Seguimiento de progreso y objetivos</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => setIsNewGoalModalOpen(true)}
                        className="group relative px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative flex items-center space-x-2">
                          <PlusIcon className="h-5 w-5" />
                          <span>🆕 Nueva Meta</span>
                        </span>
                      </button>
                    )}
                  </div>

                  {goals.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-3xl blur-sm"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
                          <div className="text-6xl mb-4">🎯</div>
                          <h4 className="text-lg font-semibold text-slate-700 mb-2">No hay metas registradas</h4>
                          <p className="text-slate-500">Las metas del usuario aparecerán aquí una vez que se creen</p>
                          {isAdmin && (
                            <button
                              onClick={() => setIsNewGoalModalOpen(true)}
                              className="mt-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                            >
                              🆕 Crear primera meta
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {goals.map((goal) => (
                        <div key={goal.id} className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
                            {/* Goal Header */}
                            <div className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 p-6 border-b border-white/20">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="text-lg font-bold text-slate-800 font-audiowide">
                                      🎯 {goal.title}
                                    </h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg inline-flex items-center ${
                                      goal.isCompleted 
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                                        : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                                    }`}>
                                      {goal.isCompleted ? (
                                        <><CheckIcon className="h-3 w-3 mr-1" />✅ Completado</>
                                      ) : (
                                        <>⏳ En progreso</>
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600">
                                    📂 Categoría: {goal.category}
                                  </p>
                                  {goal.description && (
                                    <p className="text-sm text-slate-500 mt-2">
                                      📝 {goal.description}
                                    </p>
                                  )}
                                </div>
                                {isAdmin && (
                                  <button
                                    onClick={() => {
                                      setGoalToDelete(goal.id);
                                      setIsDeleteGoalModalOpen(true);
                                    }}
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:text-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 opacity-0 group-hover:opacity-100"
                                    title="Eliminar meta"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Goal Content */}
                            <div className="p-6 space-y-4">
                              {/* Progress Section */}
                              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-sm font-bold text-slate-700">📊 Progreso actual</p>
                                  {isAdmin && !goal.isCompleted && (
                                    <button
                                      onClick={() => handleAddActivity(goal.id)}
                                      className="p-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 hover:text-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                      title="Agregar actividad"
                                    >
                                      <PlusIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">{goal.currentCount} de {goal.targetCount} completado</span>
                                    <span className="font-bold text-blue-700">{Math.round((goal.currentCount / goal.targetCount) * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
                                    <div 
                                      className="bg-gradient-to-r from-blue-500 to-cyan-600 h-3 rounded-full shadow-lg transition-all duration-500" 
                                      style={{ width: `${Math.min(100, (goal.currentCount / goal.targetCount) * 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              {/* Period Section */}
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                                <p className="text-sm font-bold text-green-700 mb-2">📅 Período de la meta</p>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-green-600">🚀 Inicio:</span>
                                    <span className="font-medium text-green-800">
                                      {new Date(goal.startDate).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  {goal.endDate && (
                                    <div className="flex justify-between">
                                      <span className="text-green-600">🏁 Límite:</span>
                                      <span className="font-medium text-green-800">
                                        {new Date(goal.endDate).toLocaleDateString('es-ES', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>

        {/* Enhanced New Goal Modal */}
        <Dialog
          open={isNewGoalModalOpen}
          onClose={() => setIsNewGoalModalOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto w-full max-w-lg bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
              <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl shadow-lg">
                    <FlagIcon className="w-5 h-5 text-white" />
                  </div>
                  <Dialog.Title className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                    🆕 Nueva Meta
                  </Dialog.Title>
                </div>
                <button
                  onClick={() => setIsNewGoalModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleNewGoal} className="space-y-4">
                  {/* Title Field */}
                  <div className="group relative">
                    <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                      🎯 Título de la meta
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={newGoalData.title}
                      onChange={(e) => setNewGoalData({ ...newGoalData, title: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent shadow-lg transition-all duration-300"
                      placeholder="Ej: Completar 10 actividades de prospección"
                      required
                    />
                  </div>

                  {/* Description Field */}
                  <div className="group relative">
                    <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                      📝 Descripción (opcional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={newGoalData.description}
                      onChange={(e) => setNewGoalData({ ...newGoalData, description: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent shadow-lg transition-all duration-300"
                      placeholder="Describe el objetivo de esta meta..."
                    />
                  </div>

                  {/* Target Count and Category Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group relative">
                      <label htmlFor="targetCount" className="block text-sm font-semibold text-slate-700 mb-2">
                        🎯 Objetivo (cantidad)
                      </label>
                      <input
                        type="number"
                        name="targetCount"
                        id="targetCount"
                        min="1"
                        value={newGoalData.targetCount}
                        onChange={(e) => setNewGoalData({ ...newGoalData, targetCount: Number(e.target.value) })}
                        className="w-full px-4 py-3 text-sm bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent shadow-lg transition-all duration-300"
                        required
                      />
                    </div>

                    <div className="group relative">
                      <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-2">
                        📂 Categoría
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={newGoalData.category}
                        onChange={(e) => setNewGoalData({ ...newGoalData, category: e.target.value as GoalCategory })}
                        className="w-full px-4 py-3 text-sm bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent shadow-lg transition-all duration-300 appearance-none"
                        required
                      >
                        <option value={GoalCategory.GENERAL}>📋 General</option>
                        <option value={GoalCategory.ACTIVITY}>🏃 Actividades</option>
                        <option value={GoalCategory.DPV}>📊 DPVs</option>
                        <option value={GoalCategory.NEWS}>📰 Noticias</option>
                        <option value={GoalCategory.BILLED}>💰 Facturación</option>
                        <option value={GoalCategory.ASSIGNMENT}>📦 Encargos</option>
                        <option value={GoalCategory.LOCATED_TENANTS}>🏠 Inquilinos Localizados</option>
                        <option value={GoalCategory.ADDED_PHONES}>📞 Teléfonos Añadidos</option>
                        <option value={GoalCategory.EMPTY_PROPERTIES}>🏚️ Propiedades Vacías</option>
                        <option value={GoalCategory.NEW_PROPERTIES}>🆕 Propiedades Nuevas</option>
                        <option value={GoalCategory.LOCATED_PROPERTIES}>📍 Propiedades Localizadas</option>
                      </select>
                    </div>
                  </div>

                  {/* End Date Field */}
                  <div className="group relative">
                    <label htmlFor="endDate" className="block text-sm font-semibold text-slate-700 mb-2">
                      📅 Fecha límite (opcional)
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      id="endDate"
                      value={newGoalData.endDate}
                      onChange={(e) => setNewGoalData({ ...newGoalData, endDate: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent shadow-lg transition-all duration-300"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsNewGoalModalOpen(false)}
                      className="px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 hover:shadow-lg transition-all duration-300 font-medium"
                    >
                      ❌ Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative">
                        {isLoading ? '⏳ Creando...' : '🆕 Crear Meta'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Enhanced Delete Goal Modal */}
        <Dialog
          open={isDeleteGoalModalOpen}
          onClose={() => setIsDeleteGoalModalOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-md w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
              <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 p-2 rounded-xl shadow-lg">
                    <TrashIcon className="w-5 h-5 text-white" />
                  </div>
                  <Dialog.Title className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                    🗑️ Eliminar Meta
                  </Dialog.Title>
                </div>
                <button
                  onClick={() => setIsDeleteGoalModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar esta meta?</h3>
                  <p className="text-slate-600 text-sm">
                    Esta acción no se puede deshacer. Se perderán todos los datos asociados a esta meta.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteGoalModalOpen(false)}
                    className="px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 hover:shadow-lg transition-all duration-300 font-medium"
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteGoal}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '⏳ Eliminando...' : '🗑️ Eliminar'}
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
