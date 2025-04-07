'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import { createAssignment, updateAssignment } from './actions';
import { Client } from '@/types/client';
import { getClients } from '../clients/actions';
import { Assignment } from '@/types/property';
import { Switch } from '@headlessui/react';

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

  // Estados para los toggles
  const [sellerFeeIsPercentage, setSellerFeeIsPercentage] = useState(formData.sellerFeeType === 'PERCENTAGE');
  const [buyerFeeIsPercentage, setBuyerFeeIsPercentage] = useState(formData.buyerFeeType === 'PERCENTAGE');

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

  // Efecto para actualizar los valores de comisión cuando cambia el precio o el tipo de comisión
  useEffect(() => {
    if (sellerFeeIsPercentage) {
      // Si es porcentaje, calcular el 3% del precio
      const percentageValue = formData.price * 0.03;
      setFormData(prev => ({
        ...prev,
        sellerFeeType: 'PERCENTAGE',
        sellerFeeValue: percentageValue
      }));
    } else {
      // Si es fijo, establecer 3000€
      setFormData(prev => ({
        ...prev,
        sellerFeeType: 'FIXED',
        sellerFeeValue: 3000
      }));
    }
  }, [formData.price, sellerFeeIsPercentage]);

  useEffect(() => {
    if (buyerFeeIsPercentage) {
      // Si es porcentaje, calcular el 3% del precio
      const percentageValue = formData.price * 0.03;
      setFormData(prev => ({
        ...prev,
        buyerFeeType: 'PERCENTAGE',
        buyerFeeValue: percentageValue
      }));
    } else {
      // Si es fijo, establecer 3000€
      setFormData(prev => ({
        ...prev,
        buyerFeeType: 'FIXED',
        buyerFeeValue: 3000
      }));
    }
  }, [formData.price, buyerFeeIsPercentage]);

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

  // Función para formatear números con separadores de miles y decimales
  const formatNumber = (num: number) => {
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Comisión vendedor</h3>
          <div className="flex space-x-2 mb-2">
            <button
              type="button"
              onClick={() => setSellerFeeIsPercentage(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                sellerFeeIsPercentage
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Porcentaje (3%)
            </button>
            <button
              type="button"
              onClick={() => setSellerFeeIsPercentage(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                !sellerFeeIsPercentage
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Fijo (3.000€)
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {sellerFeeIsPercentage 
              ? `Valor calculado: ${formatNumber(formData.price * 0.03)}€` 
              : 'Valor fijo: 3.000€'}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Comisión comprador</h3>
          <div className="flex space-x-2 mb-2">
            <button
              type="button"
              onClick={() => setBuyerFeeIsPercentage(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                buyerFeeIsPercentage
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Porcentaje (3%)
            </button>
            <button
              type="button"
              onClick={() => setBuyerFeeIsPercentage(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                !buyerFeeIsPercentage
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Fijo (3.000€)
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {buyerFeeIsPercentage 
              ? `Valor calculado: ${formatNumber(formData.price * 0.03)}€` 
              : 'Valor fijo: 3.000€'}
          </p>
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