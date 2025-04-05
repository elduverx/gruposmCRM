'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createAssignment, updateAssignment } from './actions';
import { Client } from '@/types/client';
import { getClients } from '../clients/actions';
import { Assignment } from '@/types/property';

interface AssignmentFormProps {
  propertyId: string;
  initialData?: Assignment | null;
  onSuccess?: () => void;
}

export function AssignmentForm({ propertyId, initialData, onSuccess }: AssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    type: initialData?.type || 'SALE',
    price: initialData?.price || 0,
    exclusiveUntil: initialData?.exclusiveUntil ? new Date(initialData.exclusiveUntil).toISOString().split('T')[0] : '',
    origin: initialData?.origin || '',
    clientId: initialData?.clientId || '',
    sellerFeeType: initialData?.sellerFeeType || 'PERCENTAGE',
    sellerFeeValue: initialData?.sellerFeeValue || 0,
    buyerFeeType: initialData?.buyerFeeType || 'PERCENTAGE',
    buyerFeeValue: initialData?.buyerFeeValue || 0,
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.clientId) {
        alert('Por favor selecciona un cliente');
        return;
      }

      const data = {
        ...formData,
        price: parseFloat(formData.price.toString()),
        exclusiveUntil: new Date(formData.exclusiveUntil),
        sellerFeeValue: parseFloat(formData.sellerFeeValue.toString()),
        buyerFeeValue: parseFloat(formData.buyerFeeValue.toString()),
        propertyId,
      };

      if (initialData) {
        const success = await updateAssignment(initialData.id, data);
        if (success) {
          onSuccess?.();
        }
      } else {
        const success = await createAssignment(data);
        if (success) {
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="SALE">Venta</option>
          <option value="RENT">Alquiler</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Precio</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Fecha límite de exclusividad</label>
        <input
          type="date"
          name="exclusiveUntil"
          value={formData.exclusiveUntil}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Origen</label>
        <input
          type="text"
          name="origin"
          value={formData.origin}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Cliente</label>
        <select
          name="clientId"
          value={formData.clientId}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="">Selecciona un cliente</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de comisión vendedor</label>
          <select
            name="sellerFeeType"
            value={formData.sellerFeeType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="PERCENTAGE">Porcentaje</option>
            <option value="FIXED">Fijo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Valor comisión vendedor</label>
          <input
            type="number"
            name="sellerFeeValue"
            value={formData.sellerFeeValue}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de comisión comprador</label>
          <select
            name="buyerFeeType"
            value={formData.buyerFeeType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="PERCENTAGE">Porcentaje</option>
            <option value="FIXED">Fijo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Valor comisión comprador</label>
          <input
            type="number"
            name="buyerFeeValue"
            value={formData.buyerFeeValue}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
} 