'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
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
    sellerFeePercentage: 3, // Valor por defecto para el porcentaje
    sellerFeeFixed: 3000, // Valor por defecto para el monto fijo
    buyerFeeType: initialData?.buyerFeeType || 'PERCENTAGE',
    buyerFeeValue: initialData?.buyerFeeValue || 0,
    buyerFeePercentage: 3, // Valor por defecto para el porcentaje
    buyerFeeFixed: 3000, // Valor por defecto para el monto fijo
  });

  // Estados para los toggles
  const [sellerFeeIsPercentage, setSellerFeeIsPercentage] = useState(formData.sellerFeeType === 'PERCENTAGE');
  const [buyerFeeIsPercentage, setBuyerFeeIsPercentage] = useState(formData.buyerFeeType === 'PERCENTAGE');

  useEffect(() => {
    // Inicializar los valores personalizados si hay datos iniciales
    if (initialData) {
      if (initialData.sellerFeeType === 'PERCENTAGE') {
        // Calcular el porcentaje a partir del valor
        const percentageValue = (initialData.sellerFeeValue / initialData.price) * 100;
        setFormData(prev => ({
          ...prev,
          sellerFeePercentage: parseFloat(percentageValue.toFixed(2))
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          sellerFeeFixed: initialData.sellerFeeValue
        }));
      }

      if (initialData.buyerFeeType === 'PERCENTAGE') {
        // Calcular el porcentaje a partir del valor
        const percentageValue = (initialData.buyerFeeValue / initialData.price) * 100;
        setFormData(prev => ({
          ...prev,
          buyerFeePercentage: parseFloat(percentageValue.toFixed(2))
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          buyerFeeFixed: initialData.buyerFeeValue
        }));
      }
    }
  }, [initialData]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  // Efecto para actualizar los valores de comisión cuando cambia el precio o el tipo de comisión
  useEffect(() => {
    if (sellerFeeIsPercentage) {
      // Calcular el valor basado en el porcentaje personalizado
      const percentageValue = formData.price * (formData.sellerFeePercentage / 100);
      setFormData(prev => ({
        ...prev,
        sellerFeeType: 'PERCENTAGE',
        sellerFeeValue: percentageValue
      }));
    } else {
      // Usar el valor fijo personalizado
      setFormData(prev => ({
        ...prev,
        sellerFeeType: 'FIXED',
        sellerFeeValue: prev.sellerFeeFixed
      }));
    }
  }, [formData.price, formData.sellerFeePercentage, formData.sellerFeeFixed, sellerFeeIsPercentage]);

  useEffect(() => {
    if (buyerFeeIsPercentage) {
      // Calcular el valor basado en el porcentaje personalizado
      const percentageValue = formData.price * (formData.buyerFeePercentage / 100);
      setFormData(prev => ({
        ...prev,
        buyerFeeType: 'PERCENTAGE',
        buyerFeeValue: percentageValue
      }));
    } else {
      // Usar el valor fijo personalizado
      setFormData(prev => ({
        ...prev,
        buyerFeeType: 'FIXED',
        buyerFeeValue: prev.buyerFeeFixed
      }));
    }
  }, [formData.price, formData.buyerFeePercentage, formData.buyerFeeFixed, buyerFeeIsPercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.clientId) {
        alert('Por favor selecciona un cliente');
        return;
      }

      if (!propertyId) {
        alert('Por favor selecciona una propiedad');
        return;
      }

      const dataToSubmit = {
        type: formData.type,
        price: parseFloat(formData.price.toString()),
        exclusiveUntil: new Date(formData.exclusiveUntil),
        origin: formData.origin,
        clientId: formData.clientId,
        sellerFeeType: formData.sellerFeeType,
        sellerFeeValue: parseFloat(formData.sellerFeeValue.toString()),
        buyerFeeType: formData.buyerFeeType,
        buyerFeeValue: parseFloat(formData.buyerFeeValue.toString()),
        propertyId,
      };

      if (initialData) {
        const success = await updateAssignment(initialData.id, dataToSubmit);
        if (success) {
          onSuccess?.();
        }
      } else {
        const success = await createAssignment(dataToSubmit);
        if (success) {
          onSuccess?.();
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
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
              Porcentaje
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
              Fijo
            </button>
          </div>

          {sellerFeeIsPercentage ? (
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700">Porcentaje (%)</label>
              <input
                type="number"
                name="sellerFeePercentage"
                value={formData.sellerFeePercentage}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor calculado: {formatNumber(formData.sellerFeeValue)}€
              </p>
            </div>
          ) : (
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700">Monto fijo (€)</label>
              <input
                type="number"
                name="sellerFeeFixed"
                value={formData.sellerFeeFixed}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="0"
                step="0.01"
              />
            </div>
          )}
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
              Porcentaje
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
              Fijo
            </button>
          </div>

          {buyerFeeIsPercentage ? (
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700">Porcentaje (%)</label>
              <input
                type="number"
                name="buyerFeePercentage"
                value={formData.buyerFeePercentage}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor calculado: {formatNumber(formData.buyerFeeValue)}€
              </p>
            </div>
          ) : (
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700">Monto fijo (€)</label>
              <input
                type="number"
                name="buyerFeeFixed"
                value={formData.buyerFeeFixed}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="0"
                step="0.01"
              />
            </div>
          )}
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