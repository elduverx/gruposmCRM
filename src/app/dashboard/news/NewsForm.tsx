'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PropertySelector } from './PropertySelector';
import { createPropertyNews } from './actions';
import { toast } from 'sonner';

interface NewsFormProps {
  onSuccess?: () => void;
}

export function NewsForm({ onSuccess }: NewsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    type: 'DPV',
    action: 'SALE',
    valuation: 'PRECIOSM',
    priority: 'LOW',
    responsible: '',
    value: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createPropertyNews({
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null
      });

      if (result) {
        onSuccess?.();
      } else {
        toast.error('Error al crear la noticia');
      }
    } catch (error) {
      console.error('Error creating news:', error);
      toast.error('Error al crear la noticia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Propiedad</label>
        <PropertySelector
          value={formData.propertyId}
          onChange={(value) => setFormData(prev => ({ ...prev, propertyId: value }))}
        />
      </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700">Valor</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="value"
              value={formData.value}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-blue-500 focus:ring-blue-500"
              placeholder="0"
              step="0.01"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">€</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Responsable</label>
          <input
            type="text"
            name="responsible"
            value={formData.responsible}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
} 