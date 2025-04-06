'use client';

import { useState, useEffect } from 'react';
import { BuildingOfficeIcon, UserGroupIcon, ClipboardDocumentListIcon, NewspaperIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  properties: number;
  clients: number;
  assignments: number;
  news: number;
  users?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    properties: 0,
    clients: 0,
    assignments: 0,
    news: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const [propertiesRes, clientsRes, assignmentsRes, newsRes] = await Promise.all([
          fetch('/api/properties/count'),
          fetch('/api/clients/count'),
          fetch('/api/assignments/count'),
          fetch('/api/news/count')
        ]);

        const [properties, clients, assignments, news] = await Promise.all([
          propertiesRes.json(),
          clientsRes.json(),
          assignmentsRes.json(),
          newsRes.json()
        ]);

        const newStats: DashboardStats = {
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
          const users = await usersRes.json();
          newStats.users = users.count;
        }

        setStats(newStats);
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, authLoading, router]);

  const statsItems = [
    {
      name: 'Total Propiedades',
      value: stats.properties,
      icon: BuildingOfficeIcon,
      href: '/dashboard/properties',
      color: 'bg-blue-500'
    },
    {
      name: 'Total Clientes',
      value: stats.clients,
      icon: UserGroupIcon,
      href: '/dashboard/clients',
      color: 'bg-green-500'
    },
    {
      name: 'Total Asignaciones',
      value: stats.assignments,
      icon: ClipboardDocumentListIcon,
      href: '/dashboard/assignments',
      color: 'bg-purple-500'
    },
    {
      name: 'Total Noticias',
      value: stats.news,
      icon: NewspaperIcon,
      href: '/dashboard/news',
      color: 'bg-yellow-500'
    }
  ];

  // Agregar la sección de usuarios solo si el usuario es administrador
  if (user?.role === 'ADMIN') {
    statsItems.push({
      name: 'Total Usuarios',
      value: stats.users || 0,
      icon: UsersIcon,
      href: '/dashboard/users',
      color: 'bg-red-500'
    });
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsItems.map((item) => (
          <div
            key={item.name}
            onClick={() => {
              console.log('Navigating to:', item.href);
              router.push(item.href);
            }}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${item.color} bg-opacity-10`}>
                <item.icon className={`h-6 w-6 ${item.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">{item.name}</h3>
                <p className="text-3xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 