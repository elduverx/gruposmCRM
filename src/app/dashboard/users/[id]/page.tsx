'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Tab } from '@headlessui/react';
import { CalendarIcon, FlagIcon, ClockIcon } from '@heroicons/react/24/outline';

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
  relatedId?: string;
  relatedType?: string;
  points: number;
}

interface UserGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetCount: number;
  currentCount: number;
  startDate: string;
  endDate?: string;
  isCompleted: boolean;
  category: string;
  createdAt: string;
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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const { loading: authLoading, isAuthenticated } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [assignedZones, setAssignedZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError('Error al cargar zonas asignadas');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, [userId, setError, setIsLoading, setUser, setActivities, setGoals, setAssignedZones]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    fetchUserData();
  }, [authLoading, isAuthenticated, router, fetchUserData]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/users')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Volver a Usuarios
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Usuario no encontrado</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/users')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Volver a Usuarios
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 font-audiowide">
          Perfil de Usuario: {user.name}
        </h1>
        <button 
          onClick={() => router.push('/dashboard/users')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Volver a Usuarios
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Información del Usuario
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rol</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.role}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Fecha de creación</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString()}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Zonas asignadas</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {assignedZones.length === 0 ? (
                  <span className="text-gray-500 italic">No tiene zonas asignadas</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {assignedZones.map(zone => (
                      <span 
                        key={zone.id} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm"
                        style={{ 
                          backgroundColor: `${zone.color}25`, 
                          color: zone.color,
                          border: `1px solid ${zone.color}`
                        }}
                      >
                        {zone.name}
                      </span>
                    ))}
                  </div>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="w-full px-2 py-4 sm:px-0">
        <Tab.Group>
          <Tab.List className="flex rounded-xl bg-blue-900/20 p-1">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              <ClockIcon className="w-5 h-5 mr-2" />
              Actividades
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              <FlagIcon className="w-5 h-5 mr-2" />
              Metas y Objetivos
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel className="rounded-xl bg-white p-3 shadow-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Actividades</h3>
              {activities.length === 0 ? (
                <p className="text-gray-500 italic">No hay actividades registradas para este usuario.</p>
              ) : (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {activities.map((activity) => (
                      <li key={activity.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <CalendarIcon className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.type}
                            </p>
                            <p className="text-sm text-gray-500">
                              {activity.description || 'Sin descripción'}
                            </p>
                          </div>
                          <div>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Tab.Panel>
            <Tab.Panel className="rounded-xl bg-white p-3 shadow-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Metas y Objetivos</h3>
              {goals.length === 0 ? (
                <p className="text-gray-500 italic">No hay metas registradas para este usuario.</p>
              ) : (
                <div className="space-y-6">
                  {goals.map((goal) => (
                    <div key={goal.id} className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                      <div className="px-4 py-5 sm:px-6 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {goal.title}
                          </h3>
                          <span 
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              goal.isCompleted 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {goal.isCompleted ? 'Completado' : 'En progreso'}
                          </span>
                        </div>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Categoría: {goal.category}
                        </p>
                      </div>
                      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                          {goal.description && (
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {goal.description}
                              </dd>
                            </div>
                          )}
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Progreso</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <div className="flex items-center">
                                <span className="mr-2">{goal.currentCount} / {goal.targetCount}</span>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2.5 rounded-full" 
                                    style={{ width: `${Math.min(100, (goal.currentCount / goal.targetCount) * 100)}%` }}
                                  ></div>
                                </div>
                                <span>{Math.round((goal.currentCount / goal.targetCount) * 100)}%</span>
                              </div>
                            </dd>
                          </div>
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Periodo</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              Desde: {new Date(goal.startDate).toLocaleDateString()}
                              {goal.endDate && ` - Hasta: ${new Date(goal.endDate).toLocaleDateString()}`}
                            </dd>
                          </div>
                        </dl>
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
  );
} 