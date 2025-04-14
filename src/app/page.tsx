/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-console */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './dashboard/context/AuthContext';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  NewspaperIcon 
} from "@heroicons/react/24/outline";

interface Stats {
  name: string;
  value: string;
  icon: any;
}

export default function Home() {
  const [stats, setStats] = useState<Stats[]>([
    { name: "Total Inmuebles", value: "0", icon: BuildingOfficeIcon },
    { name: "Total Clientes", value: "0", icon: UserGroupIcon },
    { name: "Encargos Pendientes", value: "0", icon: ClipboardDocumentListIcon },
    { name: "Noticias Recientes", value: "0", icon: NewspaperIcon },
  ]);

  const { isAuthenticated, loading } = useAuth();
  
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
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

        setStats([
          { name: "Total Inmuebles", value: properties.count.toString(), icon: BuildingOfficeIcon },
          { name: "Total Clientes", value: clients.count.toString(), icon: UserGroupIcon },
          { name: "Encargos Pendientes", value: assignments.count.toString(), icon: ClipboardDocumentListIcon },
          { name: "Noticias Recientes", value: news.count.toString(), icon: NewspaperIcon },
        ]);
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Inicio</h1>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.name}
              className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
            >
              <dt>
                <div className="absolute rounded-md bg-indigo-500 p-3">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              </dd>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Properties */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inmuebles Recientes</dt>
                    <dd className="text-lg font-medium text-gray-900">No hay inmuebles recientes</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Clients */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Clientes Recientes</dt>
                    <dd className="text-lg font-medium text-gray-900">No hay clientes recientes</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
