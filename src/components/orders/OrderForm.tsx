'use client';

import { useState, useEffect } from 'react';
import { Order, OrderCreateInput } from '@/types/order';
import { Client } from '@/types/client';
import { PropertyType } from '@/types/property';
import { UserIcon, HomeIcon, CurrencyEuroIcon, HomeModernIcon, HomeModernIcon as BathroomIcon, PlusIcon, ExclamationCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';
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
    features: order?.features || [],
    desiredLocation: order?.desiredLocation || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Actualiza formData cuando cambia el order prop
  useEffect(() => {
    console.log("OrderForm - order cambió:", order);
    setFormData({
      clientId: order?.client?.id || '',
      operationType: order?.operationType || 'SALE',
      bedrooms: order?.bedrooms || 1,
      bathrooms: order?.bathrooms || 1,
      minPrice: order?.minPrice || 0,
      maxPrice: order?.maxPrice || 0,
      propertyType: order?.propertyType || PropertyType.PISO,
      features: order?.features || [],
      desiredLocation: order?.desiredLocation || ''
    });
    
    // Resetea los errores cuando cambia el order
    setErrors({});
    setIsSubmitting(false);
  }, [order]);

  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [currentClients, setCurrentClients] = useState<Client[]>(clients);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Debes seleccionar un cliente';
    }

    if (formData.bedrooms <= 0) {
      newErrors.bedrooms = 'Debe ser mayor que 0';
    }

    if (formData.bathrooms <= 0) {
      newErrors.bathrooms = 'Debe ser mayor que 0';
    }
    
    if (formData.minPrice < 0) {
      newErrors.minPrice = 'No puede ser un valor negativo';
    }
    
    if (formData.maxPrice < 0) {
      newErrors.maxPrice = 'No puede ser un valor negativo';
    }
    
    if (formData.maxPrice < formData.minPrice) {
      newErrors.maxPrice = 'El precio máximo debe ser mayor que el precio mínimo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // El estado del modal se maneja en el componente padre
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      toast.error('Error al procesar el pedido');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Izquierda - Información del Cliente y Operación */}
            <div className="space-y-6">
              {/* Tarjeta de Cliente */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">👤 Cliente</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="group">
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Cliente
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className={`h-5 w-5 ${errors.clientId ? 'text-red-500' : 'text-blue-500'} transition-colors duration-200`} />
                      </div>
                      <select
                        id="clientId"
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50/50 border-2 ${
                          errors.clientId ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                        } rounded-xl shadow-sm focus:ring-2 focus:bg-white transition-all duration-200 text-gray-800 text-sm`}
                        required
                      >
                        <option value="">Seleccionar cliente</option>
                        {currentClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                      {errors.clientId && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    {errors.clientId && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                        {errors.clientId}
                      </p>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsCreateClientOpen(true)}
                    className="group relative w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl blur opacity-60 group-hover:opacity-80 transition-opacity"></span>
                    <span className="relative flex items-center justify-center">
                      <PlusIcon className="h-5 w-5 mr-2" />
                      ➕ Agregar Nuevo Cliente
                    </span>
                  </button>
                </div>
              </div>

              {/* Tarjeta de Tipo de Operación */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CurrencyEuroIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">💼 Tipo de Operación</h3>
                </div>
                
                <div className="group">
                  <label htmlFor="operationType" className="block text-sm font-medium text-gray-700 mb-2">
                    Operación Deseada
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyEuroIcon className="h-5 w-5 text-purple-500 transition-colors duration-200" />
                    </div>
                    <select
                      id="operationType"
                      name="operationType"
                      value={formData.operationType}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:bg-white transition-all duration-200 text-gray-800 text-sm"
                      required
                    >
                      <option value="SALE">💰 Venta</option>
                      <option value="RENT">🏠 Alquiler</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha - Requisitos de la Propiedad */}
            <div className="space-y-6">
              {/* Tarjeta de Tipo y Características */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <HomeIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">🏠 Tipo de Propiedad</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="group">
                    <label htmlFor="desiredLocation" className="block text-sm font-medium text-gray-700 mb-2">
                      Sitio donde desea el inmueble
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPinIcon className="h-5 w-5 text-emerald-500 transition-colors duration-200" />
                      </div>
                      <input
                        type="text"
                        id="desiredLocation"
                        name="desiredLocation"
                        value={formData.desiredLocation || ''}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all duration-200 text-gray-800 text-sm"
                        placeholder="Ej: Centro, Barrio Norte, Calle..."
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Inmueble
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HomeIcon className="h-5 w-5 text-emerald-500 transition-colors duration-200" />
                      </div>
                      <select
                        id="propertyType"
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all duration-200 text-gray-800 text-sm"
                        required
                      >
                        <option value={PropertyType.PISO}>🏠 Piso</option>
                        <option value={PropertyType.CHALET}>🏘️ Chalet</option>
                        <option value={PropertyType.CASA}>🏡 Casa</option>
                        <option value={PropertyType.APARTAMENTO}>🏢 Apartamento</option>
                        <option value={PropertyType.ATICO}>🏙️ Ático</option>
                        <option value={PropertyType.DUPLEX}>🏗️ Dúplex</option>
                        <option value={PropertyType.TERRENO}>🌾 Terreno</option>
                        <option value={PropertyType.LOCAL_COMERCIAL}>🏪 Local Comercial</option>
                        <option value={PropertyType.OFICINA}>🏢 Oficina</option>
                        <option value={PropertyType.GARAJE}>🚗 Garaje</option>
                        <option value={PropertyType.TRASTERO}>📦 Trastero</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                      <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-2">
                        Habitaciones
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HomeModernIcon className="h-5 w-5 text-emerald-500 transition-colors duration-200" />
                        </div>
                        <input
                          type="number"
                          id="bedrooms"
                          name="bedrooms"
                          value={formData.bedrooms}
                          onChange={handleChange}
                          min="1"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all duration-200 text-gray-800 text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-2">
                        Baños
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BathroomIcon className="h-5 w-5 text-emerald-500 transition-colors duration-200" />
                        </div>
                        <input
                          type="number"
                          id="bathrooms"
                          name="bathrooms"
                          value={formData.bathrooms}
                          onChange={handleChange}
                          min="1"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all duration-200 text-gray-800 text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Presupuesto */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CurrencyEuroIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">💰 Presupuesto</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label htmlFor="minPrice" className={`block text-sm font-medium ${errors.minPrice ? 'text-red-700' : 'text-gray-700'} mb-2`}>
                      Precio Mínimo (€)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CurrencyEuroIcon className={`h-5 w-5 ${errors.minPrice ? 'text-red-500' : 'text-indigo-500'} transition-colors duration-200`} />
                      </div>
                      <input
                        type="number"
                        id="minPrice"
                        name="minPrice"
                        value={formData.minPrice}
                        onChange={handleChange}
                        min="0"
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50/50 border-2 ${
                          errors.minPrice ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100'
                        } rounded-xl shadow-sm focus:ring-2 focus:bg-white transition-all duration-200 text-gray-800 text-sm`}
                        required
                        placeholder="0"
                      />
                      {errors.minPrice && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    {errors.minPrice && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                        {errors.minPrice}
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label htmlFor="maxPrice" className={`block text-sm font-medium ${errors.maxPrice ? 'text-red-700' : 'text-gray-700'} mb-2`}>
                      Precio Máximo (€)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CurrencyEuroIcon className={`h-5 w-5 ${errors.maxPrice ? 'text-red-500' : 'text-indigo-500'} transition-colors duration-200`} />
                      </div>
                      <input
                        type="number"
                        id="maxPrice"
                        name="maxPrice"
                        value={formData.maxPrice}
                        onChange={handleChange}
                        min="0"
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50/50 border-2 ${
                          errors.maxPrice ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100'
                        } rounded-xl shadow-sm focus:ring-2 focus:bg-white transition-all duration-200 text-gray-800 text-sm`}
                        required
                        placeholder="0"
                      />
                      {errors.maxPrice && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    {errors.maxPrice && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                        {errors.maxPrice}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Características Deseadas - Ancho completo */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">⭐ Características Deseadas</h3>
            </div>
            
            <div className="group">
              <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-2">
                Características que debe tener la propiedad
                <span className="text-xs text-gray-500 ml-2">(Separadas por coma)</span>
              </label>
              <textarea
                id="features"
                name="features"
                value={formData.features.join(', ')}
                onChange={(e) => {
                  const featureList = e.target.value
                    .split(',')
                    .map((item) => item.trim())
                    .filter((item) => item.length > 0);
                  setFormData((prev) => ({
                    ...prev,
                    features: featureList
                  }));
                }}
                className="w-full py-3 px-4 bg-gray-50/50 border-2 border-gray-200 rounded-xl shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all duration-200 text-gray-800 text-sm resize-none"
                rows={4}
                placeholder="Ejemplo: Terraza, Piscina, Ascensor, Garaje, Aire acondicionado, Calefacción central, Parquet, Cocina equipada..."
              />
              <p className="mt-2 text-xs text-gray-500 flex items-center">
                <svg className="h-4 w-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                Introduce las características separadas por comas para ayudar a encontrar la propiedad perfecta.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-center gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
            >
              ❌ Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative px-8 py-3 bg-gradient-to-r font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                isSubmitting 
                  ? 'from-gray-400 to-gray-500 cursor-not-allowed' 
                  : 'from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
              } text-white`}
            >
              <span className={`absolute inset-0 rounded-xl blur opacity-60 transition-opacity ${
                isSubmitting ? 'bg-gray-400' : 'bg-gradient-to-r from-orange-600 to-red-700 group-hover:opacity-80'
              }`}></span>
              <span className="relative flex items-center">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {order ? '🔄 Actualizando...' : '📝 Creando...'}
                  </>
                ) : (
                  <>
                    {order ? '💾 Actualizar Pedido' : '✨ Crear Pedido'}
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>

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
