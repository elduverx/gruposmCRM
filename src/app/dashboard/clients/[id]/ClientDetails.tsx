'use client';

import { useState } from 'react';
import { Client } from '@/types/client';
import { Property } from '@/types/property';
import { Assignment } from '@/types/property';
import { BuildingOfficeIcon, UserGroupIcon, HomeIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';

interface ClientDetailsProps {
  client: Client & {
    properties: Property[];
    assignments: Assignment[];
  };
}

type TabType = 'info' | 'properties' | 'family';

export default function ClientDetails({ client }: ClientDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const tabs = [
    { id: 'info', name: 'Información', icon: UserGroupIcon },
    { id: 'properties', name: 'Propiedades', icon: BuildingOfficeIcon },
    { id: 'family', name: 'Familia', icon: HomeIcon },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-600">{client.email || 'Sin correo'}</p>
          {client.phone && <p className="text-gray-600">{client.phone}</p>}
          {client.address && <p className="text-gray-600">{client.address}</p>}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center px-6 py-3 text-sm font-medium border-b-2
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Información General</h3>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.email || 'Sin correo'}</dd>
                  </div>
                  {client.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                      <dd className="mt-1 text-sm text-gray-900">{client.phone}</dd>
                    </div>
                  )}
                  {client.address && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                      <dd className="mt-1 text-sm text-gray-900">{client.address}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(client.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Propiedades</h3>
              {client.properties.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {client.properties.map((property) => (
                    <div key={property.id} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{property.address}</h4>
                      <p className="text-sm text-gray-500">{property.population}</p>
                      <div className="mt-2 text-sm">
                        <p>Tipo: {property.type}</p>
                        <p>Estado: {property.status}</p>
                        {property.metrosCuadrados && (
                          <p>Metros: {property.metrosCuadrados}m²</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay propiedades asociadas</p>
              )}
            </div>
          )}

          {activeTab === 'family' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Familia</h3>
              <p className="text-gray-500">Funcionalidad en desarrollo...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
