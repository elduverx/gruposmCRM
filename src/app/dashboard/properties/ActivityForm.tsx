'use client';

import { useState } from 'react';
import { Activity, ActivityType } from '@/types/activity';

interface ActivityFormProps {
  // propertyId es requerido por el componente padre para asociar la actividad con la propiedad,
  // aunque no se use directamente en el formulario
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  propertyId: string;
  onSubmit: (data: Omit<Activity, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export function ActivityForm({ propertyId, onSubmit, onCancel }: ActivityFormProps) {
  const [formData, setFormData] = useState({
    type: ActivityType.LLAMADA,
    status: 'Pendiente',  // Estado por defecto 'Pendiente'
    date: new Date().toISOString().split('T')[0],
    client: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      property: null
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Tipo
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value={ActivityType.LLAMADA}>Llamada</option>
          <option value={ActivityType.VISITA}>Visita</option>
          <option value={ActivityType.DPV}>DPV</option>
          <option value={ActivityType.NOTICIA}>Noticia</option>
          <option value={ActivityType.ENCARGO}>Encargo</option>
          <option value={ActivityType.EMAIL}>Email</option>
          <option value={ActivityType.OTROS}>Otros</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Estado
        </label>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              const newStatus = formData.status === 'Pendiente' ? 'Realizada' : 'Pendiente';
              handleChange({
                target: { name: 'status', value: newStatus }
              } as React.ChangeEvent<HTMLSelectElement>);
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              formData.status === 'Realizada' ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formData.status === 'Realizada' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-gray-500">{formData.status}</span>
        </div>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Fecha
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="client" className="block text-sm font-medium text-gray-700">
          Cliente
        </label>
        <input
          type="text"
          id="client"
          name="client"
          value={formData.client}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          maxLength={500}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <div className="mt-1 text-sm text-gray-500 text-right">
          {formData.notes.length}/500 caracteres
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}