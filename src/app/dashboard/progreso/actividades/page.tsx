'use client';

import { Suspense, useState, useEffect } from 'react';
import { getUserActivities, deleteUserActivity } from '@/app/dashboard/metas/actions';
import { UserActivity } from '@/types/user';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Search, Calendar, MessageSquare, Phone, Mail, Building2, X, Loader2, Plus, Filter } from 'lucide-react';
import NewActivityForm from './components/NewActivityForm';
import Button from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Dialog } from '@/components/ui/dialog';

const ACTIVITY_TYPES = [
  { value: 'all', label: 'Todas las actividades' },
  { value: 'call', label: 'Llamadas' },
  { value: 'meeting', label: 'Reuniones' },
  { value: 'email', label: 'Emails' },
  { value: 'visit', label: 'Visitas' },
  { value: 'other', label: 'Otras' },
];

export default function ActividadesPage() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isNewActivityDialogOpen, setIsNewActivityDialogOpen] = useState(false);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await getUserActivities();
      setActivities(data);
    } catch (err) {
      setError('Error al cargar las actividades');
      toast.error('Error al cargar las actividades. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filteredActivities = activities.filter(activity => {
    // Convertir todo a minúsculas para búsqueda sin distinción de mayúsculas/minúsculas
    const searchTermLower = searchTerm.toLowerCase();
    
    // Buscar en la descripción
    const descriptionMatch = activity.description?.toLowerCase().includes(searchTermLower) || false;
    
    // Buscar en el tipo de actividad
    const typeMatch = getActivityTypeLabel(activity.type).toLowerCase().includes(searchTermLower);
    
    // Buscar en la fecha formateada
    const formattedDate = format(new Date(activity.timestamp), 'dd MMM yyyy, HH:mm', { locale: es });
    const dateMatch = formattedDate.toLowerCase().includes(searchTermLower);
    
    // Filtrar por tipo seleccionado
    const matchesType = selectedType === 'all' || activity.type === selectedType;
    
    // Combinar todas las condiciones
    return (descriptionMatch || typeMatch || dateMatch) && matchesType;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-5 w-5 text-blue-500" />;
      case 'meeting':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'email':
        return <Mail className="h-5 w-5 text-green-500" />;
      case 'visit':
        return <Building2 className="h-5 w-5 text-amber-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type);
    return activityType ? activityType.label : 'Actividad';
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      setIsDeleting(true);
      setActivityToDelete(activityId);
      await deleteUserActivity(activityId);
      toast.success('Actividad eliminada correctamente');
      // Recargar las actividades
      const updatedActivities = await getUserActivities();
      setActivities(updatedActivities);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la actividad');
    } finally {
      setIsDeleting(false);
      setActivityToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 font-audiowide">Actividades</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-gray-400" />}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            {showFilters && (
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                options={ACTIVITY_TYPES}
                className="w-48"
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No se encontraron actividades</p>
            <p className="text-sm text-gray-400 mt-2">Intenta con otros filtros o crea una nueva actividad</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsNewActivityDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Actividad
            </Button>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">{getActivityTypeLabel(activity.type)}</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {format(new Date(activity.timestamp), 'dd MMM yyyy, HH:mm', { locale: es })}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{activity.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteActivity(activity.id)}
                    disabled={isDeleting && activityToDelete === activity.id}
                    className="p-1 h-8 w-8 rounded-full opacity-70 hover:opacity-100 transition-opacity"
                  >
                    {isDeleting && activityToDelete === activity.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={isNewActivityDialogOpen}
        onClose={() => setIsNewActivityDialogOpen(false)}
        title="Nueva Actividad"
      >
        <NewActivityForm 
          onSuccess={() => {
            loadActivities();
            setIsNewActivityDialogOpen(false);
            toast.success('Actividad creada correctamente');
          }} 
        />
      </Dialog>
    </div>
  );
} 