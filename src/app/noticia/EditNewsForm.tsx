'use client';

import { useState } from 'react';
import { PropertyNews } from '@/types/property';
import { updatePropertyNews } from './actions';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditNewsFormProps {
  news: PropertyNews;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditNewsForm({ news, onClose, onSuccess }: EditNewsFormProps) {
  const [formData, setFormData] = useState({
    type: news.type,
    action: news.action,
    valuation: news.valuation,
    priority: news.priority,
    responsible: news.responsible || '',
    value: news.value || 0,
    precioSM: news.precioSM || 0,
    precioCliente: news.precioCliente || 0,
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
      const updatedNews = await updatePropertyNews(news.id, formData);
      if (updatedNews) {
        toast.success('Noticia actualizada correctamente');
        onSuccess();
      } else {
        toast.error('Error al actualizar la noticia');
      }
    } catch (error) {
      console.error('Error updating news:', error);
      toast.error('Error al actualizar la noticia');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Editar Noticia</h2>
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
                <select
                  name="valuation"
                  id="valuation"
                  value={formData.valuation.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, valuation: e.target.value === 'true' }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
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
                        value={formData.precioSM}
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
                        value={formData.precioCliente}
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
                <textarea
                  name="action"
                  id="action"
                  value={formData.action}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                  placeholder="Describe la acción a realizar"
                />
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
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 