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
        type: 'MANUAL',
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

  const isUserAdmin = user.role === 'admin';

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
        <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Metas y Objetivos</h3>
                {isAdmin && (
                  <button
                    onClick={() => setIsNewGoalModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    Nueva Meta
                  </button>
                )}
              </div>
              {goals.length === 0 ? (
                <p className="text-gray-500 italic">No hay metas registradas para este usuario.</p>
              ) : (
                <div className="space-y-6">
                  {goals.map((goal) => (
                    <div key={goal.id} className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                      <div className="px-4 py-5 sm:px-6 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                              {goal.title}
                              <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center ${
                                goal.isCompleted 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {goal.isCompleted ? (
                                  <><CheckIcon className="h-3 w-3 mr-1" />Completado</>
                                ) : (
                                  <>En progreso</>
                                )}
                              </span>
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                              Categoría: {goal.category}
                            </p>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setGoalToDelete(goal.id);
                                setIsDeleteGoalModalOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                              title="Eliminar meta"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
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
                                <div className="flex items-center space-x-2">
                                  <div className="flex-grow">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>{goal.currentCount} de {goal.targetCount}</span>
                                      <span>{Math.round((goal.currentCount / goal.targetCount) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${Math.min(100, (goal.currentCount / goal.targetCount) * 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  {isAdmin && !goal.isCompleted && (
                                    <button
                                      onClick={() => handleAddActivity(goal.id)}
                                      className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                                      title="Agregar actividad"
                                    >
                                      <PlusIcon className="h-5 w-5" />
                                    </button>
                                  )}
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
                    </div>
                  ))}
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        {/* New Goal Modal */}
        <Dialog
          open={isNewGoalModalOpen}
          onClose={() => setIsNewGoalModalOpen(false)}
        >
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-black opacity-30"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                        Nueva Meta
                      </Dialog.Title>
                      <div className="mt-2">
                        <form onSubmit={handleNewGoal} className="space-y-4">
                          <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                              Título
                            </label>
                            <input
                              type="text"
                              name="title"
                              id="title"
                              value={newGoalData.title}
                              onChange={(e) => setNewGoalData({ ...newGoalData, title: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                              Descripción
                            </label>
                            <textarea
                              id="description"
                              name="description"
                              rows={3}
                              value={newGoalData.description}
                              onChange={(e) => setNewGoalData({ ...newGoalData, description: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="targetCount" className="block text-sm font-medium text-gray-700">
                              Objetivo (cantidad)
                            </label>
                            <input
                              type="number"
                              name="targetCount"
                              id="targetCount"
                              min="1"
                              value={newGoalData.targetCount}
                              onChange={(e) => setNewGoalData({ ...newGoalData, targetCount: Number(e.target.value) })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                              Categoría
                            </label>
                            <select
                              id="category"
                              name="category"
                              value={newGoalData.category}
                              onChange={(e) => setNewGoalData({ ...newGoalData, category: e.target.value as GoalCategory })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              required
                            >
                              <option value={GoalCategory.GENERAL}>General</option>
                              <option value={GoalCategory.ACTIVITY}>Actividades</option>
                              <option value={GoalCategory.DPV}>DPVs</option>
                              <option value={GoalCategory.NEWS}>Noticias</option>
                              <option value={GoalCategory.BILLED}>Facturación</option>
                              <option value={GoalCategory.ASSIGNMENT}>Encargos</option>
                              <option value={GoalCategory.LOCATED_TENANTS}>Inquilinos Localizados</option>
                              <option value={GoalCategory.ADDED_PHONES}>Teléfonos Añadidos</option>
                              <option value={GoalCategory.EMPTY_PROPERTIES}>Propiedades Vacías</option>
                              <option value={GoalCategory.NEW_PROPERTIES}>Propiedades Nuevas</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                              Fecha límite
                            </label>
                            <input
                              type="date"
                              name="endDate"
                              id="endDate"
                              value={newGoalData.endDate}
                              onChange={(e) => setNewGoalData({ ...newGoalData, endDate: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                              Crear Meta
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsNewGoalModalOpen(false)}
                              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>

        {/* Delete Goal Modal */}
        <Dialog
          open={isDeleteGoalModalOpen}
          onClose={() => setIsDeleteGoalModalOpen(false)}
        >
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-black opacity-30"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                        Eliminar Meta
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          ¿Estás seguro de que deseas eliminar esta meta? Esta acción no se puede deshacer.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleDeleteGoal}
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteGoalModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}