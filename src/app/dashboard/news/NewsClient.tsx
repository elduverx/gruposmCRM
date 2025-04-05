'use client';

import { useState } from 'react';
import { PropertyNews } from '@/types/property';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@/components/ui/dialog';
import { PropertyNewsForm } from '../properties/PropertyNewsForm';
import { formatDate } from '@/lib/utils';

interface NewsClientProps {
  news: PropertyNews[];
}

export function NewsClient({ news }: NewsClientProps) {
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'DPV':
        return 'DPV';
      case 'PVA':
        return 'PVA';
      default:
        return type;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'SALE':
        return 'Venta';
      case 'RENT':
        return 'Alquiler';
      default:
        return action;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'Alta';
      case 'LOW':
        return 'Baja';
      default:
        return priority;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Noticias</h2>
        <Button onClick={() => setShowNewsForm(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Noticia
        </Button>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No hay noticias</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propiedad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valoración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {news.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.property?.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeLabel(item.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getActionLabel(item.action)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.valuation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPriorityLabel(item.priority)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.responsible}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.value ? `€${item.value.toLocaleString('es-ES')}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={showNewsForm}
        onClose={() => setShowNewsForm(false)}
        title="Nueva Noticia"
      >
        <PropertyNewsForm 
          propertyId={selectedPropertyId || ''} 
          onSuccess={() => setShowNewsForm(false)} 
        />
      </Dialog>
    </div>
  );
} 