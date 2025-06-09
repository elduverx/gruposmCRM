import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ActivityList } from '@/components/activities/ActivityList';
import { UserGoal } from '@/types/user';
import { Activity } from '@/types/activity';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminBanner() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userGoals, setUserGoals] = useState<{[key: string]: UserGoal[]}>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserGoals = async (userId: string) => {
    try {
      const response = await fetch(`/api/goals/user/${userId}`);
      if (response.ok) {
        const goals = await response.json();
        setUserGoals(prev => ({
          ...prev,
          [userId]: goals.filter((goal: UserGoal) => goal.isCompleted)
        }));
      }
    } catch (error) {
      console.error('Error fetching user goals:', error);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [activitiesRes, usersRes] = await Promise.all([
          fetch('/api/activities'),
          fetch('/api/users')
        ]);
        
        const activitiesData = await activitiesRes.json();
        const usersData = await usersRes.json();
        
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
        setUsers(usersData);
      } catch (e) {
        console.error('Error fetching data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleUserClick = async (userId: string) => {
    setSelectedUser(userId === selectedUser ? null : userId);
    if (!userGoals[userId]) {
      await fetchUserGoals(userId);
    }
  };

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
          <CardTitle>Metas y Objetivos por Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-gray-500">No hay usuarios registrados</div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleUserClick(user.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {userGoals[user.id]?.length || 0} metas completadas
                    </div>
                  </div>
                  
                  {selectedUser === user.id && userGoals[user.id] && (
                    <div className="mt-3 pl-10">
                      <div className="text-sm font-medium text-gray-700 mb-2">Metas completadas:</div>
                      <ul className="space-y-2">
                        {userGoals[user.id].map(goal => (
                          <li key={goal.id} className="text-sm border-l-2 border-primary-200 pl-3">
                            <div className="font-medium">{goal.title}</div>
                            <div className="text-xs text-gray-500">
                              Completado: {goal.currentCount} de {goal.targetCount} actividades
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}