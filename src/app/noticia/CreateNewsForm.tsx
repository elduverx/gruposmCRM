'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { getProperties } from '@/app/dashboard/properties/actions';
import { createPropertyNews } from '@/app/dashboard/properties/actions';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateNewsFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface NewsFormData {
  propertyId: string;
  type: string;
  action: string;
  valuation: boolean;
  priority: 'HIGH' | 'LOW';
  responsible: string;
  value: number;
  precioSM: number | null;
  precioCliente: number | null;
}

export default function CreateNewsForm({ onClose, onSuccess }: CreateNewsFormProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NewsFormData>({
    propertyId: '',
    type: 'DPV',
    action: 'Venta',
    valuation: false,
    priority: 'LOW',
    responsible: '',
    value: 0,
    precioSM: null,
    precioCliente: null,
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const propertiesData = await getProperties();
        setProperties(propertiesData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching properties:', error);
        toast.error('Error al cargar los inmuebles');
      }
    };

    fetchProperties();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked,
        // Si valuation es false, establecer los precios a null
        ...(name === 'valuation' && !checkbox.checked ? {
          precioSM: null,
          precioCliente: null
        } : {})
      }));
    } else if (type === 'number') {
      const numValue = value === '' ? null : parseFloat(value);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createPropertyNews(formData.propertyId, {
        type: formData.type,
        action: formData.action,
        valuation: formData.valuation,
        priority: formData.priority,
        responsible: formData.responsible,
        value: formData.value,
        precioSM: formData.precioSM,
        precioCliente: formData.precioCliente,
      });
      toast.success('Noticia creada correctamente');
      onSuccess();
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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Crear Noticia</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">Cerrar</span>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Inmueble
                </label>
                <select
                  name="propertyId"
                  id="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Seleccionar inmueble</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.address} - {property.population}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <input
                  type="text"
                  name="type"
                  id="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                  placeholder="Ej: Venta, Alquiler"
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  name="priority"
                  id="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="HIGH">Alta</option>
                  <option value="LOW">Baja</option>
                </select>
              </div>

              <div>
                <label htmlFor="valuation" className="block text-sm font-medium text-gray-700 mb-1">
                  Valoración
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="checkbox"
                    name="valuation"
                    id="valuation"
                    checked={formData.valuation}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="valuation" className="ml-2 block text-sm text-gray-900">
                    Ha sido valorado
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="responsible" className="block text-sm font-medium text-gray-700 mb-1">
                  Responsable
                </label>
                <input
                  type="text"
                  name="responsible"
                  id="responsible"
                  value={formData.responsible}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Nombre del responsable"
                />
              </div>

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

              {formData.valuation && (
                <>
                  <div>
                    <label htmlFor="precioSM" className="block text-sm font-medium text-gray-700 mb-1">
                      Precio SM
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        name="precioSM"
                        id="precioSM"
                        value={formData.precioSM === null ? '' : formData.precioSM}
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
                    <label htmlFor="precioCliente" className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Cliente
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        name="precioCliente"
                        id="precioCliente"
                        value={formData.precioCliente === null ? '' : formData.precioCliente}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="0"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">€</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

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
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 