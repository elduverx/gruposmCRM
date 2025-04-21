'use client';

import { useState, useEffect } from 'react';
import { getUserActivities } from '../metas/actions';
import { UserActivity } from '@/types/user';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ActividadesPage() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        const data = await getUserActivities();
        setActivities(data);
      } catch (err) {
        setError('Error al cargar las actividades');
        console.error('Error loading activities:', err);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'PROPERTY_CREATED':
        return '🏠';
      case 'PROPERTY_UPDATED':
        return '📝';
      case 'PROPERTY_DELETED':
        return '🗑️';
      case 'PROPERTY_ASSIGNED':
        return '📍';
      case 'ZONE_CREATED':
        return '🗺️';
      case 'ZONE_UPDATED':
        return '✏️';
      case 'ZONE_DELETED':
        return '❌';
      case 'CLIENT_CREATED':
        return '👤';
      case 'CLIENT_UPDATED':
        return '📋';
      case 'CLIENT_DELETED':
        return '🚫';
      case 'TASK_CREATED':
        return '📌';
      case 'TASK_COMPLETED':
        return '✅';
      case 'TASK_UPDATED':
        return '🔄';
      case 'TASK_DELETED':
        return '🗑️';
      case 'NOTE_CREATED':
        return '📝';
      case 'NOTE_UPDATED':
        return '✏️';
      case 'NOTE_DELETED':
        return '🗑️';
      default:
        return '📌';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Historial de Actividades</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <li key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 text-2xl">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(activity.timestamp), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                    {activity.metadata && (
                      <div className="mt-1 text-xs text-gray-500">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  {activity.points > 0 && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        +{activity.points} puntos
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 