import React from 'react';
import { Property } from '@/types/property';
import { CheckIcon } from '@heroicons/react/24/solid';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Activity } from '@/types/property';
import { Zone } from '@/types/zone';

interface PropertyTableProps {
  properties: Property[];
  activitiesMap: Record<string, Activity[]>;
  zones: Zone[];
  onPropertyClick: (property: Property) => void;
  onDeleteProperty: (id: string) => void;
  onToggleLocated: (property: Property) => void;
  isDeleting: string | null;
  isUpdating: string | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  isLoading?: boolean;
}

export default function PropertyTable({
  properties,
  activitiesMap,
  zones,
  onPropertyClick,
  onDeleteProperty,
  onToggleLocated,
  isDeleting,
  isUpdating,
  sortBy,
  sortOrder,
  onSortChange,
  isLoading = false
}: PropertyTableProps) {
  // Función para renderizar el indicador de orden
  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Función para renderizar el indicador de localización
  const renderLocationIndicator = (property: Property) => {
    const isLocated = property.isLocated || false;
    const isCurrentlyUpdating = isUpdating === property.id;
    
    return (
      <button
        onClick={() => onToggleLocated(property)}
        disabled={isCurrentlyUpdating}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
          isLocated 
            ? 'bg-green-100 hover:bg-green-200' 
            : 'border-2 border-gray-300 hover:border-gray-400'
        } ${isCurrentlyUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isLocated ? 'Marcar como no localizado' : 'Marcar como localizado'}
      >
        {isLocated && <CheckIcon className="h-4 w-4 text-green-600" />}
        {isCurrentlyUpdating && (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
        )}
      </button>
    );
  };

  // Función para renderizar la zona
  const renderZone = (zoneId: string | null) => {
    if (!zoneId) return '-';
    
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return '-';
    
    return (
      <div className="flex items-center">
        <span 
          className="inline-block w-3 h-3 rounded-full mr-2" 
          style={{ backgroundColor: zone.color || '#FF0000' }}
        ></span>
        {zone.name || ''}
      </div>
    );
  };

  // Función para renderizar la última actividad
  const renderLastActivity = (propertyId: string) => {
    const activities = activitiesMap[propertyId] || [];
    if (activities.length === 0) return '-';
    
    const lastActivity = activities[0];
    return (
      <span title={`Último contacto: ${lastActivity.date}`}>
        {lastActivity.date}
      </span>
    );
  };

  // Renderizar encabezados de columna con ordenamiento
  const renderColumnHeader = (field: string, label: string) => {
    return (
      <th 
        scope="col" 
        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
        onClick={() => onSortChange(field)}
      >
        {label} {renderSortIndicator(field)}
      </th>
    );
  };

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <div className="min-w-max">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {renderColumnHeader('population', 'Población')}
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Zona</th>
              {renderColumnHeader('address', 'Dirección')}
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ocupado por</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Último contacto</th>
              <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Localizado</th>
              {renderColumnHeader('ownerName', 'Propietario')}
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Teléfono</th>
              {renderColumnHeader('responsible', 'Responsable')}
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {properties.map((property) => (
              <tr key={property.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.population}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  {renderZone(property.zoneId)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  <button
                    onClick={() => onPropertyClick(property)}
                    className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                  >
                    {property.address}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.occupiedBy || '-'}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  {renderLastActivity(property.id)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                  {renderLocationIndicator(property)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.ownerName}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.ownerPhone}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.responsible || '-'}</td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onDeleteProperty(property.id)}
                      disabled={isDeleting === property.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      <TrashIcon className="h-5 w-5" />
                      <span className="sr-only">Eliminar {property.address}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Indicador de carga */}
      {isLoading && (
        <div className="py-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
} 