import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ActivityList } from '@/components/activities/ActivityList';
import { UserGoal } from '@/types/user';
import { Activity } from '@/types/activity';

export default function AdminBanner() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [activitiesRes, goalsRes] = await Promise.all([
          fetch('/api/activities'),
          fetch('/api/goals'),
        ]);
        const activitiesData = await activitiesRes.json();
        const goalsData = await goalsRes.json();
        // Mapear UserActivity a Activity
        const mappedActivities: Activity[] = activitiesData.slice(0, 5).map((a: any) => ({
          id: a.id,
          propertyId: a.propertyId || '',
          type: a.type || 'Actividad',
          status: a.status || 'Completada',
          client: a.client || '',
          notes: a.notes || '',
          date: a.date || a.timestamp || '',
          createdAt: a.createdAt || '',
          updatedAt: a.updatedAt || '',
          property: a.property || null,
        }));
        setActivities(mappedActivities);
        setGoals(goalsData.slice(0, 5));
      } catch (e) {
        // Manejo de error simple
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="mb-8"><Card><CardContent>Cargando resumen administrativo...</CardContent></Card></div>;
  }

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Actividades recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityList activities={activities} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Metas y Objetivos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-gray-500">No hay metas registradas</div>
          ) : (
            <ul className="space-y-2">
              {goals.map(goal => (
                <li key={goal.id} className="border-b pb-2 last:border-b-0">
                  <div className="font-semibold">{goal.title}</div>
                  <div className="text-xs text-gray-500">{goal.currentCount} de {goal.targetCount} actividades • {goal.isCompleted ? 'Completada' : 'En progreso'}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 