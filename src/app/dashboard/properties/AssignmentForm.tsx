'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import { createAssignment, updateAssignment } from './actions';
import { Client } from '@/types/client';
import { getClients } from '../clients/actions';
import { Assignment } from '@/types/property';
import {
  HomeIcon,
  CalendarIcon,
  UserIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import ClientForm from '@/app/dashboard/clients/components/ClientForm';
import { createClient } from '@/app/dashboard/clients/actions';
import { toast } from 'sonner';

interface AssignmentFormProps {
  propertyId: string;
  initialData?: Assignment | null;
  onSuccess?: () => void;
}

export function AssignmentForm({ propertyId, initialData, onSuccess }: AssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
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
      // Validación del cliente
      if (!formData.clientId) {
        alert('Por favor selecciona un cliente');
        setLoading(false);
        return;
      }

      // Validación de la propiedad
      if (!propertyId) {
        alert('Por favor selecciona una propiedad');
        setLoading(false);
        return;
      }

      // Validación del precio
      if (!formData.price || formData.price <= 0) {
        alert('El precio debe ser mayor que 0');
        setLoading(false);
        return;
      }

      // Validación de la fecha de exclusividad
      if (!formData.exclusiveUntil) {
        alert('La fecha de exclusividad es requerida');
        setLoading(false);
        return;
      }

      // Validación del tipo de operación
      if (!formData.type || !['SALE', 'RENT'].includes(formData.type)) {
        alert('El tipo de operación no es válido');
        setLoading(false);
        return;
      }

      console.log('Enviando datos del formulario:', {
        clientId: formData.clientId,
        propertyId,
        price: formData.price,
        type: formData.type,
        exclusiveUntil: formData.exclusiveUntil
      });

      const dataToSubmit = {
        type: formData.type,
        price: parseFloat(formData.price.toString()),
        exclusiveUntil: new Date(formData.exclusiveUntil).toISOString(), // Convert Date to ISO string
        origin: formData.origin,
        clientId: formData.clientId,
        sellerFeeType: formData.sellerFeeType,
        sellerFeeValue: parseFloat(formData.sellerFeeValue.toString()),
        buyerFeeType: formData.buyerFeeType,
        buyerFeeValue: parseFloat(formData.buyerFeeValue.toString()),
        propertyId,
      };

      try {
        if (initialData) {
          console.log('Actualizando encargo existente:', initialData.id);
          const result = await updateAssignment(initialData.id, dataToSubmit);
          if (result) {
            console.log('Encargo actualizado exitosamente');
            onSuccess?.();
          } else {
            console.error('Error al actualizar el encargo');
            alert('Error al actualizar el encargo');
          }
        } else {
          console.log('Creando nuevo encargo');
          const result = await createAssignment(dataToSubmit);
          if (result) {
            console.log('Encargo creado exitosamente');
            onSuccess?.();
          } else {
            console.error('Error al crear el encargo');
            alert('Error al crear el encargo');
          }
        }
      } catch (error) {
        console.error('Error en la operación:', error);
        alert(error instanceof Error ? error.message : 'Error al procesar el encargo');
      }
    } catch (error) {
      console.error('Error en el formulario:', error);
      alert(error instanceof Error ? error.message : 'Error al procesar el formulario');
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

  const handleClientCreated = (newClient: Client) => {
    setClients(prev => [...prev, newClient]);
    setFormData(prev => ({ ...prev, clientId: newClient.id }));
    setIsCreateClientOpen(false);
    toast.success('Cliente creado exitosamente');
  };

  const handleCreateClient = async (clientData: any) => {
    try {
      const newClient = await createClient(clientData);
      setClients(prev => [...prev, newClient]);
      setFormData(prev => ({
        ...prev,
        clientId: newClient.id
      }));
      setIsCreateClientOpen(false);
      toast.success('Cliente creado con éxito');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Error al crear el cliente');
    }
  };

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

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto px-6">
        {/* Encabezado */}
        <div className="border-b border-gray-200 pb-4 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HomeIcon className="h-5 w-5 text-indigo-600" />
            {initialData ? 'Editar encargo' : 'Nuevo encargo'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Complete los detalles del encargo para {initialData ? 'actualizar' : 'crear'} el registro
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-16 gap-8">
          {/* Columna principal - Información básica */}
          <div className="xl:col-span-11 space-y-8">
            {/* Información básica */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
                Información básica
              </h3>              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de operación
                  </label>
                  <div className="mt-1 relative">
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="SALE">Venta</option>
                      <option value="RENT">Alquiler</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <BanknotesIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 pl-10 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                      min="0"
                      step="0.01"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 sm:text-sm">€</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente
                  </label>
                  <div className="mt-1 space-y-3">
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <select
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 pl-10 pr-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                    <button
                      type="button"
                      onClick={() => setIsCreateClientOpen(true)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      ➕ Agregar Cliente
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha límite de exclusividad
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="date"
                      name="exclusiveUntil"
                      value={formData.exclusiveUntil}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className='col-span-1 lg:col-span-2'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origen
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      name="origin"
                      value={formData.origin}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                      placeholder="Ej: Idealista, Portal Inmobiliario, Referido"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna lateral - Comisiones */}
          <div className="xl:col-span-12">
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-4 md:p-6 sticky top-[100px]">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                Comisiones
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Comisión vendedor */}
                <div className="space-y-6 p-4 md:p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900">Comisión vendedor</h4>
                  <div className="flex space-x-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setSellerFeeIsPercentage(true)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        sellerFeeIsPercentage
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 ring-2 ring-indigo-600 ring-offset-2'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Porcentaje
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellerFeeIsPercentage(false)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        !sellerFeeIsPercentage
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 ring-2 ring-indigo-600 ring-offset-2'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Fijo
                    </button>
                  </div>

                  {sellerFeeIsPercentage ? (
                    <div className="relative">
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
                      <p className="text-sm text-gray-500 mt-2 p-2 bg-white rounded-md">
                        Valor calculado: <span className="font-medium text-gray-900">{formatNumber(formData.sellerFeeValue)}€</span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Monto fijo (€)</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          name="sellerFeeFixed"
                          value={formData.sellerFeeFixed}
                          onChange={handleChange}
                          className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          min="0"
                          step="0.01"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500 sm:text-sm">€</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comisión comprador */}
                <div className="space-y-6 p-4 md:p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900">Comisión comprador</h4>
                  <div className="flex space-x-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setBuyerFeeIsPercentage(true)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        buyerFeeIsPercentage
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 ring-2 ring-indigo-600 ring-offset-2'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Porcentaje
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyerFeeIsPercentage(false)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        !buyerFeeIsPercentage
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 ring-2 ring-indigo-600 ring-offset-2'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Fijo
                    </button>
                  </div>

                  {buyerFeeIsPercentage ? (
                    <div className="relative">
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
                      <p className="text-sm text-gray-500 mt-2 p-2 bg-white rounded-md">
                        Valor calculado: <span className="font-medium text-gray-900">{formatNumber(formData.buyerFeeValue)}€</span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Monto fijo (€)</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          name="buyerFeeFixed"
                          value={formData.buyerFeeFixed}
                          onChange={handleChange}
                          className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          min="0"
                          step="0.01"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500 sm:text-sm">€</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-4 pb-6 px-4 -mx-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : initialData ? (
              'Actualizar'
            ) : (
              'Crear'
            )}
          </Button>
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