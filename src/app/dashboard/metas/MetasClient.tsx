'use client';

import { useState } from 'react';
import { UserGoal, UserActivity, CreateUserGoalInput } from '@/types/user';
import { createUserGoal, createUserActivity, deleteUserGoal } from './actions';
import { Dialog } from '@headlessui/react';
import { Spinner } from '@/components/ui/Spinner';
import { 
  TrophyIcon, PlusIcon, StarIcon, 
  CheckIcon, ArrowPathIcon, ChartBarIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface MetasClientProps {
  initialGoals: UserGoal[];
  initialActivities: UserActivity[];
}

export default function MetasClient({ initialGoals, initialActivities }: MetasClientProps) {
  const [goals, setGoals] = useState<UserGoal[]>(initialGoals);
  const [activities, setActivities] = useState<UserActivity[]>(initialActivities);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newGoalData, setNewGoalData] = useState<CreateUserGoalInput>({
    title: '',
    description: '',
    targetCount: 5,
    category: 'GENERAL',
  });

  // Crear una nueva meta
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoalData.title.trim()) {
      alert('Por favor ingresa un título para la meta');
      return;
    }
    
    try {
      setIsLoading(true);
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
      await deleteUserGoal(goalToDelete);
      
      // Actualizar la lista de metas
      setGoals(goals.filter(goal => goal.id !== goalToDelete));
      
      // Actualizar la lista de actividades
      setActivities(activities.filter(activity => activity.goalId !== goalToDelete));
      
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
    } catch (error) {
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

  // Renderizar el progreso de una meta como una barra
  const renderProgressBar = (goal: UserGoal) => {
    const progress = goal.progress || Math.floor((goal.currentCount / goal.targetCount) * 100);
    
    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span>{goal.currentCount} de {goal.targetCount}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              goal.isCompleted 
                ? 'bg-green-600' 
                : progress > 66 
                  ? 'bg-blue-600' 
                  : progress > 33 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  // Determinar el ícono para un tipo de actividad
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'PROPERTY_CREATED':
        return <PlusIcon className="h-5 w-5 text-blue-600" />;
      case 'CLIENT_CREATED':
        return <PlusIcon className="h-5 w-5 text-green-600" />;
      case 'ASSIGNMENT_CREATED':
        return <CheckIcon className="h-5 w-5 text-indigo-600" />;
      case 'GOAL_COMPLETED':
        return <StarIcon className="h-5 w-5 text-yellow-500" />;
      case 'MANUAL':
        return <ArrowPathIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <ChartBarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
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
          <div className="bg-indigo-50 p-4 rounded-lg flex items-center">
            <div className="bg-indigo-100 p-3 rounded-full mr-4">
              <TrophyIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-indigo-900">Metas</h3>
              <p className="text-2xl font-bold text-indigo-600">{goals.length}</p>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg flex items-center">
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
          
          <div className="bg-blue-50 p-4 rounded-lg flex items-center">
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
            {goals.map(goal => (
              <div 
                key={goal.id}
                className={`p-4 rounded-lg border ${
                  goal.isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                  <div className="flex space-x-2">
                    {goal.isCompleted && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completado
                      </span>
                    )}
                    <button
                      onClick={() => confirmDeleteGoal(goal.id)}
                      className="text-gray-400 hover:text-red-500"
                      title="Eliminar meta"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {goal.description && (
                  <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                )}
                
                {renderProgressBar(goal)}
                
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => handleAddActivity(goal.id)}
                    disabled={isLoading || goal.isCompleted}
                    className={`inline-flex items-center text-sm px-3 py-1.5 rounded-md ${
                      goal.isCompleted
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    }`}
                  >
                    {isLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Registrar actividad
                      </>
                    )}
                  </button>
                  
                  <span className="text-xs text-gray-500">
                    {new Date(goal.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Sección de actividades recientes */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actividades Recientes</h2>
        
        {activities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay actividades registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map(activity => (
              <div key={activity.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="mr-3">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.description || `Actividad: ${activity.type}`}
                    </p>
                    <div className="flex mt-1 text-xs text-gray-500 items-center">
                      <span>
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      {activity.goalId && (
                        <>
                          <span className="mx-1.5">•</span>
                          <span className="text-primary-600">
                            {goals.find(g => g.id === activity.goalId)?.title || 'Meta'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {activity.points > 0 && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-full">
                      +{activity.points} pts
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
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