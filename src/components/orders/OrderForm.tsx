'use client';

import { useState } from 'react';
import { Order, OrderCreateInput } from '@/types/order';
import { Client } from '@/types/client';
import { PropertyType } from '@/types/property';
import { UserIcon, HomeIcon, CurrencyEuroIcon, HomeModernIcon, HomeModernIcon as BathroomIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { createClient } from '@/app/dashboard/clients/actions';
import ClientForm from '@/app/dashboard/clients/components/ClientForm';
import { toast } from 'sonner';

interface OrderFormProps {
  order?: Order | null;
  clients: Client[];
  onSubmit: (data: OrderCreateInput) => void;
  onCancel: () => void;
  onClientCreated?: (client: Client) => void;
}

export default function OrderForm({
  order,
  clients,
  onSubmit,
  onCancel,
  onClientCreated
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

  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [currentClients, setCurrentClients] = useState<Client[]>(clients);

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

  const handleCreateClient = async (clientData: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    relatedProperties: string[];
    hasRequest: boolean;
  }) => {
    try {
      const newClient = await createClient(clientData);
      setCurrentClients(prev => [...prev, newClient]);
      setFormData(prev => ({
        ...prev,
        clientId: newClient.id
      }));
      setIsCreateClientOpen(false);
      onClientCreated?.(newClient);
      toast.success('Cliente creado con éxito');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Error al crear el cliente');
    }
  };

  return (
    <>
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
            <div className="space-y-2">
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
                  {currentClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateClientOpen(true)}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                ➕ Agregar Cliente
              </button>
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

      {/* Modal de Nuevo Cliente */}
      <Dialog
        open={isCreateClientOpen}
        onClose={() => setIsCreateClientOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
          
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-sm"></div>
            <Dialog.Panel className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ✨ Nuevo Cliente
                </Dialog.Title>
                <button
                  onClick={() => setIsCreateClientOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ClientForm
                onSubmit={handleCreateClient}
                onCancel={() => setIsCreateClientOpen(false)}
              />
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </>
  );
} 