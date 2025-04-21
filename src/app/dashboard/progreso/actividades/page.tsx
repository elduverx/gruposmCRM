'use client';

import { Suspense, useState, useEffect } from 'react';
import { getUserActivities } from '../../metas/actions';
import { UserActivity } from '@/types/user';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Search, Calendar, MessageSquare, Phone, Mail, Building2 } from 'lucide-react';
import NewActivityForm from './components/NewActivityForm';

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

  useEffect(() => {
    loadActivities();
  }, []);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesType = selectedType === 'all' || activity.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-5 w-5" />;
      case 'meeting':
        return <Calendar className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'visit':
        return <Building2 className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Actividades</h1>
        <NewActivityForm onSuccess={loadActivities} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Buscar actividades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
        <Select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          options={ACTIVITY_TYPES}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.map((activity) => (
          <Card key={activity.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getActivityIcon(activity.type)}
                <span className="capitalize">{activity.type}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{activity.description || 'Sin descripción'}</p>
              <p className="text-xs text-gray-400 mt-2">
                {format(new Date(activity.timestamp), 'PPP', { locale: es })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 