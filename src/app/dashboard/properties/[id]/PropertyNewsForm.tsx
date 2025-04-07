'use client';

import { useState } from 'react';
import { createPropertyNews } from '../actions';
import { toast } from 'react-hot-toast';

interface PropertyNewsFormProps {
  propertyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface NewsFormData {
  type: string;
  action: string;
  valuation: string;
  priority: 'HIGH' | 'LOW';
  responsible: string;
  value: number;
  precioSM: number;
  precioCliente: number;
}

export default function PropertyNewsForm({ propertyId, onSuccess, onCancel }: PropertyNewsFormProps) {
  const [formData, setFormData] = useState<NewsFormData>({
    type: '',
    action: '',
    valuation: '',
    priority: 'LOW',
    responsible: '',
    value: 0,
    precioSM: 0,
    precioCliente: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createPropertyNews(propertyId, formData);
      toast.success('Noticia creada correctamente');
      onSuccess();
    } catch (error) {
      console.error('Error creating news:', error);
      if (error instanceof Error && error.message === 'Ya existe una noticia para esta propiedad') {
        toast.error('Ya existe una noticia para esta propiedad');
      } else {
        toast.error('Error al crear la noticia');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Crear Noticia</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <input
              type="text"
              name="type"
              id="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-700">
              Acción
            </label>
            <textarea
              name="action"
              id="action"
              value={formData.action}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="valuation" className="block text-sm font-medium text-gray-700">
              Valoración
            </label>
            <input
              type="text"
              name="valuation"
              id="valuation"
              value={formData.valuation}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
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

          <div>
            <label htmlFor="responsible" className="block text-sm font-medium text-gray-700">
              Responsable
            </label>
            <input
              type="text"
              name="responsible"
              id="responsible"
              value={formData.responsible}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700">
              Valor
            </label>
            <input
              type="number"
              name="value"
              id="value"
              value={formData.value}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="precioSM" className="block text-sm font-medium text-gray-700">
              Precio SM
            </label>
            <input
              type="number"
              name="precioSM"
              id="precioSM"
              value={formData.precioSM}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="precioCliente" className="block text-sm font-medium text-gray-700">
              Precio Cliente
            </label>
            <input
              type="number"
              name="precioCliente"
              id="precioCliente"
              value={formData.precioCliente}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 