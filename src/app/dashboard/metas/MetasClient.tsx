'use client';

import { useState, useEffect } from 'react';
import { UserGoal, UserActivity, CreateUserGoalInput, User } from '@/types/user';
import { createUserGoal, createUserActivity, deleteUserGoal } from './actions';
import { Dialog } from '@headlessui/react';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  TrophyIcon, PlusIcon, StarIcon, 
  CheckIcon, ArrowPathIcon, ChartBarIcon,
  TrashIcon, UserIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MetasClientProps {
  initialGoals: UserGoal[];
  initialActivities: UserActivity[];
}

export default function MetasClient({ initialGoals, initialActivities }: MetasClientProps) {
  const [goals, setGoals] = useState<UserGoal[]>(initialGoals);
  const [activities, setActivities] = useState<UserActivity[]>(initialActivities);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);
  const [goalContributors, setGoalContributors] = useState<{[key: string]: number}>({});
  const [selectedStatCard, setSelectedStatCard] = useState<'goals' | 'completed' | 'activities' | null>(null);
  const [newGoalData, setNewGoalData] = useState<CreateUserGoalInput>({
    title: '',
    description: '',
    targetCount: 5,
    category: 'GENERAL',
  });
  const [userActivityCounts, setUserActivityCounts] = useState<{[key: string]: number}>({});

  // Cargar usuarios y contar actividades por usuario
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Error response:', {
            status: response.status,
            statusText: response.statusText,
            data
          });
          throw new Error(data.message || 'Error al cargar usuarios');
        }
        
        setUsers(data);

        // Contar actividades por usuario después de cargar usuarios
        const counts: {[key: string]: number} = {};
        activities.forEach(activity => {
          if (!counts[activity.userId]) {
            counts[activity.userId] = 0;
          }
          counts[activity.userId]++;
        });
        setUserActivityCounts(counts);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };

    fetchUsers();
  }, [activities]);

  // Cargar actividades del usuario seleccionado
  useEffect(() => {
    const fetchUserActivities = async () => {
      if (!selectedUser) return;

      try {
        const response = await fetch(`/api/activities/user/${selectedUser}`);
        if (!response.ok) throw new Error('Error al cargar actividades');
        const data = await response.json();
        setUserActivities(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchUserActivities();
  }, [selectedUser]);

  // Cargar contribuidores de cada meta
  useEffect(() => {
    const fetchGoalContributors = async () => {
      try {
        const contributors: {[key: string]: number} = {};
        
        // Agrupar actividades por usuario para cada meta
        activities.forEach(activity => {
          if (activity.goalId) {
            if (!contributors[activity.goalId]) {
              contributors[activity.goalId] = 0;
            }
            contributors[activity.goalId]++;
          }
        });
        
        setGoalContributors(contributors);
      } catch (error) {
        console.error('Error al cargar contribuidores:', error);
      }
    };

    fetchGoalContributors();
  }, [activities]);

  // Crear una nueva meta
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoalData.title.trim()) {
      alert('Por favor ingresa un título para la meta');
      return;
    }
    
    try {
      setIsLoading(true);
      // eslint-disable-next-line no-console
      console.log('Creando meta:', newGoalData);
      const newGoal = await createUserGoal(newGoalData);
      setGoals([newGoal, ...goals]);
      setIsNewGoalModalOpen(false);
      setNewGoalData({
        title: '',
        description: '',
        targetCount: 5,
        category: 'GENERAL',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al crear meta:', error);
      alert('Error al crear la meta. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Registrar una nueva actividad manualmente
  const handleAddActivity = async (goalId: string) => {
    try {
      setIsLoading(true);
      
      const goalTitle = goals.find(g => g.id === goalId)?.title || 'Meta';
      
      const newActivity = await createUserActivity({
        goalId,
        type: 'MANUAL',
        description: `Actividad manual para: ${goalTitle}`,
      });
      
      // Actualizar la lista de actividades
      setActivities([newActivity, ...activities]);
      
      // Actualizar el progreso de la meta
      setGoals(goals.map(goal => {
        if (goal.id === goalId) {
          const newCount = goal.currentCount + 1;
          const isCompleted = newCount >= goal.targetCount;
          return {
            ...goal,
            currentCount: newCount,
            isCompleted,
            progress: Math.min(Math.floor((newCount / goal.targetCount) * 100), 100),
          };
        }
        return goal;
      }));
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al registrar actividad:', error);
      alert('Error al registrar la actividad. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar una meta
  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      setIsLoading(true);
      // eslint-disable-next-line no-console
      console.log('Eliminando meta:', goalToDelete);
      await deleteUserGoal(goalToDelete);
      
      // Actualizar la lista de metas
      setGoals(goals.filter(goal => goal.id !== goalToDelete));
      
      // Actualizar la lista de actividades
      setActivities(activities.filter(activity => activity.goalId !== goalToDelete));
      
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al eliminar meta:', error);
      alert('Error al eliminar la meta. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir diálogo de confirmación de eliminación
  const confirmDeleteGoal = (goalId: string) => {
    setGoalToDelete(goalId);
    setIsDeleteModalOpen(true);
  };

  // Renderizar el detalle de una meta
  const renderGoalDetail = (goal: UserGoal) => {
    const goalActivities = activities.filter(a => a.goalId === goal.id);
    const uniqueContributors = new Set(goalActivities.map(a => a.userId)).size;
    
    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {uniqueContributors} {uniqueContributors === 1 ? 'contribuidor' : 'contribuidores'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {goalActivities.length} actividades registradas
            </span>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Últimas actividades</h4>
          <div className="space-y-2">
            {goalActivities.slice(0, 5).map(activity => (
              <div key={activity.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">
                    {users.find(u => u.id === activity.userId)?.name || 'Usuario'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">
                    {format(new Date(activity.timestamp), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
                <span className="text-gray-600">{activity.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar una tarjeta de meta
  const renderGoalCard = (goal: UserGoal) => {
    const isSelected = selectedGoal?.id === goal.id;
    const progress = goal.progress || Math.floor((goal.currentCount / goal.targetCount) * 100);
    
    return (
      <div 
        key={goal.id}
        className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
        }`}
        onClick={() => setSelectedGoal(isSelected ? null : goal)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
            {goal.description && (
              <p className="mt-1 text-sm text-gray-500">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddActivity(goal.id);
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Agregar actividad"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                confirmDeleteGoal(goal.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Eliminar meta"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span>{goal.currentCount} de {goal.targetCount}</span>
          <span>{progress}%</span>
        </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        </div>

        {isSelected && renderGoalDetail(goal)}
      </div>
    );
  };

  // Renderizar el detalle de las estadísticas
  const renderStatDetails = () => {
    if (!selectedStatCard) return null;

    const completedGoals = goals.filter(g => g.isCompleted);
    const inProgressGoals = goals.filter(g => !g.isCompleted);

    switch (selectedStatCard) {
      case 'goals':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Todas las Metas</h3>
            <div className="grid gap-4">
              {goals.map(goal => {
                const progress = goal.progress || Math.floor((goal.currentCount / goal.targetCount) * 100);
                return (
                  <div key={goal.id} className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        <p className="text-sm text-gray-500">{goal.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        goal.isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {goal.isCompleted ? 'Completada' : 'En progreso'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{goal.currentCount} de {goal.targetCount}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Metas Completadas</h3>
            <div className="grid gap-4">
              {completedGoals.map(goal => {
                const progress = goal.progress || Math.floor((goal.currentCount / goal.targetCount) * 100);
                return (
                  <div key={goal.id} className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        <p className="text-sm text-gray-500">{goal.description}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completada
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{goal.currentCount} de {goal.targetCount}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Completada el: {format(new Date(goal.updatedAt), 'dd MMM yyyy', { locale: es })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Todas las Actividades</h3>
            <div className="grid gap-4">
              {activities.map(activity => (
                <div key={activity.id} className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {goals.find(g => g.id === activity.goalId)?.title || 'Meta no encontrada'}
                      </h4>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {activity.type}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Por: {users.find(u => u.id === activity.userId)?.name || 'Usuario'}
                    </span>
                    <span>
                      {format(new Date(activity.timestamp), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="activities">Actividades</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>
        <TabsContent value="goals">
        <div className="space-y-8">
          {/* Sección de progreso general */}
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Mi Progreso</h2>
              <button
                onClick={() => setIsNewGoalModalOpen(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Meta
              </button>
            </div>
            
            {/* Estadísticas generales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div 
                  className="bg-indigo-50 p-4 rounded-lg flex items-center cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => setSelectedStatCard('goals')}
                >
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <TrophyIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-indigo-900">Metas</h3>
                  <p className="text-2xl font-bold text-indigo-600">{goals.length}</p>
                </div>
              </div>
              
                <div 
                  className="bg-green-50 p-4 rounded-lg flex items-center cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => setSelectedStatCard('completed')}
                >
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <CheckIcon className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-900">Completadas</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {goals.filter(g => g.isCompleted).length}
                  </p>
                </div>
              </div>
              
                <div 
                  className="bg-blue-50 p-4 rounded-lg flex items-center cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => setSelectedStatCard('activities')}
                >
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-blue-900">Actividades</h3>
                  <p className="text-2xl font-bold text-blue-600">{activities.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección de metas */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mis Metas</h2>
            
            {goals.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Aún no tienes metas creadas</p>
                <button
                  onClick={() => setIsNewGoalModalOpen(true)}
                  className="mt-3 text-primary-600 font-medium hover:text-primary-700"
                >
                  Crear una meta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {goals.map(renderGoalCard)}
              </div>
            )}
          </div>
        </div>
        </TabsContent>
        <TabsContent value="activities">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Todas las Actividades</h2>
          <div className="grid gap-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(activity.timestamp), 'PPP', { locale: es })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">+{activity.points} puntos</p>
                  <p className="text-sm text-gray-500">{activity.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </TabsContent>
        <TabsContent value="users">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Actividades por Usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Seleccionar Usuario</h3>
              <select
                className="w-full p-2 border rounded-lg"
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Selecciona un usuario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>

              {/* Lista de usuarios con contador de actividades */}
              <div className="mt-4 space-y-3">
                <h3 className="font-medium">Contadores de Actividades</h3>
                {users.map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <span>{user.name}</span>
                    </div>
                    <div 
                      className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-medium cursor-pointer hover:bg-blue-200 transition-colors"
                      onClick={() => setSelectedUser(user.id)}
                      title="Ver actividades de este usuario"
                    >
                      {userActivityCounts[user.id] || 0} actividades
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {selectedUser && userActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(activity.timestamp), 'PPP', { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">+{activity.points} puntos</p>
                    <p className="text-sm text-gray-500">{activity.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </TabsContent>
      </Tabs>

      {/* Modal para mostrar detalles de estadísticas */}
      <Dialog
        open={selectedStatCard !== null}
        onClose={() => setSelectedStatCard(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <Dialog.Title className="text-lg font-medium">
                {selectedStatCard === 'goals' && 'Todas las Metas'}
                {selectedStatCard === 'completed' && 'Metas Completadas'}
                {selectedStatCard === 'activities' && 'Todas las Actividades'}
              </Dialog.Title>
              <button
                onClick={() => setSelectedStatCard(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {renderStatDetails()}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal para crear nueva meta */}
      <Dialog
        open={isNewGoalModalOpen}
        onClose={() => setIsNewGoalModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <Dialog.Title className="text-lg font-medium">
                Crear Nueva Meta
              </Dialog.Title>
              <button
                onClick={() => setIsNewGoalModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  type="text"
                  id="title"
                  value={newGoalData.title}
                  onChange={e => setNewGoalData({...newGoalData, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción (opcional)
                </label>
                <textarea
                  id="description"
                  value={newGoalData.description}
                  onChange={e => setNewGoalData({...newGoalData, description: e.target.value})}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="targetCount" className="block text-sm font-medium text-gray-700">
                  Objetivo (número de actividades)
                </label>
                <input
                  type="number"
                  id="targetCount"
                  min={1}
                  max={100}
                  value={newGoalData.targetCount}
                  onChange={e => setNewGoalData({...newGoalData, targetCount: parseInt(e.target.value)})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Categoría
                </label>
                <select
                  id="category"
                  value={newGoalData.category}
                  onChange={e => setNewGoalData({...newGoalData, category: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="GENERAL">General</option>
                  <option value="PROPERTY">Propiedades</option>
                  <option value="CLIENT">Clientes</option>
                  <option value="ASSIGNMENT">Encargos</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  Fecha límite (opcional)
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={newGoalData.endDate}
                  onChange={e => setNewGoalData({...newGoalData, endDate: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              
              <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewGoalModalOpen(false)}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {isLoading ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    'Crear Meta'
                  )}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
      
      {/* Modal para eliminar meta */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-lg">
            <div className="p-6">
              <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                Eliminar Meta
              </Dialog.Title>
              
              <p className="text-gray-600 mb-6">
                ¿Estás seguro que deseas eliminar esta meta? Esta acción no se puede deshacer.
                Se eliminarán también todas las actividades asociadas a esta meta.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteGoal}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {isLoading ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 