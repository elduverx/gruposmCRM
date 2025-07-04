'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { Activity, ActivityType } from '@/types/activity';

interface ActivityListProps {
  activities: Activity[];
  onCreateActivity: (data: any) => Promise<void>;
  isLoading: boolean;
}

const getActivityTypeDisplay = (type: ActivityType): string => {
  switch (type) {
    case ActivityType.LLAMADA:
      return 'Llamada';
    case ActivityType.VISITA:
      return 'Visita';
    case ActivityType.DPV:
      return 'DPV';
    case ActivityType.NOTICIA:
      return 'Noticia';
    case ActivityType.ENCARGO:
      return 'Encargo';
    case ActivityType.EMAIL:
      return 'Email';
    case ActivityType.OTROS:
      return 'Otros';
    default:
      return type;
  }
};

export function ActivityList({ activities, onCreateActivity, isLoading }: ActivityListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: ActivityType.LLAMADA,
    status: 'Pendiente', // Set default status
    date: new Date().toISOString().split('T')[0],
    client: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateActivity(formData);
    setIsFormOpen(false);
    setFormData({
      type: ActivityType.LLAMADA,
      status: 'Pendiente',
      date: new Date().toISOString().split('T')[0],
      client: '',
      notes: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Lista de Actividades</h3>
        <Button onClick={() => setIsFormOpen(true)}>
          Nueva Actividad
        </Button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
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
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    const newStatus = formData.status === 'Pendiente' ? 'Realizada' : 'Pendiente';
                    handleChange({
                      target: { name: 'status', value: newStatus }
                    } as React.ChangeEvent<HTMLSelectElement>);
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.status === 'Realizada' ? 'bg-blue-600' : 'bg-gray-200'
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
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cliente</label>
              <input
                type="text"
                name="client"
                value={formData.client}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notas</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              maxLength={191}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="mt-1 text-sm text-gray-500 text-right">
              {formData.notes.length}/191 caracteres
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                <p className="font-medium">Tipo: {getActivityTypeDisplay(activity.type)}</p>
                {activity.client && <p className="text-sm">Cliente: {activity.client}</p>}
                {activity.notes && <p className="text-sm mt-1">{activity.notes}</p>}
              </div>
              <span className={`px-2 py-1 text-sm rounded-full ${
                activity.status === 'Completada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {activity.status || 'Pendiente'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}