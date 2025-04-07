'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import { createPropertyNews, getPropertyNews } from './actions';
import { PropertyNews } from '@/types/property';

interface PropertyNewsFormProps {
  propertyId: string;
  onSuccess: (data: Omit<PropertyNews, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: PropertyNews | null;
}

export default function PropertyNewsForm({ propertyId, onSuccess, initialData }: PropertyNewsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValorated, setIsValorated] = useState(false);
  const [existingNews, setExistingNews] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    type: 'DPV',
    action: 'SALE',
    valuation: 'PRECIOSM',
    priority: 'LOW',
    responsible: '',
    value: 0,
    precioSM: null as number | null,
    precioCliente: null as number | null,
    propertyId: propertyId
  });

  useEffect(() => {
    const checkExistingNews = async () => {
      try {
        const existingNews = await getPropertyNews(propertyId);
        if (existingNews.length > 0) {
          setExistingNews(true);
          setError('Ya existe una noticia para esta propiedad, pero puedes crear otra');
        } else {
          setExistingNews(false);
          setError(null);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking existing news:', error);
        setError('Error al verificar noticias existentes');
        setLoading(false);
      }
    };

    if (propertyId) {
      checkExistingNews();
    }
  }, [propertyId]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        action: initialData.action,
        valuation: initialData.valuation,
        priority: initialData.priority,
        responsible: initialData.responsible || '',
        value: initialData.value || 0,
        precioSM: initialData.precioSM || null,
        precioCliente: initialData.precioCliente || null,
        propertyId
      });
    }
  }, [initialData, propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        propertyId,
        // Only include valuation fields if isValorated is true
        ...(isValorated ? {
          precioSM: formData.precioSM,
          precioCliente: formData.precioCliente
        } : {
          precioSM: null,
          precioCliente: null
        })
      };

      await onSuccess(data);
      setLoading(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Error al crear la noticia');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      if (name === 'isValorated') {
        setIsValorated(checkbox.checked);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Calculate benefit based on which price is higher
  const beneficio = isValorated && formData.precioCliente !== null && formData.precioSM !== null
    ? (formData.precioCliente < formData.precioSM 
        ? formData.precioSM - formData.precioCliente 
        : formData.precioCliente - formData.precioSM) 
    : 0;

  // Si hay noticias existentes, mostrar un mensaje pero permitir continuar
  if (existingNews) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 rounded-md">
          <p className="text-sm font-medium text-yellow-800">
            Ya existe una noticia para esta propiedad. Puedes crear otra si lo necesitas.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isValorated"
              name="isValorated"
              checked={isValorated}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isValorated" className="ml-2 block text-sm text-gray-900">
              Ha sido valorado
            </label>
          </div>

          {isValorated ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Cliente</label>
                  <input
                    type="number"
                    name="precioCliente"
                    value={formData.precioCliente === null ? '' : formData.precioCliente}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio SM</label>
                  <input
                    type="number"
                    name="precioSM"
                    value={formData.precioSM === null ? '' : formData.precioSM}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">Beneficio: <span className="text-green-600 font-bold">€{beneficio.toLocaleString('es-ES')}</span></p>
              </div>
            </>
          ) : (
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
          )}

          {error && (
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Noticia'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isValorated"
          name="isValorated"
          checked={isValorated}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="isValorated" className="ml-2 block text-sm text-gray-900">
          Ha sido valorado
        </label>
      </div>

      {isValorated ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio Cliente</label>
              <input
                type="number"
                name="precioCliente"
                value={formData.precioCliente === null ? '' : formData.precioCliente}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio SM</label>
              <input
                type="number"
                name="precioSM"
                value={formData.precioSM === null ? '' : formData.precioSM}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Beneficio: <span className="text-green-600 font-bold">€{beneficio.toLocaleString('es-ES')}</span></p>
          </div>
        </>
      ) : (
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
      )}

      {error && (
        <div className="p-3 bg-red-50 rounded-md">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Noticia'}
        </Button>
      </div>
    </form>
  );
} 