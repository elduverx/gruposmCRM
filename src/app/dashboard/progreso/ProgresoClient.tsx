'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserActivity, UserGoal } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProgresoClientProps {
  userId: string;
}

interface ActivityMetadata {
  status?: 'completed' | 'pending';
  [key: string]: unknown;
}

export default function ProgresoClient({ userId }: ProgresoClientProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activitiesRes, goalsRes] = await Promise.all([
          fetch(`/api/activities/user/${userId}`),
          fetch(`/api/goals/user/${userId}`)
        ]);

        if (!activitiesRes.ok || !goalsRes.ok) {
          throw new Error('Error al cargar los datos');
        }

        const activitiesData = await activitiesRes.json() as UserActivity[];
        const goalsData = await goalsRes.json() as UserGoal[];

        setActivities(activitiesData);
        setGoals(goalsData);
      } catch (error) {
        alert('Error al cargar los datos. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Separar actividades completadas y pendientes
  const completedActivities = activities.filter(activity => {
    const metadata = activity.metadata as ActivityMetadata;
    return metadata?.status === 'completed';
  });
  const pendingActivities = activities.filter(activity => {
    const metadata = activity.metadata as ActivityMetadata;
    return metadata?.status !== 'completed';
  });

  // Obtener metas completadas
  const completedGoals = goals.filter(goal => goal.isCompleted);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="objetivos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="objetivos">Objetivos y Progreso</TabsTrigger>
          <TabsTrigger value="completadas">Actividades Completadas</TabsTrigger>
          <TabsTrigger value="pendientes">Actividades Pendientes</TabsTrigger>
        </TabsList>

        <TabsContent value="objetivos">
          <Card>
            <CardHeader>
              <CardTitle>Mis Objetivos y Progreso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{goal.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        goal.isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {goal.isCompleted ? 'Completado' : 'En progreso'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${(goal.currentCount / goal.targetCount) * 100}%`
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Progreso: {goal.currentCount} / {goal.targetCount}
                    </p>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completadas">
          <Card>
            <CardHeader>
              <CardTitle>Actividades y Metas Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mostrar metas completadas */}
                {completedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                  >
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-gray-500">
                        Meta completada el {format(new Date(goal.updatedAt), 'PPP', { locale: es })}
                      </p>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Meta</p>
                      <p className="text-sm font-medium text-green-600">
                        {goal.currentCount} / {goal.targetCount}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Mostrar actividades completadas */}
                {completedActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                  >
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(activity.timestamp), 'PPP', { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{activity.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendientes">
          <Card>
            <CardHeader>
              <CardTitle>Actividades Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50"
                  >
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(activity.timestamp), 'PPP', { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{activity.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 