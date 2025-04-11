// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import { getClients } from '../clients/actions';
import { Client } from '@/types/client';

interface PropertyFormProps {
  initialData: {
    id: string;
    address: string;
    population: string;
    status: string;
    action: string;
    ownerName: string;
    ownerPhone: string;
    captureDate: string;
    responsibleId: string | null;
    hasSimpleNote: boolean;
    isOccupied: boolean;
    clientId: string | null;
    zoneId: string | null;
    latitude: number | null;
    longitude: number | null;
    occupiedBy: string | null;
    type: string;
    isLocated: boolean;
    responsible: string | null;
  } | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export function PropertyForm({ initialData, onSubmit, isLoading }: PropertyFormProps) {
  const [formData, setFormData] = useState(initialData || {
    id: '',
    address: '',
    population: '',
    status: '',
    action: '',
    ownerName: '',
    ownerPhone: '',
    captureDate: new Date().toISOString().split('T')[0],
    responsibleId: null,
    hasSimpleNote: false,
    isOccupied: false,
    clientId: null,
    zoneId: null,
    latitude: null,
    longitude: null,
    occupiedBy: null,
    type: '',
    isLocated: false,
    responsible: null,
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      captureDate: new Date(formData.captureDate).toISOString(),
      zoneId: formData.zoneId || null
    };
    await onSubmit(formattedData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (name === 'zoneId') {
      setFormData(prev => ({
        ...prev,
        zoneId: value || null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const selectedClient = clients.find(client => client.id === clientId);
    
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        id: prev.id || '',
        clientId: clientId,
        ownerName: selectedClient.name,
        ownerPhone: selectedClient.phone || ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Dirección</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Población</label>
          <input
            type="text"
            name="population"
            value={formData.population}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar estado</option>
            <option value="AVAILABLE">Disponible</option>
            <option value="OCCUPIED">Ocupado</option>
            <option value="IN_PROCESS">En proceso</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Acción</label>
          <select
            name="action"
            value={formData.action}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar acción</option>
            <option value="SALE">Venta</option>
            <option value="RENT">Alquiler</option>
            <option value="BOTH">Ambos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Propietario</label>
          <select
            name="clientId"
            value={formData.clientId || ''}
            onChange={handleClientSelect}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar propietario</option>
            {isLoadingClients ? (
              <option value="" disabled>Cargando clientes...</option>
            ) : (
              clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono del propietario</label>
          <input
            type="tel"
            name="ownerPhone"
            value={formData.ownerPhone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha de captura</label>
          <input
            type="date"
            name="captureDate"
            value={formData.captureDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar tipo</option>
            <option value="Casa">Casa</option>
            <option value="Apartamento">Apartamento</option>
            <option value="Local">Local</option>
            <option value="Oficina">Oficina</option>
          </select>
        </div>

        <div className="col-span-2">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isLocated"
                checked={formData.isLocated}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Localizado</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="isOccupied"
                checked={formData.isOccupied}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Ocupado</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="hasSimpleNote"
                checked={formData.hasSimpleNote}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Nota simple</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
} 