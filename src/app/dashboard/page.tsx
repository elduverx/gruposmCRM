'use client';

import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  CalendarIcon, 
  ArrowUpIcon,
  PlusIcon,
  TrophyIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  BanknotesIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  EyeIcon,
  BoltIcon,
  CursorArrowRaysIcon,
  BookmarkIcon
} from "@heroicons/react/24/outline";
import { 
  BuildingOfficeIcon as BuildingOfficeSolid, 
  UserGroupIcon as UserGroupSolid, 
  TrophyIcon as TrophySolid,
  BanknotesIcon as BanknotesSolid,
  SparklesIcon as SparklesSolid,
  FireIcon as FireSolid,
  StarIcon as StarSolid,
  ChartBarIcon as ChartBarSolid
} from "@heroicons/react/24/solid";
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import { Dialog } from '@/components/ui/dialog';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import AdminBanner from '@/components/users/AdminBanner';
import { createUserActivity, getUserGoals, getUserActivities, createUserGoal, updateUserActivity } from './metas/actions';
import { UserGoal, UserActivity, CreateUserGoalInput } from '@/types/user';
import { Activity } from '@/types/activity';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EventClickArg, EventInput } from '@fullcalendar/core';
import { GoalCategory } from '@prisma/client';
import React from 'react';

interface InicioStats {
  properties: number;
  clients: number;
  assignments: number;
  news: number;
  users?: number;
  pendingActivities?: number;
  completedObjectives?: number;
  totalObjectives?: number;
  salesInProgress?: number;
}

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
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  
  // Estados para el formulario de nueva actividad
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activityFormData, setActivityFormData] = useState({
    description: '',
    type: 'OTROS',
    goalId: '',
    timestamp: new Date().toISOString(),
    status: 'Pendiente', // Agregar estado por defecto
    metadata: {
      completed: false,
      priority: 'medium'
    }
  });

  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [selectedDateActivities, setSelectedDateActivities] = useState<UserActivity[]>([]);
  const [newActivity, setNewActivity] = useState({
    type: 'LLAMADA',
    description: '',
    timestamp: new Date().toISOString(),
    goalId: '',
    metadata: {
      completed: false,
      priority: 'medium',
      duration: 30, // Duración en minutos
      reminder: 15 // Recordatorio en minutos antes
    }
  });

  // Nuevo estado y lógica para el modal de nueva meta
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [newGoalData, setNewGoalData] = useState<CreateUserGoalInput>({
    title: '',
    description: '',
    targetCount: 5,
    category: GoalCategory.GENERAL,
    endDate: ''
  });

  // Referencia al calendario
  const calendarRef = React.useRef<FullCalendar | null>(null);

  // Efecto para manejar la fecha de la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const dateParam = searchParams.get('date');
    
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
        // Cambiar a vista de día si viene de una actividad específica
        setCalendarView('timeGridDay');
        
        // Actualizar el calendario si la referencia existe
        if (calendarRef.current) {
          const calendarApi = calendarRef.current.getApi();
          calendarApi.gotoDate(parsedDate);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Obtener estadísticas básicas
        const [propertiesRes, clientsRes, assignmentsRes, newsRes, activitiesRes] = await Promise.all([
          fetch('/api/properties/count'),
          fetch('/api/clients/count'),
          fetch('/api/assignments/count'),
          fetch('/api/news/count'),
          fetch('/api/activities')
        ]);

        // Usar tipos específicos para las respuestas
        const [properties, clients, assignments, news, activitiesData] = await Promise.all([
          propertiesRes.json() as Promise<CountResponse>,
          clientsRes.json() as Promise<CountResponse>,
          assignmentsRes.json() as Promise<CountResponse>,
          newsRes.json() as Promise<CountResponse>,
          activitiesRes.json() as Promise<Activity[]>
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
        setActivities(activitiesData);

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

  // Add useEffect to update calendar view when calendarView state changes
  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.changeView(calendarView);
    }
  }, [calendarView]);

  // Manejar el envío del formulario de actividad
  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityFormData.description.trim()) return;
    
    try {
      setIsLoading(true);
      
      const newActivity = await createUserActivity({
        goalId: activityFormData.goalId || undefined,
        type: activityFormData.type,
        description: activityFormData.description,
        metadata: {
          ...activityFormData.metadata,
          status: activityFormData.status
        },
        timestamp: new Date(activityFormData.timestamp)
      });
      
      // Actualizar la lista de actividades
      setUserActivities([newActivity, ...userActivities]);
      
      // Si está asociada a una meta, actualizar el progreso
      if (activityFormData.goalId) {
        const updatedGoals = userGoals.map(goal => {
          if (goal.id === activityFormData.goalId) {
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
        });
        setUserGoals(updatedGoals);
      }
      
      // Limpiar el formulario
      setActivityFormData({
        description: '',
        type: 'MANUAL',
        goalId: '',
        timestamp: new Date().toISOString(),
        status: 'Pendiente',
        metadata: {
          completed: false,
          priority: 'medium'
        }
      });
      
      setIsActivityFormOpen(false);
      
      // Actualizar las estadísticas
      const newStats = { ...stats };
      newStats.pendingActivities = (stats.pendingActivities || 0) + 1;
      setStats(newStats);
    } catch (error) {
      alert('Error al crear la actividad. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para convertir actividades al formato que espera FullCalendar
  const getCalendarEvents = (): EventInput[] => {
    const userEvents = userActivities.map(activity => {
      const isCompleted = activity.metadata?.completed || false;
      const priority = activity.metadata?.priority || 'medium';
      
      // Colores dinámicos según el tipo y estado
      let backgroundColor = '#4F46E5';
      let borderColor = '#4338CA';
      
      if (isCompleted) {
        backgroundColor = '#9CA3AF';
        borderColor = '#6B7280';
      } else {
        // Colores por tipo de actividad
        if (activity.type === 'LLAMADA') {
          backgroundColor = '#3B82F6';
          borderColor = '#2563EB';
        } else if (activity.type === 'REUNION') {
          backgroundColor = '#10B981';
          borderColor = '#059669';
        } else if (activity.type === 'EMAIL') {
          backgroundColor = '#F59E0B';
          borderColor = '#D97706';
        } else if (activity.type === 'VISITA') {
          backgroundColor = '#8B5CF6';
          borderColor = '#7C3AED';
        }
        
        // Ajustar intensidad según prioridad
        if (priority === 'high') {
          backgroundColor = backgroundColor.replace(')', ', 0.9)').replace('#', 'rgba(').replace(/(.{2})/g, '$1,').replace(/,$/, '').replace('rgba(', 'rgba(').replace(/([a-f0-9]{2})/gi, (match) => parseInt(match, 16).toString());
        }
      }

      return {
        id: activity.id,
        title: activity.description || 'Sin descripción',
        start: activity.timestamp,
        end: new Date(new Date(activity.timestamp).getTime() + (activity.metadata?.duration || 30) * 60000),
        extendedProps: {
          type: 'user',
          activityType: activity.type.toLowerCase(),
          isCompleted: isCompleted,
          priority: priority,
          description: activity.description || 'Sin descripción',
          goalId: activity.goalId,
          reminder: activity.metadata?.reminder || 0
        },
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        textColor: isCompleted ? '#6B7280' : '#ffffff',
        classNames: [
          'modern-event',
          `priority-${priority}`,
          isCompleted ? 'completed' : 'pending',
          `type-${activity.type.toLowerCase()}`
        ]
      };
    });

    const propertyEvents = activities.map(activity => {
      const isCompleted = activity.status === 'Completada';
      
      return {
        id: `property-${activity.id}`,
        title: `🏠 ${activity.type} - ${activity.property?.address || 'Sin dirección'}`,
        start: activity.date,
        end: new Date(new Date(activity.date).getTime() + 60 * 60000), // 1 hora por defecto
        extendedProps: {
          type: 'property',
          activityType: 'property',
          status: activity.status,
          client: activity.client || '',
          notes: activity.notes || '',
          propertyId: activity.propertyId,
          isCompleted: isCompleted
        },
        backgroundColor: isCompleted ? '#9CA3AF' : '#10B981',
        borderColor: isCompleted ? '#6B7280' : '#059669',
        textColor: '#ffffff',
        classNames: [
          'property-event',
          isCompleted ? 'completed' : 'pending'
        ]
      };
    });

    return [...userEvents, ...propertyEvents];
  };

  // Función para manejar el clic en un día del calendario
  const handleDateClick = (info: DateClickArg) => {
    // Obtener la fecha del calendario donde se hizo clic
    const clickedDate = new Date(info.date);
    
    // Log para ver la fecha seleccionada
    console.log("Fecha seleccionada en calendario:", clickedDate);
    
    // Establecer la fecha para la visualización general
    setDate(clickedDate);
    
    // Establecer hora actual para la nueva actividad
    const now = new Date();
    clickedDate.setHours(now.getHours());
    clickedDate.setMinutes(now.getMinutes());
    clickedDate.setSeconds(0);
    clickedDate.setMilliseconds(0);
    
    console.log("Fecha modificada con hora actual:", clickedDate);
    
    // Filtrar actividades para el día seleccionado
    const activitiesForDate = userActivities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return (
        activityDate.getDate() === clickedDate.getDate() &&
        activityDate.getMonth() === clickedDate.getMonth() &&
        activityDate.getFullYear() === clickedDate.getFullYear()
      );
    });
    
    // Configurar la nueva actividad con la fecha seleccionada
    setNewActivity({
      ...newActivity,
      timestamp: clickedDate.toISOString() // Guardar como ISO string con la fecha y hora correctas
    });
    
    console.log("Nueva actividad timestamp establecido:", clickedDate.toISOString());
    
    setSelectedDateActivities(activitiesForDate);
    setShowActivityDialog(true);
  };
  
  // Función para manejar el clic en un evento existente
  const handleEventClick = (info: EventClickArg) => {
    const eventId = info.event.id;
    
    // Verificar si es una actividad de propiedad
    if (eventId.startsWith('property-')) {
      const propertyId = info.event.extendedProps.propertyId;
      if (propertyId) {
        router.push(`/dashboard/properties/${propertyId}`);
        return;
      }
    }
    
    // Si es una actividad de usuario, mantener el comportamiento actual
    const activity = userActivities.find(act => act.id === eventId);
    if (activity) {
      const eventDate = new Date(activity.timestamp);
      setDate(eventDate);
      
      // Actualizar el estado de nueva actividad con la fecha del evento
      setNewActivity({
        ...newActivity,
        timestamp: eventDate.toISOString()
      });
      
      setSelectedDateActivities([activity]);
      setShowActivityDialog(true);
    }
  };
  
  // Configurar tooltips para los eventos después de que el componente se monte
  useEffect(() => {
    const setupTooltips = () => {
      // Buscar todos los eventos en el calendario
      const eventElements = document.querySelectorAll('.fc-event');
      
      // Para cada evento, añadir un tooltip
      eventElements.forEach(element => {
        const eventId = element.getAttribute('data-event-id');
        const activity = userActivities.find(act => act.id === eventId);
        
        if (activity) {
          // Crear contenido HTML para el tooltip
          const tooltipContent = `
            <div class="p-2">
              <div class="font-medium">${activity.description}</div>
              <div class="text-xs text-gray-500">${format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm')}</div>
              <div class="text-xs mt-1 font-medium ${
                activity.type === 'call' ? 'text-blue-700' : 
                activity.type === 'meeting' ? 'text-green-700' :
                activity.type === 'email' ? 'text-yellow-700' :
                activity.type === 'visit' ? 'text-purple-700' : 'text-gray-700'
              }">${
                activity.type === 'call' ? 'Llamada' : 
                activity.type === 'meeting' ? 'Reunión' : 
                activity.type === 'email' ? 'Email' : 
                activity.type === 'visit' ? 'Visita' : 'Otra'
              }</div>
              <div class="text-xs mt-1 ${
                activity.metadata?.priority === 'high' ? 'text-red-600' :
                activity.metadata?.priority === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }">
                Prioridad: ${
                  activity.metadata?.priority === 'high' ? 'Alta' :
                  activity.metadata?.priority === 'medium' ? 'Media' :
                  'Baja'
                }
              </div>
            </div>
          `;
          
          // Inicializar el tooltip
          tippy(element, {
            content: tooltipContent,
            allowHTML: true,
            theme: 'light',
            placement: 'top',
            delay: [200, 0],
            animation: 'scale'
          });
        }
      });
    };
    
    // Ejecutar la configuración de tooltips después de un pequeño retraso para asegurar que los elementos están en el DOM
    if (userActivities.length > 0) {
      setTimeout(setupTooltips, 500);
    }
  }, [userActivities, calendarView]);

  // Función para crear una nueva actividad
  const handleCreateActivity = async () => {
    try {
      if (!newActivity.description.trim()) {
        alert('Por favor, añade una descripción para la actividad');
        return;
      }

      // Usar directamente la fecha del estado, que ya contiene la fecha seleccionada por el usuario
      const timestamp = new Date(newActivity.timestamp);
      
      // Log para depuración - mostrar la fecha que vamos a usar
      console.log("Fecha seleccionada (string):", newActivity.timestamp);
      console.log("Fecha convertida a objeto Date:", timestamp);
      console.log("Fecha formateada:", format(timestamp, "dd/MM/yyyy HH:mm", { locale: es }));
      
      // Pasar explícitamente la fecha como objeto Date (no como string)
      const activityData = {
        type: newActivity.type,
        description: newActivity.description,
        goalId: newActivity.goalId || undefined,
        timestamp: timestamp,  // Pasar como Date object
        metadata: newActivity.metadata
      };
      
      console.log("Enviando datos de actividad:", activityData);
      
      // Llamar a la función de creación
      await createUserActivity(activityData);
      
      // Actualizar la lista de actividades
      const updatedActivities = await getUserActivities();
      setUserActivities(updatedActivities);
      
      // Filtrar actividades para el día seleccionado nuevamente para actualizar la lista
      const refreshedActivities = updatedActivities.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        const selectedDate = new Date(date);
        return (
          activityDate.getDate() === selectedDate.getDate() &&
          activityDate.getMonth() === selectedDate.getMonth() &&
          activityDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      
      setSelectedDateActivities(refreshedActivities);
      
      // Limpiar la descripción pero mantener la fecha y otros valores
      setNewActivity({
        ...newActivity,
        description: ''
      });
      
      // Mensaje de confirmación
      alert('Actividad creada correctamente para: ' + format(timestamp, "dd/MM/yyyy", { locale: es }));
    } catch (error) {
      console.error("Error al crear actividad:", error);
      alert('Error al crear la actividad. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para eliminar una actividad
  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No estás autenticado');
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la actividad');
      }

      // Actualizar la lista de actividades
      const updatedActivities = await getUserActivities();
      setUserActivities(updatedActivities);
      
      // Actualizar las actividades seleccionadas para el día actual
      const updatedSelectedActivities = selectedDateActivities.filter(
        activity => activity.id !== activityId
      );
      setSelectedDateActivities(updatedSelectedActivities);
    } catch (error) {
      alert('Error al eliminar la actividad. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para crear una nueva meta
  const handleCreateGoal = async () => {
    try {
      // Validar datos de la nueva meta
      if (!newGoalData.title.trim()) {
        alert('El título de la meta es obligatorio');
        return;
      }
      
      if (!newGoalData.endDate) {
        alert('La fecha de finalización es obligatoria');
        return;
      }
      
      // Crear nueva meta
      const createdGoal = await createUserGoal(newGoalData);
      
      // Actualizar lista de metas del usuario
      setUserGoals([...userGoals, createdGoal]);
      
      // Limpiar formulario de nueva meta
      setNewGoalData({
        title: '',
        description: '',
        targetCount: 5,
        category: GoalCategory.GENERAL,
        endDate: ''
      });
      
      setIsNewGoalModalOpen(false);
      
      alert('Meta creada correctamente');
    } catch (error) {
      console.error("Error al crear meta:", error);
      alert('Error al crear la meta. Por favor, inténtalo de nuevo.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Efectos de fondo modernos */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-400/5 to-pink-400/5 rounded-full blur-2xl"></div>
      
      <div className="relative space-y-8 p-6">
        {/* Header mejorado con efectos glassmorphism */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                  <SparklesSolid className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-audiowide">
                    ¡Bienvenido, {user?.name}! ✨
                  </h1>
                  <p className="mt-2 text-slate-600 text-lg">
                    Tu centro de comando inmobiliario inteligente
                  </p>
                </div>
              </div>
              <button 
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                onClick={() => setIsActivityFormOpen(true)}
              >
                <div className="flex items-center space-x-2">
                  <PlusIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-medium">Nueva Actividad</span>
                </div>
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>

      {/* Formulario unificado de actividad/meta */}
      <Dialog
        open={isActivityFormOpen}
        onClose={() => setIsActivityFormOpen(false)}
        title="Nueva Actividad"
      >
        <form onSubmit={handleActivitySubmit} className="space-y-4">
          <div>
            <Select
              label="Meta asociada (opcional)"
              value={activityFormData.goalId}
              onChange={(e) => setActivityFormData({ ...activityFormData, goalId: e.target.value })}
              options={[
                { value: '', label: 'Sin meta asociada' },
                ...goalOptions
              ]}
            />
          </div>

          <div>
            <Select
              label="Tipo de actividad"
              value={activityFormData.type}
              onChange={(e) => setActivityFormData({ ...activityFormData, type: e.target.value })}
              options={[
                { value: 'LLAMADA', label: 'Llamada' },
                { value: 'VISITA', label: 'Visita' },
                { value: 'EMAIL', label: 'Email' },
                { value: 'DPV', label: 'DPV' },
                { value: 'NOTICIA', label: 'Noticia' },
                { value: 'ENCARGO', label: 'Encargo' },
                { value: 'OTROS', label: 'Otros' }
              ]}
            />
          </div>

          <div>
            <Select
              label="Prioridad"
              value={activityFormData.metadata.priority}
              onChange={(e) => setActivityFormData({
                ...activityFormData,
                metadata: { ...activityFormData.metadata, priority: e.target.value }
              })}
              options={[
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Media' },
                { value: 'low', label: 'Baja' }
              ]}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Estado</label>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setActivityFormData({
                  ...activityFormData,
                  status: activityFormData.status === 'Pendiente' ? 'Realizada' : 'Pendiente',
                  metadata: { 
                    ...activityFormData.metadata, 
                    completed: activityFormData.status === 'Pendiente'
                  }
                })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  activityFormData.status === 'Realizada' ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    activityFormData.status === 'Realizada' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="ml-2 text-sm text-gray-500">
                {activityFormData.status}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="activityDate" className="block text-sm font-medium text-gray-700">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              id="activityDate"
              value={activityFormData.timestamp.slice(0, 16)}
              onChange={(e) => setActivityFormData({
                ...activityFormData,
                timestamp: new Date(e.target.value).toISOString()
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
              placeholder="Describe la actividad..."
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

      {/* Tarjetas de estadísticas modernas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Inmuebles Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 cursor-pointer hover:shadow-2xl transition-all duration-300"
               onClick={() => router.push('/dashboard/properties')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BuildingOfficeSolid className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  +12%
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Inmuebles Localizados</p>
              <p className="text-3xl font-bold text-slate-900 mb-2">{stats.properties}</p>
              <div className="flex items-center text-sm text-slate-500">
                <EyeIcon className="h-4 w-4 mr-1" />
                <span>Propiedades activas</span>
              </div>
            </div>
            {/* Efecto de brillo */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 bg-gradient-to-r from-blue-400 to-indigo-600 transition-opacity duration-300"></div>
          </div>
        </div>

        {/* Clientes Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 cursor-pointer hover:shadow-2xl transition-all duration-300"
               onClick={() => router.push('/dashboard/clients')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserGroupSolid className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
                  <StarIcon className="h-4 w-4 mr-1" />
                  Activos
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Clientes</p>
              <p className="text-3xl font-bold text-slate-900 mb-2">{stats.clients}</p>
              <div className="flex items-center text-sm text-slate-500">
                <BoltIcon className="h-4 w-4 mr-1" />
                <span>Base de clientes</span>
              </div>
            </div>
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 bg-gradient-to-r from-emerald-400 to-teal-600 transition-opacity duration-300"></div>
          </div>
        </div>

        {/* Objetivos Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 cursor-pointer hover:shadow-2xl transition-all duration-300"
               onClick={() => router.push('/dashboard/progreso')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrophySolid className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                  <FireSolid className="h-4 w-4 mr-1" />
                  Meta
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Objetivos</p>
              <p className="text-3xl font-bold text-slate-900 mb-2">
                {Math.round((stats.completedObjectives || 0) / (stats.totalObjectives || 1) * 100)}%
              </p>
              <div className="flex items-center text-sm text-slate-500">
                <ChartBarIcon className="h-4 w-4 mr-1" />
                <span>{stats.completedObjectives || 0} / {stats.totalObjectives || 0} completados</span>
              </div>
            </div>
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 bg-gradient-to-r from-amber-400 to-orange-600 transition-opacity duration-300"></div>
          </div>
        </div>

        {/* Ventas Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 cursor-pointer hover:shadow-2xl transition-all duration-300"
               onClick={() => router.push('/dashboard/sales')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BanknotesSolid className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
                  <RocketLaunchIcon className="h-4 w-4 mr-1" />
                  Hot
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Finalizar Ventas</p>
              <p className="text-3xl font-bold text-slate-900 mb-2">{stats.salesInProgress || 0}</p>
              <div className="flex items-center text-sm text-slate-500">
                <CursorArrowRaysIcon className="h-4 w-4 mr-1" />
                <span>Ventas en proceso</span>
              </div>
            </div>
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 bg-gradient-to-r from-purple-400 to-pink-600 transition-opacity duration-300"></div>
          </div>
        </div>
      </div>

      {/* Contenedor principal con grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario - Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendario con diseño moderno */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-blue-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
              {/* Header del calendario */}
              <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 p-6 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-slate-500 to-blue-600 p-3 rounded-xl shadow-lg">
                      <CalendarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 font-audiowide">Calendario Inteligente</h3>
                      <p className="text-slate-600 text-sm">Gestiona tu agenda inmobiliaria</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex border-2 border-white/30 rounded-xl shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                      <button 
                        className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${calendarView === 'dayGridMonth' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-slate-700 hover:bg-white/80'}`}
                        onClick={() => setCalendarView('dayGridMonth')}
                      >
                        Mes
                      </button>
                      <button 
                        className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${calendarView === 'timeGridWeek' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-slate-700 hover:bg-white/80'}`}
                        onClick={() => setCalendarView('timeGridWeek')}
                      >
                        Semana
                      </button>
                      <button 
                        className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${calendarView === 'timeGridDay' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-slate-700 hover:bg-white/80'}`}
                        onClick={() => setCalendarView('timeGridDay')}
                      >
                        Día
                      </button>
                    </div>
                    <button 
                      className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-slate-700 rounded-xl border border-slate-200 hover:bg-white hover:shadow-lg transition-all duration-300 font-medium"
                      onClick={() => {
                        if (calendarRef.current) {
                          const calendarApi = calendarRef.current.getApi();
                          calendarApi.today();
                          setDate(new Date());
                        }
                      }}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Hoy
                    </button>
                    <button 
                      className="text-sm text-blue-600 hover:text-purple-600 font-medium transition-colors duration-200"
                      onClick={() => router.push('/dashboard/progreso/actividades')}
                    >
                      Ver todo →
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Contenido del calendario */}
              <div className="p-6">
                {/* Barra de navegación temporal y filtros mejorada */}
                <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-slate-50/80 to-blue-50/80 rounded-2xl border border-white/30 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        if (calendarRef.current) {
                          const calendarApi = calendarRef.current.getApi();
                          calendarApi.prev();
                        }
                      }}
                      className="p-2 bg-white/80 hover:bg-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md group"
                    >
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="flex items-center px-4 py-2 bg-white/60 rounded-xl border border-white/40 min-w-[180px] justify-center">
                      <span className="text-sm font-bold text-slate-700" id="calendar-title">
                        {format(date, "MMMM yyyy", { locale: es })}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (calendarRef.current) {
                          const calendarApi = calendarRef.current.getApi();
                          calendarApi.next();
                        }
                      }}
                      className="p-2 bg-white/80 hover:bg-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md group"
                    >
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Filtros de actividades */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center px-3 py-1 bg-white/60 rounded-lg border border-white/40">
                      <span className="text-xs font-medium text-slate-600 mr-2">Filtrar:</span>
                      <select 
                        className="text-xs bg-transparent border-none focus:ring-0 text-slate-700 font-medium"
                        onChange={(e) => {
                          // Aquí implementaremos filtro de tipos de actividad
                          console.log('Filtro seleccionado:', e.target.value);
                        }}
                      >
                        <option value="all">Todas</option>
                        <option value="call">Llamadas</option>
                        <option value="meeting">Reuniones</option>
                        <option value="email">Emails</option>
                        <option value="visit">Visitas</option>
                      </select>
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (calendarRef.current) {
                          const calendarApi = calendarRef.current.getApi();
                          calendarApi.today();
                          setDate(new Date());
                        }
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all duration-200 transform hover:scale-105"
                    >
                      Hoy
                    </button>
                  </div>
                </div>

                <div className="calendar-container bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={calendarView}
                    headerToolbar={false}
                    locale={esLocale}
                    events={getCalendarEvents()}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    height="auto"
                    dayMaxEvents={3}
                    moreLinkClick="popover"
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      meridiem: false
                    }}
                    slotMinTime="06:00:00"
                    slotMaxTime="23:00:00"
                    nowIndicator={true}
                    eventDisplay="block"
                    dayHeaderFormat={{
                      weekday: 'short',
                      month: 'numeric',
                      day: 'numeric'
                    }}
                    eventClassNames={(arg) => {
                      const classes = ['transition-all', 'duration-200', 'hover:scale-105', 'cursor-pointer'];
                      
                      if (arg.event.extendedProps.isCompleted) {
                        classes.push('opacity-60', 'completed-event');
                      }
                      
                      if (arg.event.extendedProps.priority === 'high') {
                        classes.push('fc-priority-high', 'animate-pulse');
                      } else if (arg.event.extendedProps.priority === 'medium') {
                        classes.push('fc-priority-medium');
                      } else {
                        classes.push('fc-priority-low');
                      }
                      
                      // Añadir clase para tipo de actividad
                      if (arg.event.extendedProps.type === 'user') {
                        classes.push('user-activity');
                      } else {
                        classes.push('property-activity');
                      }
                      
                      return classes;
                    }}
                    eventContent={(arg) => {
                      const isCompleted = arg.event.extendedProps.isCompleted;
                      const priority = arg.event.extendedProps.priority;
                      const type = arg.event.extendedProps.type;
                      
                      // Iconos por tipo de actividad
                      const iconMap = {
                        'call': '📞',
                        'meeting': '🤝',
                        'email': '📧',
                        'visit': '🏠',
                        'other': '📝'
                      };
                      
                      const activityIcon = iconMap[arg.event.extendedProps.activityType] || '📝';
                      
                      return {
                        html: `
                          <div class="flex items-center space-x-1 p-1">
                            <span class="text-xs">${isCompleted ? '✅' : activityIcon}</span>
                            <span class="text-xs font-medium truncate flex-1">${arg.event.title}</span>
                            ${priority === 'high' ? '<span class="text-red-500 text-xs">!</span>' : ''}
                          </div>
                        `
                      };
                    }}
                    datesSet={(dateInfo) => {
                      // Actualizar el título cuando cambie la vista
                      const titleElement = document.getElementById('calendar-title');
                      if (titleElement) {
                        titleElement.textContent = format(dateInfo.start, "MMMM yyyy", { locale: es });
                      }
                      setDate(dateInfo.start);
                    }}
                  />
                </div>
                
                {/* Leyenda del calendario modernizada */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 mr-2 shadow-sm"></div>
                    <span className="text-blue-800 font-medium">Llamada</span>
                  </div>
                  <div className="flex items-center px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 mr-2 shadow-sm"></div>
                    <span className="text-emerald-800 font-medium">Reunión</span>
                  </div>
                  <div className="flex items-center px-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 mr-2 shadow-sm"></div>
                    <span className="text-amber-800 font-medium">Email</span>
                  </div>
                  <div className="flex items-center px-3 py-2 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 mr-2 shadow-sm"></div>
                    <span className="text-purple-800 font-medium">Visita</span>
                  </div>
                  <div className="flex items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-400 to-slate-600 mr-2 shadow-sm"></div>
                    <span className="text-slate-800 font-medium">Completada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actividades Pendientes - Modernizada */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
              
              {/* Header modernizado */}
              <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl p-6 mb-6 border border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                      <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                        📋 Actividades Pendientes
                      </h3>
                      <p className="text-sm text-slate-600">Tareas por completar</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => router.push('/dashboard/progreso/actividades')}
                      className="group/btn relative px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative flex items-center">
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Ver todo
                      </span>
                    </button>
                    <button 
                      onClick={() => setIsActivityFormOpen(true)}
                      className="group/btn relative px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative flex items-center">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        ✨ Nueva actividad
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Lista de actividades modernizada */}
              <div className="space-y-4">
                {userActivities
                  .filter(activity => !activity.metadata?.completed)
                  .sort((a, b) => {
                    // Ordenar por prioridad y fecha
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    const aPriority = a.metadata?.priority || 'medium';
                    const bPriority = b.metadata?.priority || 'medium';
                    
                    if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
                      return priorityOrder[aPriority] - priorityOrder[bPriority];
                    }
                    
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                  })
                  .slice(0, 5)
                  .map((activity) => {
                    const goalTitle = userGoals.find(g => g.id === activity.goalId)?.title;
                    const priorityColors = {
                      high: 'from-red-500 to-pink-600',
                      medium: 'from-amber-500 to-orange-600',
                      low: 'from-green-500 to-emerald-600'
                    };
                    const priorityIcons = {
                      high: '🔥',
                      medium: '⚡',
                      low: '🌱'
                    };
                    
                    return (
                      <div
                        key={activity.id}
                        className="group relative bg-gradient-to-r from-white/60 to-slate-50/60 backdrop-blur-sm rounded-2xl border border-white/30 p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Checkbox modernizado */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await updateUserActivity(activity.id, {
                                    metadata: {
                                      ...activity.metadata,
                                      status: 'Realizada',
                                      completed: true
                                    }
                                  });
                                  // Actualizar la lista localmente
                                  setUserActivities(prevActivities => 
                                    prevActivities.map(a => 
                                      a.id === activity.id 
                                        ? { ...a, metadata: { ...a.metadata, status: 'Realizada', completed: true } }
                                        : a
                                    )
                                  );
                                } catch (error) {
                                  console.error('Error al actualizar actividad:', error);
                                }
                              }}
                              className="group/check relative w-8 h-8 bg-gradient-to-r from-white to-slate-100 rounded-xl border-2 border-slate-300 hover:border-green-500 transition-all duration-300 flex items-center justify-center hover:shadow-lg transform hover:scale-110"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl opacity-0 group-hover/check:opacity-20 transition-opacity duration-300"></div>
                              <span className="text-lg opacity-0 group-hover/check:opacity-100 transition-opacity duration-300">✓</span>
                            </button>
                            
                            {/* Indicador de prioridad */}
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${priorityColors[activity.metadata?.priority || 'medium']} shadow-lg`} />
                            
                            {/* Contenido de la actividad */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm font-bold text-slate-800">{activity.description}</p>
                                <span className="text-xs">
                                  {priorityIcons[activity.metadata?.priority || 'medium']}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-slate-600">
                                <span className="flex items-center">
                                  <BoltIcon className="h-3 w-3 mr-1" />
                                  {format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </span>
                                {goalTitle && (
                                  <span className="flex items-center px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-lg">
                                    <BookmarkIcon className="h-3 w-3 mr-1" />
                                    {goalTitle}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Badge del tipo de actividad */}
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl shadow-lg">
                              {activity.type === 'call' ? '📞 Llamada' : 
                               activity.type === 'meeting' ? '🤝 Reunión' : 
                               activity.type === 'email' ? '📧 Email' : 
                               activity.type === 'visit' ? '🏠 Visita' : '📝 Otra'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {/* Estado vacío modernizado */}
                {userActivities.filter(activity => !activity.metadata?.completed).length === 0 && (
                  <div className="text-center py-12">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-3xl blur-sm"></div>
                      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
                        <div className="text-6xl mb-4">📋</div>
                        <h4 className="text-lg font-bold text-slate-700 mb-2 font-audiowide">¡Todo al día!</h4>
                        <p className="text-slate-500 mb-4">No tienes actividades pendientes</p>
                        <button
                          onClick={() => setIsActivityFormOpen(true)}
                          className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <span className="relative flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            ✨ Crear nueva actividad
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Objetivos - Columna derecha modernizada */}
        <div className="lg:col-span-1 group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            
            {/* Header modernizado - mejorado responsive */}
            <div className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-2xl p-4 sm:p-6 mb-6 border border-purple-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0">
                    <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide truncate">
                      🏆 Objetivos
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 truncate">
                      Progreso de tus metas personales
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                      <span className="hidden sm:inline">Progreso global:</span>
                      <span className="sm:hidden">Progreso:</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 sm:w-12 h-2 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((stats.completedObjectives || 0) / (stats.totalObjectives || 1) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent whitespace-nowrap">
                        {Math.round((stats.completedObjectives || 0) / (stats.totalObjectives || 1) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Contenido de objetivos modernizado */}
            {userGoals.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-3xl blur-sm"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
                    <div className="text-6xl mb-4">🎯</div>
                    <h4 className="text-lg font-bold text-slate-700 mb-2 font-audiowide">¡Sin metas aún!</h4>
                    <p className="text-slate-500 mb-4">Crea tu primera meta para comenzar</p>
                    <button
                      onClick={() => router.push('/dashboard/metas')}
                      className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative flex items-center">
                        <TrophyIcon className="h-5 w-5 mr-2" />
                        🎯 Crear primera meta
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {userGoals.slice(0, 5).map((goal) => (
                  <div key={goal.id} className="group relative">
                    <div className="bg-gradient-to-r from-white/60 to-purple-50/60 backdrop-blur-sm rounded-2xl border border-white/30 p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] overflow-hidden">
                      
                      {/* Header de la meta - corregido para evitar desbordamiento */}
                      <div className="flex items-start justify-between mb-3 gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-slate-800 line-clamp-2 break-words flex-1 min-w-0">
                              {goal.title}
                            </h4>
                            <div className="flex-shrink-0">
                              {goal.isCompleted ? (
                                <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-bold rounded-lg flex items-center shadow-lg whitespace-nowrap">
                                  <CheckIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="hidden sm:inline">✅ Completada</span>
                                  <span className="sm:hidden">✅</span>
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-bold rounded-lg whitespace-nowrap">
                                  <span className="hidden sm:inline">⏳ En progreso</span>
                                  <span className="sm:hidden">⏳</span>
                                </span>
                              )}
                            </div>
                          </div>
                          {goal.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 break-words">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        
                        {!goal.isCompleted && (
                          <button
                            onClick={() => setIsActivityFormOpen(true)}
                            disabled={isLoading}
                            className="group/btn w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 rounded-xl hover:from-purple-500 hover:to-pink-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 flex-shrink-0"
                            title="Registrar actividad"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Progreso de la meta - optimizado para responsive */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="text-slate-600 font-medium truncate min-w-0">
                            📊 {goal.currentCount} de {goal.targetCount}
                            <span className="hidden sm:inline"> completadas</span>
                          </span>
                          <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent whitespace-nowrap flex-shrink-0">
                            {goal.progress || Math.floor((goal.currentCount / goal.targetCount) * 100)}%
                          </span>
                        </div>
                        
                        <div className="relative">
                          <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-500 shadow-lg ${
                                goal.isCompleted 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                  : 'bg-gradient-to-r from-purple-500 to-pink-600'
                              }`}
                              style={{ width: `${goal.progress || Math.floor((goal.currentCount / goal.targetCount) * 100)}%` }}
                            />
                          </div>
                          
                          {/* Efecto de brillo en la barra de progreso */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Botón para ver todas las metas - mejorado responsive */}
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={() => router.push('/dashboard/metas')}
                    className="group relative px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center text-sm">
                      <CursorArrowRaysIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">📈 Ver todas mis metas</span>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* AdminBanner si es admin */}
      {user?.role === 'admin' && <AdminBanner />}
      </div>

      {/* Diálogo de Actividades */}
      {showActivityDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowActivityDialog(false)} />
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 activity-dialog">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  onClick={() => setShowActivityDialog(false)}
                >
                  <span className="sr-only">Cerrar</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900 font-audiowide">
                    Actividades para {format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                  </h3>
                  
                  <div className="mt-4">
                    {/* Lista de actividades existentes */}
                    {selectedDateActivities.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {selectedDateActivities.map((activity) => (
                          <div key={activity.id} className="activity-item flex items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center">
                                  <span className={`activity-type-badge activity-type-${activity.type}`}>
                                    {activity.type === 'call' ? 'Llamada' : 
                                     activity.type === 'meeting' ? 'Reunión' : 
                                     activity.type === 'email' ? 'Email' : 
                                     activity.type === 'visit' ? 'Visita' : 'Otra'}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {format(new Date(activity.timestamp), 'HH:mm', { locale: es })}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="text-gray-400 hover:text-red-500"
                                  onClick={() => handleDeleteActivity(activity.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-sm text-gray-700">{activity.description}</p>
                              {activity.goalId && (
                                <div className="mt-1">
                                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                                    {userGoals.find(g => g.id === activity.goalId)?.title || 'Objetivo'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">No hay actividades programadas para este día.</p>
                    )}
                    
                    {/* Formulario para nueva actividad */}
                    <div className="space-y-4 border p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 font-audiowide border-b pb-2">Agregar nueva actividad</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="activityType" className="block text-sm font-medium text-gray-700">
                            Tipo
                          </label>
                          <select
                            id="activityType"
                            value={newActivity.type}
                            onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="call">Llamada</option>
                            <option value="meeting">Reunión</option>
                            <option value="email">Email</option>
                            <option value="visit">Visita</option>
                            <option value="other">Otra</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="activityTime" className="block text-sm font-medium text-gray-700">
                            Hora
                          </label>
                          <input
                            type="time"
                            id="activityTime"
                            value={format(new Date(newActivity.timestamp), 'HH:mm')}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const timestamp = new Date(newActivity.timestamp);
                              timestamp.setHours(hours);
                              timestamp.setMinutes(minutes);
                              setNewActivity({...newActivity, timestamp: timestamp.toISOString()});
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="activityPriority" className="block text-sm font-medium text-gray-700">
                            Prioridad
                          </label>
                          <select
                            id="activityPriority"
                            value={newActivity.metadata.priority}
                            onChange={(e) => setNewActivity({
                              ...newActivity, 
                              metadata: { 
                                ...newActivity.metadata, 
                                priority: e.target.value 
                              }
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="high">Alta</option>
                            <option value="medium">Media</option>
                            <option value="low">Baja</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="activityDuration" className="block text-sm font-medium text-gray-700">
                            Duración (min)
                          </label>
                          <select
                            id="activityDuration"
                            value={newActivity.metadata.duration}
                            onChange={(e) => setNewActivity({
                              ...newActivity, 
                              metadata: { 
                                ...newActivity.metadata, 
                                duration: parseInt(e.target.value) 
                              }
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="15">15 min</option>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">1 hora</option>
                            <option value="90">1.5 horas</option>
                            <option value="120">2 horas</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="activityGoal" className="block text-sm font-medium text-gray-700">
                          Asociar a objetivo
                        </label>
                        <select
                          id="activityGoal"
                          value={newActivity.goalId}
                          onChange={(e) => setNewActivity({...newActivity, goalId: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Sin objetivo asociado</option>
                          {userGoals.map(goal => (
                            <option key={goal.id} value={goal.id}>
                              {goal.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="activityDescription" className="block text-sm font-medium text-gray-700">
                          Descripción
                        </label>
                        <textarea
                          id="activityDescription"
                          value={newActivity.description}
                          onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="Describe la actividad..."
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="activityReminder" className="block text-sm font-medium text-gray-700">
                          Recordatorio
                        </label>
                        <select
                          id="activityReminder"
                          value={newActivity.metadata.reminder}
                          onChange={(e) => setNewActivity({
                            ...newActivity, 
                            metadata: { 
                              ...newActivity.metadata, 
                              reminder: parseInt(e.target.value) 
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="0">Sin recordatorio</option>
                          <option value="5">5 minutos antes</option>
                          <option value="15">15 minutos antes</option>
                          <option value="30">30 minutos antes</option>
                          <option value="60">1 hora antes</option>
                          <option value="1440">1 día antes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto"
                  onClick={handleCreateActivity}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setShowActivityDialog(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Nueva Meta */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsNewGoalModalOpen(false)} />
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  onClick={() => setIsNewGoalModalOpen(false)}
                >
                  <span className="sr-only">Cerrar</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900 font-audiowide">
                    Nueva Meta
                  </h3>
                  
                  <div className="mt-4">
                    <form onSubmit={(e) => { e.preventDefault(); handleCreateGoal(); }} className="space-y-4">
                      <div>
                        <label htmlFor="goalTitle" className="block text-sm font-medium text-gray-700">
                          Título
                        </label>
                        <input
                          type="text"
                          id="goalTitle"
                          value={newGoalData.title}
                          onChange={(e) => setNewGoalData({ ...newGoalData, title: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="goalDescription" className="block text-sm font-medium text-gray-700">
                          Descripción
                        </label>
                        <Textarea
                          id="goalDescription"
                          value={newGoalData.description}
                          onChange={(e) => setNewGoalData({ ...newGoalData, description: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="Describe la meta..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="goalTargetCount" className="block text-sm font-medium text-gray-700">
                            Conteo objetivo
                          </label>
                          <input
                            type="number"
                            id="goalTargetCount"
                            value={newGoalData.targetCount}
                            onChange={(e) => setNewGoalData({ ...newGoalData, targetCount: parseInt(e.target.value) })}
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="goalCategory" className="block text-sm font-medium text-gray-700">
                            Categoría
                          </label>
                          <Select
                            id="goalCategory"
                            value={newGoalData.category}
                            onChange={(e) => setNewGoalData({ ...newGoalData, category: e.target.value as GoalCategory })}
                            options={[
                              { value: GoalCategory.ACTIVITY, label: 'Actividades' },
                              { value: GoalCategory.DPV, label: 'DPVs' },
                              { value: GoalCategory.NEWS, label: 'Noticias' },
                              { value: GoalCategory.ASSIGNMENT, label: 'Encargos' },
                              { value: GoalCategory.LOCATED_TENANTS, label: 'Inquilinos Localizados' },
                              { value: GoalCategory.ADDED_PHONES, label: 'Teléfonos Añadidos' },
                              { value: GoalCategory.EMPTY_PROPERTIES, label: 'Propiedades Vacías' },
                              { value: GoalCategory.NEW_PROPERTIES, label: 'Propiedades Nuevas' }
                            ]}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="goalEndDate" className="block text-sm font-medium text-gray-700">
                          Fecha de finalización
                        </label>
                        <input
                          type="date"
                          id="goalEndDate"
                          value={newGoalData.endDate}
                          onChange={(e) => setNewGoalData({ ...newGoalData, endDate: e.target.value })}
                          required
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
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Crear Meta
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reemplazar los estilos CSS personalizados */}
      <style jsx global>{`
        /* Estilos para FullCalendar */
        .fc {
          --fc-border-color: #e5e7eb;
          --fc-button-bg-color: #4f46e5;
          --fc-button-border-color: #4f46e5;
          --fc-button-hover-bg-color: #4338ca;
          --fc-button-hover-border-color: #4338ca;
          --fc-button-active-bg-color: #3730a3;
          --fc-button-active-border-color: #3730a3;
          --fc-event-bg-color: #4f46e5;
          --fc-event-border-color: #4338ca;
          --fc-event-text-color: #fff;
          --fc-page-bg-color: #fff;
          --fc-today-bg-color: #e0e7ff;
        }
        
        .fc .fc-button {
          border-radius: 0.25rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }
        
        .fc .fc-scrollgrid {
          border-radius: 0.375rem;
          overflow: hidden;
        }
        
        .fc .fc-day-today {
          background-color: var(--fc-today-bg-color);
        }
        
        .fc .fc-daygrid-day-number,
        .fc .fc-col-header-cell-cushion {
          padding: 0.5rem;
          text-decoration: none;
          color: #374151;
        }
        
        .fc .fc-col-header-cell {
          background-color: #f9fafb;
          padding: 0.5rem 0;
        }
        
        .fc .fc-col-header-cell-cushion {
          font-weight: 600;
          color: #4b5563;
          text-transform: uppercase;
          font-size: 0.75rem;
        }
        
        .fc .fc-event {
          border-radius: 0.25rem;
          border-left-width: 3px;
          padding: 0.125rem 0.25rem;
          font-size: 0.75rem;
          cursor: pointer;
          transition: box-shadow 0.2s ease;
        }
        
        .fc .fc-event:hover {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        
        /* Prioridad alta - borde rojo en el lado izquierdo */
        .fc .fc-priority-high {
          border-left-color: #ef4444 !important;
        }
        
        /* Prioridad media - borde amarillo en el lado izquierdo */
        .fc .fc-priority-medium {
          border-left-color: #f59e0b !important;
        }
        
        /* Prioridad baja - borde verde en el lado izquierdo */
        .fc .fc-priority-low {
          border-left-color: #10b981 !important;
        }
        
        /* Estilos para tooltips */
        .tippy-box[data-theme~='light'] {
          background-color: white;
          color: #111827;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        
        /* Estilos para el diálogo de actividades */
        .activity-dialog {
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .activity-item {
          transition: all 0.2s ease;
        }
        
        .activity-item:hover {
          background-color: #f9fafb;
        }
        
        .activity-type-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .activity-type-call {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .activity-type-meeting {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .activity-type-email {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .activity-type-visit {
          background-color: #f3e8ff;
          color: #6b21a8;
        }
        
        .activity-type-other {
          background-color: #f1f5f9;
          color: #475569;
        }
      `}</style>
    </div>
  );
}