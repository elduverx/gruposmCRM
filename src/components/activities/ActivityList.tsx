import { Activity } from '@/types/activity';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Phone, Calendar, Mail, Building2, MessageSquare } from 'lucide-react';

export interface Activity {
  id: string;
  propertyId: string;
  type: string;
  status: string;
  client: string | null;
  notes: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  property: Property | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'llamada':
        return <Phone className="h-5 w-5 text-blue-500" />;
      case 'visita':
        return <Building2 className="h-5 w-5 text-green-500" />;
      case 'email':
        return <Mail className="h-5 w-5 text-purple-500" />;
      case 'reunión':
        return <MessageSquare className="h-5 w-5 text-orange-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">No se encontraron actividades</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        // Asegurarse de que la fecha sea válida
        const activityDate = new Date(activity.date);
        const isValidDate = !isNaN(activityDate.getTime());

        return (
          <Card key={activity.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-2 rounded-full">
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {activity.type}
                      {activity.type.toLowerCase() === 'llamada' && activity.user?.name && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          por {activity.user.name}
                        </span>
                      )}
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {isValidDate 
                        ? format(activityDate, 'dd MMM yyyy, HH:mm', { locale: es })
                        : 'Fecha no válida'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === 'Completada' ? 'bg-green-100 text-green-600' :
                      activity.status === 'Programada' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                  {activity.notes && (
                    <p className="text-gray-600 mt-1">{activity.notes}</p>
                  )}
                  {activity.client && (
                    <p className="text-sm text-gray-500 mt-2">
                      Cliente: {activity.client}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Propiedad: {activity.property?.address || 'No disponible'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}