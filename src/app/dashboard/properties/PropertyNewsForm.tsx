'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { createPropertyNews } from './actions';
import { PropertyNews } from '@/types/property';

interface PropertyNewsFormProps {
  propertyId: string;
  onSuccess?: () => void;
}

export function PropertyNewsForm({ propertyId, onSuccess }: PropertyNewsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrices, setShowPrices] = useState(false);
  const [formData, setFormData] = useState({
    type: 'DPV',
    action: 'SALE',
    valuation: 'PRECIOSM',
    priority: 'LOW',
    responsible: '',
    value: 0,
    precioSM: 0,
    precioCliente: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        value: showPrices ? parseFloat(formData.precioCliente.toString()) : parseFloat(formData.value.toString()),
        propertyId
      };

      const result = await createPropertyNews(data);
      if (result) {
        onSuccess?.();
      } else {
        setError('Ya existe una noticia para esta propiedad');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear la noticia');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setShowPrices(checkbox.checked);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const beneficio = showPrices ? formData.precioCliente - formData.precioSM : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="SALE">Venta</option>
          <option value="RENT">Alquiler</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Valoración</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPrices"
              checked={showPrices}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="showPrices" className="ml-2 block text-sm text-gray-700">
              Mostrar precios
            </label>
          </div>
        </div>
        {!showPrices && (
          <select
            name="valuation"
            value={formData.valuation}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="PRECIOSM">Precio SM</option>
            <option value="PRECIOCLIENTE">Precio Cliente</option>
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Prioridad</label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="HIGH">Alta</option>
          <option value="LOW">Baja</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Responsable</label>
        <input
          type="text"
          name="responsible"
          value={formData.responsible}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      {!showPrices ? (
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor</label>
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            min="0"
            step="0.01"
          />
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio SM</label>
            <input
              type="number"
              name="precioSM"
              value={formData.precioSM}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Cliente</label>
            <input
              type="number"
              name="precioCliente"
              value={formData.precioCliente}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Beneficio: <span className="text-green-600 font-bold">€{beneficio.toLocaleString('es-ES')}</span></p>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Noticia'}
        </Button>
      </div>
    </form>
  );
} 