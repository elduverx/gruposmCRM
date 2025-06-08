'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { createPropertyNews } from '@/app/dashboard/properties/actions';
import { useUsers } from '@/hooks/useUsers';

interface PropertyNewsFormProps {
  propertyId: string;
  onSuccess: (data: NewsFormData) => void;
  onCancel: () => void;
}

interface NewsFormData {
  type: string;
  action: string;
  valuation: string;
  priority: 'HIGH' | 'LOW';
  responsible: string;
  value: number;
  precioSM: number | null;
  precioCliente: number | null;
}

export default function PropertyNewsForm({ propertyId, onSuccess, onCancel }: PropertyNewsFormProps) {
  const [loading, setLoading] = useState(false);
  const { users } = useUsers();
  const [formData, setFormData] = useState<NewsFormData>({
    type: 'DPV',
    action: 'Venta',
    valuation: 'No',
    priority: 'LOW',
    responsible: '',
    value: 0,
    precioSM: null,
    precioCliente: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked ? 'Si' : 'No',
        ...(name === 'valuation' && !checkbox.checked ? {
          precioSM: null,
          precioCliente: null
        } : {})
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convertir valuation de string a boolean
      const newsData = {
        ...formData,
        valuation: formData.valuation === 'Si'
      };
      
      await createPropertyNews(propertyId, newsData);
      toast.success('Noticia creada correctamente');
      onSuccess(formData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating news:', error);
      if (error instanceof Error && error.message === 'Ya existe una noticia para esta propiedad') {
        toast.error('Ya existe una noticia para esta propiedad');
      } else {
        toast.error('Error al crear la noticia');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Crear Noticia</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Principal</h3>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <select
                    name="type"
                    id="type"
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
                  <label htmlFor="action" className="block text-sm font-medium text-gray-700">
                    Acción
                  </label>
                  <select
                    name="action"
                    id="action"
                    value={formData.action}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="Venta">Venta</option>
                    <option value="Alquiler">Alquiler</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Prioridad
                  </label>
                  <select
                    name="priority"
                    id="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="HIGH">Alta</option>
                    <option value="LOW">Baja</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Responsable</h3>
                <div>
                  <label htmlFor="responsible" className="block text-sm font-medium text-gray-700">
                    Seleccionar Responsable
                  </label>
                  <select
                    id="responsible"
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
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Valoración y Precios</h3>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="valuation"
                    id="valuation"
                    checked={formData.valuation === 'Si'}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="valuation" className="ml-2 block text-sm text-gray-900">
                    Ha sido valorado
                  </label>
                </div>

                <div>
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                    Valor
                  </label>
                  <div className="relative rounded-md shadow-sm mt-1">
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

                {formData.valuation === 'Si' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="precioSM" className="block text-sm font-medium text-gray-700">
                        Precio SM
                      </label>
                      <div className="relative rounded-md shadow-sm mt-1">
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

                    <div>
                      <label htmlFor="precioCliente" className="block text-sm font-medium text-gray-700">
                        Precio Cliente
                      </label>
                      <div className="relative rounded-md shadow-sm mt-1">
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
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}