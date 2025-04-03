'use client';

import { useState } from 'react';
import { Activity } from '@/types/property';

interface ActivityFormProps {
  propertyId: string;
  onSubmit: (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function ActivityForm({ propertyId, onSubmit, onCancel }: ActivityFormProps) {
  const [type, setType] = useState<Activity['type']>('Llamada');
  const [status, setStatus] = useState<Activity['status']>('Programada');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // Formato YYYY-MM-DDThh:mm
  });
  const [client, setClient] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      status,
      date,
      client,
      notes,
      propertyId
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Tipo
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as Activity['type'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="Llamada">Llamada</option>
          <option value="Contacto Directo">Contacto Directo</option>
          <option value="Visita">Visita</option>
          <option value="Email">Email</option>
          <option value="WhatsApp">WhatsApp</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Estado
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Activity['status'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="Programada">Programada</option>
          <option value="Realizada">Realizada</option>
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Fecha
        </label>
        <input
          type="datetime-local"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notas
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Guardar
        </button>
      </div>
    </form>
  );
} 