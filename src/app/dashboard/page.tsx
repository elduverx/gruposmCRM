'use client';

import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  NewspaperIcon, 
  CalendarIcon, 
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  TrophyIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Dialog } from '@/components/ui/dialog';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { createUserActivity, getUserGoals, getUserActivities } from './metas/actions';
import { UserGoal, UserActivity } from '@/types/user';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InicioStats {
  properties: number;
  clients: number;
  assignments: number;
  news: number;
  users?: number;
  pendingActivities?: number;
  completedObjectives?: number;
  totalObjectives?: number;
}

interface Activity {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

interface Objective {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
}

// Definir interfaces para las respuestas de la API
interface CountResponse {
  count: number;
}

export default function InicioPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<InicioStats>({
    properties: 0,
    clients: 0,
    assignments: 0,
    news: 0,
    pendingActivities: 0,
    completedObjectives: 0,
    totalObjectives: 0
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  
  // Estados para el formulario de nueva actividad
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activityFormData, setActivityFormData] = useState({
    description: '',
    type: 'MANUAL',
    goalId: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Obtener estadísticas básicas
        const [propertiesRes, clientsRes, assignmentsRes, newsRes] = await Promise.all([
          fetch('/api/properties/count'),
          fetch('/api/clients/count'),
          fetch('/api/assignments/count'),
          fetch('/api/news/count')
        ]);

        // Usar tipos específicos para las respuestas
        const [properties, clients, assignments, news] = await Promise.all([
          propertiesRes.json() as Promise<CountResponse>,
          clientsRes.json() as Promise<CountResponse>,
          assignmentsRes.json() as Promise<CountResponse>,
          newsRes.json() as Promise<CountResponse>
        ]);

        const newStats: InicioStats = {
          properties: properties.count,
          clients: clients.count,
          assignments: assignments.count,
          news: news.count
        };

        // Solo obtener el conteo de usuarios si el usuario es administrador
        if (user?.role === 'ADMIN') {
          const usersRes = await fetch('/api/users/count', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          const users = await usersRes.json() as CountResponse;
          newStats.users = users.count;
        }

        // Obtener las metas y actividades reales del usuario
        const goals = await getUserGoals();
        const recentActivities = await getUserActivities(10);
        setUserGoals(goals);
        setUserActivities(recentActivities);

        // Actualizar estadísticas de objetivos
        const completedGoals = goals.filter(g => g.isCompleted).length;
        newStats.completedObjectives = completedGoals;
        newStats.totalObjectives = goals.length;

        // Actualizar estadísticas de actividades pendientes
        newStats.pendingActivities = recentActivities.length;

        setStats(newStats);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);

  // Manejar el envío del formulario de actividad
  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createUserActivity({
        goalId: activityFormData.goalId,
        type: activityFormData.type,
        description: activityFormData.description,
      });

      setActivityFormData({
        description: '',
        type: 'MANUAL',
        goalId: ''
      });
      setIsActivityFormOpen(false);
      
      // Actualizar las estadísticas después de crear una actividad
      const newStats = { ...stats };
      newStats.pendingActivities = (stats.pendingActivities || 0) + 1;
      setStats(newStats);
    } catch (error) {
      console.error('Error al crear actividad:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar la adición de actividad a una meta
  const handleAddActivityToGoal = async (goalId: string) => {
    if (!goalId) return;
    
    try {
      setIsLoading(true);
      
      const goalTitle = userGoals.find(g => g.id === goalId)?.title || 'Meta';
      
      const newActivity = await createUserActivity({
        goalId,
        type: 'MANUAL',
        description: `Actividad manual para: ${goalTitle}`,
      });
      
      // Actualizar la lista de actividades
      setUserActivities([newActivity, ...userActivities]);
      
      // Actualizar el progreso de la meta
      setUserGoals(userGoals.map(goal => {
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

      // Actualizar estadísticas
      const updatedGoals = userGoals.map(goal => {
        if (goal.id === goalId) {
          const newCount = goal.currentCount + 1;
          const isCompleted = newCount >= goal.targetCount;
          return {
            ...goal,
            currentCount: newCount,
            isCompleted,
          };
        }
        return goal;
      });
      
      const completedGoals = updatedGoals.filter(g => g.isCompleted).length;
      setStats({
        ...stats,
        completedObjectives: completedGoals,
      });
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al registrar actividad:', error);
      alert('Error al registrar la actividad. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const goalOptions = userGoals.map(goal => ({
    value: goal.id,
    label: goal.title
  }));

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-gray-100"></div>
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
          <div className="card">
            <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de bienvenida */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Aquí tienes un resumen de tu actividad reciente
            </p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => setIsActivityFormOpen(true)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva actividad
          </button>
        </div>
      </div>

      {/* Formulario de nueva actividad */}
      <Dialog
        open={isActivityFormOpen}
        onClose={() => setIsActivityFormOpen(false)}
        title="Nueva Actividad"
      >
        <form onSubmit={handleActivitySubmit} className="space-y-4">
          <div>
            <Select
              label="Meta"
              value={activityFormData.goalId}
              onChange={(e) => setActivityFormData({ ...activityFormData, goalId: e.target.value })}
              options={goalOptions}
              required
            />
          </div>

          <div>
            <Select
              label="Tipo"
              value={activityFormData.type}
              onChange={(e) => setActivityFormData({ ...activityFormData, type: e.target.value })}
              options={[
                { value: 'MANUAL', label: 'Manual' },
                { value: 'AUTOMATIC', label: 'Automática' }
              ]}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <Textarea
              id="description"
              value={activityFormData.description}
              onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
              required
            />
          </div>

          <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsActivityFormOpen(false)}
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
                'Crear Actividad'
              )}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card card-hover cursor-pointer" onClick={() => router.push('/dashboard/properties')}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-50">
              <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inmuebles</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.properties}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpIcon className="h-4 w-4 text-success-500" />
            <span className="ml-1 text-success-600 font-medium">12%</span>
            <span className="ml-2 text-gray-500">vs mes anterior</span>
          </div>
        </div>

        <div className="card card-hover cursor-pointer" onClick={() => router.push('/dashboard/clients')}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-secondary-50">
              <UserGroupIcon className="h-6 w-6 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Clientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.clients}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpIcon className="h-4 w-4 text-success-500" />
            <span className="ml-1 text-success-600 font-medium">8%</span>
            <span className="ml-2 text-gray-500">vs mes anterior</span>
          </div>
        </div>

        <div className="card card-hover cursor-pointer" onClick={() => router.push('/dashboard/progreso')}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-success-50">
              <TrophyIcon className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Objetivos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round((stats.completedObjectives || 0) / (stats.totalObjectives || 1) * 100)}%
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Completados</span>
            <span className="ml-2 font-medium text-success-600">
              {stats.completedObjectives || 0} / {stats.totalObjectives || 0}
            </span>
          </div>
        </div>

        <div className="card card-hover cursor-pointer" onClick={() => router.push('/dashboard/metas')}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-warning-50">
              <ClipboardDocumentListIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingActivities || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Actividades registradas</span>
          </div>
        </div>
      </div>

      {/* Contenedor principal con grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario - Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendario */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Calendario</h3>
              <div className="flex space-x-2">
                <button 
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
                  onClick={() => setDate(new Date())}
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Hoy
                </button>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Ver todo
                </button>
              </div>
            </div>
            <div className="calendar-container">
              <Calendar
                onChange={(value) => {
                  if (value instanceof Date) {
                    setDate(value);
                  }
                }}
                value={date}
                className="w-full border-0 custom-calendar"
                tileClassName={({ date: tileDate }) => {
                  // Añadir clase para días con eventos usando actividades reales
                  const hasEvent = userActivities.some(activity => {
                    const activityDate = new Date(activity.timestamp);
                    return (
                      tileDate.getDate() === activityDate.getDate() &&
                      tileDate.getMonth() === activityDate.getMonth() &&
                      tileDate.getFullYear() === activityDate.getFullYear()
                    );
                  });
                  
                  return hasEvent ? 'event-day' : '';
                }}
                tileContent={({ date: tileDate }) => {
                  // Mostrar indicador de eventos usando actividades reales
                  const dayEvents = userActivities.filter(activity => {
                    const activityDate = new Date(activity.timestamp);
                    return (
                      tileDate.getDate() === activityDate.getDate() &&
                      tileDate.getMonth() === activityDate.getMonth() &&
                      tileDate.getFullYear() === activityDate.getFullYear()
                    );
                  });
                  
                  return dayEvents.length > 0 ? (
                    <div className="event-indicator">
                      <div className="event-dot"></div>
                    </div>
                  ) : null;
                }}
              />
            </div>
          </div>

          {/* Actividades Pendientes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Actividades Recientes</h3>
              <button 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => router.push('/dashboard/metas')}
              >
                Ver todas
              </button>
            </div>
            <div className="space-y-4">
              {userActivities.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No hay actividades recientes</p>
                  <button
                    onClick={() => setIsActivityFormOpen(true)}
                    className="mt-3 text-primary-600 font-medium hover:text-primary-700"
                  >
                    Registrar una actividad
                  </button>
                </div>
              ) : (
                userActivities.slice(0, 5).map((activity) => {
                  const goalTitle = userGoals.find(g => g.id === activity.goalId)?.title || 'Meta desconocida';
                  const isCompleted = Boolean(userGoals.find(g => g.id === activity.goalId)?.isCompleted);
                  
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full ${
                          isCompleted ? 'bg-success-500' : 'bg-primary-500'
                        }`} />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-sm text-gray-500">
                            Meta: {goalTitle} · {format(new Date(activity.timestamp), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          isCompleted
                            ? 'bg-success-100 text-success-700'
                            : 'bg-primary-100 text-primary-700'
                        }`}
                      >
                        {activity.type}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Objetivos - Columna derecha */}
        <div className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Objetivos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Progreso de tus metas personales
              </p>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-500">Progreso:</span>
              <span className="ml-2 font-medium text-primary-600">
                {Math.round((stats.completedObjectives || 0) / (stats.totalObjectives || 1) * 100)}%
              </span>
            </div>
          </div>
          
          {userGoals.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aún no tienes metas creadas</p>
              <button
                onClick={() => router.push('/dashboard/metas')}
                className="mt-3 text-primary-600 font-medium hover:text-primary-700"
              >
                Crear una meta
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {userGoals.slice(0, 5).map((goal) => (
                <div key={goal.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                      <p className="text-xs text-gray-500">{goal.description}</p>
                    </div>
                    {goal.isCompleted ? (
                      <div className="bg-green-100 px-2 py-1 rounded-full text-green-800 text-xs font-medium flex items-center">
                        <CheckIcon className="h-3 w-3 mr-1" />
                        Completada
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddActivityToGoal(goal.id)}
                        disabled={isLoading}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Registrar actividad"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{goal.currentCount} de {goal.targetCount}</span>
                    <span>{goal.progress || Math.floor((goal.currentCount / goal.targetCount) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${goal.isCompleted ? 'bg-green-500' : 'bg-primary-600'} rounded-full transition-all duration-500`}
                      style={{ width: `${goal.progress || Math.floor((goal.currentCount / goal.targetCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => router.push('/dashboard/metas')}
                  className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center"
                >
                  Ver todas mis metas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Añadir estilos CSS personalizados */}
      <style jsx global>{`
        .custom-calendar {
          width: 100%;
          border: none;
          border-radius: 0.5rem;
          box-shadow: none;
          background-color: transparent;
        }
        
        .custom-calendar .react-calendar__navigation {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .custom-calendar .react-calendar__navigation button {
          min-width: 2.5rem;
          background: none;
          font-size: 1rem;
          color: #4f46e5;
          border: none;
          border-radius: 0.25rem;
          padding: 0.5rem;
          transition: all 0.2s ease;
        }
        
        .custom-calendar .react-calendar__navigation button:hover {
          background-color: #e0e7ff;
        }
        
        .custom-calendar .react-calendar__navigation button:disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
        }
        
        .custom-calendar .react-calendar__navigation button.react-calendar__navigation__label {
          flex-grow: 1;
          font-weight: 600;
          color: #111827;
          font-size: 1.125rem;
        }
        
        .custom-calendar .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .custom-calendar .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
        }
        
        .custom-calendar .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }
        
        .custom-calendar .react-calendar__tile {
          padding: 0.75rem 0.5rem;
          background: none;
          text-align: center;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .custom-calendar .react-calendar__tile:hover {
          background-color: #f3f4f6;
        }
        
        .custom-calendar .react-calendar__tile--now {
          background-color: #e0e7ff;
          color: #4f46e5;
          font-weight: 600;
        }
        
        .custom-calendar .react-calendar__tile--active {
          background-color: #4f46e5;
          color: white;
        }
        
        .custom-calendar .react-calendar__tile--active:hover {
          background-color: #4338ca;
        }
        
        .custom-calendar .event-day {
          font-weight: 600;
        }
        
        .custom-calendar .event-indicator {
          position: absolute;
          bottom: 0.25rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
        }
        
        .custom-calendar .event-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background-color: #4f46e5;
        }
        
        .custom-calendar .react-calendar__month-view__days__day--neighboringMonth {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
} 