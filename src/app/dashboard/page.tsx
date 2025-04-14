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
  PlusIcon
} from "@heroicons/react/24/outline";
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [date, setDate] = useState<Date>(new Date());

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

        // Simular datos de actividades pendientes (en un sistema real, esto vendría de una API)
        const mockActivities: Activity[] = [
          { id: '1', title: 'Reunión con cliente', date: '2023-06-15', completed: false },
          { id: '2', title: 'Visita a propiedad', date: '2023-06-18', completed: false },
          { id: '3', title: 'Llamada de seguimiento', date: '2023-06-20', completed: false },
          { id: '4', title: 'Envío de documentación', date: '2023-06-22', completed: false },
          { id: '5', title: 'Actualización de base de datos', date: '2023-06-25', completed: false }
        ];
        setActivities(mockActivities);
        newStats.pendingActivities = mockActivities.filter(a => !a.completed).length;

        // Simular datos de objetivos (en un sistema real, esto vendría de una API)
        const mockObjectives: Objective[] = [
          { id: '1', title: 'Inmuebles visitados', target: 20, current: 15, unit: 'inmuebles' },
          { id: '2', title: 'Clientes nuevos', target: 10, current: 7, unit: 'clientes' },
          { id: '3', title: 'Encargos completados', target: 30, current: 22, unit: 'encargos' }
        ];
        setObjectives(mockObjectives);
        newStats.completedObjectives = mockObjectives.filter(o => o.current >= o.target).length;
        newStats.totalObjectives = mockObjectives.length;

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
          <button className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva actividad
          </button>
        </div>
      </div>

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

        <div className="card card-hover cursor-pointer" onClick={() => router.push('/dashboard/assignments')}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-warning-50">
              <ClipboardDocumentListIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Encargos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.assignments}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowDownIcon className="h-4 w-4 text-danger-500" />
            <span className="ml-1 text-danger-600 font-medium">3%</span>
            <span className="ml-2 text-gray-500">vs mes anterior</span>
          </div>
        </div>

        <div className="card card-hover cursor-pointer" onClick={() => router.push('/dashboard/news')}>
            <div className="flex items-center">
            <div className="p-3 rounded-lg bg-success-50">
              <NewspaperIcon className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Noticias</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.news}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpIcon className="h-4 w-4 text-success-500" />
            <span className="ml-1 text-success-600 font-medium">15%</span>
            <span className="ml-2 text-gray-500">vs mes anterior</span>
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
                  // Añadir clase para días con eventos (simulado)
                  const hasEvent = activities.some(activity => {
                    const activityDate = new Date(activity.date);
                    return (
                      tileDate.getDate() === activityDate.getDate() &&
                      tileDate.getMonth() === activityDate.getMonth() &&
                      tileDate.getFullYear() === activityDate.getFullYear()
                    );
                  });
                  
                  return hasEvent ? 'event-day' : '';
                }}
                tileContent={({ date: tileDate }) => {
                  // Mostrar indicador de eventos (simulado)
                  const dayEvents = activities.filter(activity => {
                    const activityDate = new Date(activity.date);
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
              <h3 className="text-lg font-semibold text-gray-900">Actividades Pendientes</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Ver todas
              </button>
            </div>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.completed ? 'bg-success-500' : 'bg-warning-500'
                    }`} />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                  <button
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      activity.completed
                        ? 'bg-success-100 text-success-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}
                  >
                    {activity.completed ? 'Completada' : 'Pendiente'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Objetivos - Columna derecha */}
        <div className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Objetivos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Progreso de tus objetivos del mes
              </p>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-500">Progreso:</span>
              <span className="ml-2 font-medium text-primary-600">
                {Math.round((stats.completedObjectives || 0) / (stats.totalObjectives || 1) * 100)}%
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {objectives.map((objective) => (
              <div key={objective.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{objective.title}</p>
                  <p className="text-sm text-gray-500">
                    {objective.current} / {objective.target} {objective.unit}
                  </p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${(objective.current / objective.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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