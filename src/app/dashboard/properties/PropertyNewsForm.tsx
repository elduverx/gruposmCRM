'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import { createPropertyNews, getPropertyNews } from './actions';
import { PropertyNews } from '@/types/property';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/hooks/useUsers';

interface PropertyNewsFormProps {
  propertyId: string;
  onSuccess?: () => void;
  initialData?: PropertyNews | null;
}

interface NewsFormData {
  type: string;
  action: string;
  valuation: boolean;
  priority: 'HIGH' | 'LOW';
  responsible: string;
  value: number;
  precioSM: number | null;
  precioCliente: number | null;
}

export default function PropertyNewsForm({ propertyId, onSuccess, initialData }: PropertyNewsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingNews, setExistingNews] = useState<boolean>(false);
  const { users } = useUsers();
  const [formData, setFormData] = useState<NewsFormData>({
    type: 'DPV',
    action: 'Venta',
    valuation: false,
    priority: 'LOW',
    responsible: '',
    value: 0,
    precioSM: null,
    precioCliente: null,
  });
  const router = useRouter();

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
        // eslint-disable-next-line no-console
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
        valuation: initialData.valuation === 'true',
        priority: initialData.priority,
        responsible: initialData.responsible || '',
        value: initialData.value || 0,
        precioSM: initialData.precioSM || null,
        precioCliente: initialData.precioCliente || null,
      });
    }
  }, [initialData, propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        type: formData.type,
        action: formData.action,
        valuation: formData.valuation,
        priority: formData.priority,
        responsible: formData.responsible,
        value: formData.value || 0,
        precioSM: formData.precioSM || 0,
        precioCliente: formData.precioCliente || 0
      };

      await createPropertyNews(propertyId, data);
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la noticia');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked,
        ...(name === 'valuation' && !checkbox.checked ? {
          precioSM: null,
          precioCliente: null
        } : {})
      }));
    } else if (type === 'number') {
      const numValue = value === '' ? null : Number(value);
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Calculate benefit based on which price is higher
  const beneficio = formData.valuation && formData.precioCliente !== null && formData.precioSM !== null
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

            <div className="col-span-1 md:col-span-2">
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
                Acción
              </label>
              <select
                name="action"
                id="action"
                value={formData.action}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
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
              <select
                name="responsible"
                value={formData.responsible}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Seleccionar responsable</option>
                {users.map((user) => (
                  <option key={user.id} value={user.name || ''}>
                    {user.name || 'Sin nombre'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="valuation"
              name="valuation"
              checked={formData.valuation}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="valuation" className="ml-2 block text-sm text-gray-900">
              Ha sido valorado
            </label>
          </div>

          {formData.valuation ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="precioCliente" className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Cliente
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="precioCliente"
                      id="precioCliente"
                      value={formData.precioCliente || ''}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">€</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="precioSM" className="block text-sm font-medium text-gray-700 mb-1">
                    Precio SM
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="precioSM"
                      id="precioSM"
                      value={formData.precioSM || ''}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">€</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">Beneficio: <span className="text-green-600 font-bold">€{beneficio.toLocaleString('es-ES')}</span></p>
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Valor
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="value"
                  id="value"
                  value={formData.value}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">€</span>
                </div>
              </div>
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

        <div className="col-span-1 md:col-span-2">
          <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
            Acción
          </label>
          <select
            name="action"
            id="action"
            value={formData.action}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="Venta">Venta</option>
            <option value="Alquiler">Alquiler</option>
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
          <select
            name="responsible"
            value={formData.responsible}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Seleccionar responsable</option>
            {users.map((user) => (
              <option key={user.id} value={user.name || ''}>
                {user.name || 'Sin nombre'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="valuation"
          name="valuation"
          checked={formData.valuation}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="valuation" className="ml-2 block text-sm text-gray-900">
          Ha sido valorado
        </label>
      </div>

      {formData.valuation ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="precioCliente" className="block text-sm font-medium text-gray-700 mb-1">
                Precio Cliente
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="precioCliente"
                  id="precioCliente"
                  value={formData.precioCliente || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">€</span>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="precioSM" className="block text-sm font-medium text-gray-700 mb-1">
                Precio SM
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="precioSM"
                  id="precioSM"
                  value={formData.precioSM || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">€</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Beneficio: <span className="text-green-600 font-bold">€{beneficio.toLocaleString('es-ES')}</span></p>
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
            Valor
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="number"
              name="value"
              id="value"
              value={formData.value}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">€</span>
            </div>
          </div>
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