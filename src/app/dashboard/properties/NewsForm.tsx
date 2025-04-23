// @ts-nocheck
'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { useUsers } from '@/hooks/useUsers';

interface NewsFormProps {
  propertyId: string;
  dpvValue?: number;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export function NewsForm({ propertyId, dpvValue, onSubmit, isLoading }: NewsFormProps) {
  const { users } = useUsers();
  const [formData, setFormData] = useState({
    type: 'DPV', // DPV o PVA
    action: 'SALE', // SALE o RENT
    valuation: 'PRECIOSM', // PRECIOSM o PRECIO_CLIENTE
    priority: 'LOW', // HIGH o LOW
    responsible: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      propertyId,
      value: formData.type === 'DPV' ? dpvValue : null,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="DPV">DPV</option>
            <option value="PVA">PVA</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Acción</label>
          <select
            name="action"
            value={formData.action}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="SALE">Venta</option>
            <option value="RENT">Alquiler</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Valoración</label>
          <select
            name="valuation"
            value={formData.valuation}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="PRECIOSM">PrecioSM</option>
            <option value="PRECIO_CLIENTE">Precio Cliente</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prioridad</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="HIGH">Alta</option>
            <option value="LOW">Baja</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Responsable</label>
          <select
            name="responsible"
            value={formData.responsible}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar responsable</option>
            {users.map((user) => (
              <option key={user.id} value={user.name}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Insertando...' : 'Insertar'}
        </Button>
      </div>
    </form>
  );
} 