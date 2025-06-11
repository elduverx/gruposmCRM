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
    return (
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
                </div>
                <p className="text-slate-700 text-lg font-medium">👑 Cargando resumen administrativo...</p>
                <p className="text-slate-500 text-sm mt-2">Obteniendo datos de usuarios y actividades</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-8">
      {/* Enhanced Admin Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-sm"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">👑</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-audiowide">
                👑 Panel de Administración
              </h2>
              <p className="text-slate-600">Resumen de actividades y gestión de usuarios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activities Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 p-6 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 font-audiowide">📋 Actividades Recientes</h3>
                  <p className="text-slate-600 text-sm">Últimas {activities.length} actividades del sistema</p>
                </div>
              </div>
            </div>
            
            {/* Card Content */}
            <div className="p-6">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📭</div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-2">No hay actividades recientes</h4>
                  <p className="text-slate-500">Las actividades aparecerán aquí una vez que se registren</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ActivityList activities={activities} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Users Goals Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 p-6 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 font-audiowide">🎯 Metas y Objetivos</h3>
                  <p className="text-slate-600 text-sm">Progreso de metas por usuario</p>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-2">No hay usuarios registrados</h4>
                  <p className="text-slate-500">Los usuarios aparecerán aquí una vez que se registren</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map(user => (
                    <div 
                      key={user.id} 
                      className="group/user relative"
                    >
                      <div 
                        className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-4 hover:bg-white/80 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        onClick={() => handleUserClick(user.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-sm">
                                {user.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 font-audiowide">
                                👤 {user.name}
                              </div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-medium">
                              🎯 {userGoals[user.id]?.length || 0} metas completadas
                            </span>
                            <svg 
                              className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                                selectedUser === user.id ? 'transform rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        
                        {selectedUser === user.id && userGoals[user.id] && (
                          <div className="mt-4 pl-2 space-y-3 border-t border-slate-200 pt-4">
                            <div className="text-sm font-bold text-slate-700 mb-3 flex items-center space-x-2">
                              <span className="text-green-600">✅</span>
                              <span>Metas completadas:</span>
                            </div>
                            {userGoals[user.id].length === 0 ? (
                              <div className="text-center py-4">
                                <div className="text-2xl mb-2">🎯</div>
                                <p className="text-sm text-slate-500">Este usuario aún no ha completado ninguna meta</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {userGoals[user.id].map(goal => (
                                  <div key={goal.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                                    <div className="flex items-start space-x-3">
                                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1 rounded-lg shadow-lg">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-semibold text-green-800 text-sm">
                                          🏆 {goal.title}
                                        </div>
                                        <div className="text-xs text-green-600 mt-1">
                                          ✅ Completado: {goal.currentCount} de {goal.targetCount} actividades
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}