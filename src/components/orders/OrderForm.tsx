'use client';

import { useState } from 'react';
import { Order, OrderCreateInput } from '@/types/order';
import { Client } from '@/types/client';
import { PropertyType } from '@/types/property';
import { UserIcon, HomeIcon, CurrencyEuroIcon, HomeModernIcon, HomeModernIcon as BathroomIcon } from '@heroicons/react/24/outline';

interface OrderFormProps {
  order?: Order | null;
  clients: Client[];
  onSubmit: (data: OrderCreateInput) => void;
  onCancel: () => void;
}

export default function OrderForm({
  order,
  clients,
  onSubmit,
  onCancel
}: OrderFormProps) {
  const [formData, setFormData] = useState<OrderCreateInput>({
    clientId: order?.client.id || '',
    operationType: order?.operationType || 'SALE',
    bedrooms: order?.bedrooms || 1,
    bathrooms: order?.bathrooms || 1,
    minPrice: order?.minPrice || 0,
    maxPrice: order?.maxPrice || 0,
    propertyType: order?.propertyType || PropertyType.PISO,
    features: order?.features || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'minPrice' || name === 'maxPrice' || name === 'bedrooms' || name === 'bathrooms'
        ? parseFloat(value)
        : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cliente */}
        <div className="relative">
          <label
            htmlFor="clientId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Cliente
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="">Seleccionar cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tipo de Operación */}
        <div className="relative">
          <label
            htmlFor="operationType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tipo de Operación
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyEuroIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="operationType"
              name="operationType"
              value={formData.operationType}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="SALE">Venta</option>
              <option value="RENT">Alquiler</option>
            </select>
          </div>
        </div>

        {/* Tipo de Propiedad */}
        <div className="relative">
          <label
            htmlFor="propertyType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tipo de Propiedad
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HomeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value={PropertyType.PISO}>Piso</option>
              <option value={PropertyType.CHALET}>Chalet</option>
              <option value={PropertyType.CASA}>Casa</option>
              <option value={PropertyType.APARTAMENTO}>Apartamento</option>
              <option value={PropertyType.ATICO}>Ático</option>
              <option value={PropertyType.DUPLEX}>Dúplex</option>
              <option value={PropertyType.TERRENO}>Terreno</option>
              <option value={PropertyType.LOCAL_COMERCIAL}>Local Comercial</option>
              <option value={PropertyType.OFICINA}>Oficina</option>
              <option value={PropertyType.GARAJE}>Garaje</option>
              <option value={PropertyType.TRASTERO}>Trastero</option>
            </select>
          </div>
        </div>

        {/* Habitaciones */}
        <div className="relative">
          <label
            htmlFor="bedrooms"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Habitaciones
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HomeModernIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="bedrooms"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              min="1"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>

        {/* Baños */}
        <div className="relative">
          <label
            htmlFor="bathrooms"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Baños
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BathroomIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="bathrooms"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              min="1"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>

        {/* Precio Mínimo */}
        <div className="relative">
          <label
            htmlFor="minPrice"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Precio Mínimo (€)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyEuroIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              value={formData.minPrice}
              onChange={handleChange}
              min="0"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>

        {/* Precio Máximo */}
        <div className="relative">
          <label
            htmlFor="maxPrice"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Precio Máximo (€)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyEuroIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              value={formData.maxPrice}
              onChange={handleChange}
              min="0"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
        >
          {order ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
} 