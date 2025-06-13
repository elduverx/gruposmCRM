import { useState, useEffect } from 'react';
import { PropertyCreateInput, PropertyType, PropertyAction, OperationType } from '@/types/property';
import { PropertyStatus } from '@prisma/client';
import { Dialog } from '@headlessui/react';
import { createClient, getClients } from '@/app/dashboard/clients/actions';
import ClientForm from '@/app/dashboard/clients/components/ClientForm';
import { toast } from 'sonner';
import { useUsers } from '@/hooks/useUsers';
import { 
  HomeIcon, 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon, 
  BuildingOfficeIcon, 
  HomeModernIcon, 
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  UserGroupIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface PropertyFormProps {
  onSubmit: (data: PropertyCreateInput) => void;
  initialData?: Partial<PropertyCreateInput>;
  onCancel?: () => void;
  zones?: { id: string; name: string }[];
}

export default function PropertyForm({ onSubmit, initialData, onCancel, zones }: PropertyFormProps) {
  const { users: availableUsers } = useUsers();
  const [formData, setFormData] = useState<PropertyCreateInput>({
    address: initialData?.address || '',
    population: initialData?.population || '',
    status: initialData?.status || OperationType.SALE,
    action: initialData?.action || PropertyAction.IR_A_DIRECCION,
    type: initialData?.type || PropertyType.PISO,
    ownerName: initialData?.ownerName || '',
    ownerPhone: initialData?.ownerPhone || '',
    captureDate: initialData?.captureDate || null,
    responsibleId: initialData?.responsibleId || null,
    hasSimpleNote: initialData?.hasSimpleNote || false,
    isOccupied: initialData?.isOccupied || false,
    clientId: initialData?.clientId || null,
    zoneId: initialData?.zoneId || null,
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null,
    occupiedBy: initialData?.occupiedBy || null,
    occupiedByName: initialData?.occupiedByName || null,
    isLocated: initialData?.isLocated || false,
    responsible: initialData?.responsible || '',
    habitaciones: initialData?.habitaciones || null,
    banos: initialData?.banos || null,
    metrosCuadrados: initialData?.metrosCuadrados || null,
    parking: initialData?.parking || false,
    ascensor: initialData?.ascensor || false,
    piscina: initialData?.piscina || false,
  });
  
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [occupiedByType, setOccupiedByType] = useState<'OWNER' | 'TENANT' | 'NONE'>(
    initialData?.isOccupied 
      ? initialData?.occupiedBy 
        ? 'TENANT' 
        : 'OWNER'
      : 'NONE'
  );
  const { users } = useUsers();

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Error al cargar los clientes');
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        clientId: clientId,
        ownerName: selectedClient.name,
        ownerPhone: selectedClient.phone || ''
      }));
    }
  };

  const handleCreateClient = async (clientData: any) => {
    try {
      const newClient = await createClient(clientData);
      setClients(prev => [...prev, newClient]);
      setFormData(prev => ({
        ...prev,
        clientId: newClient.id,
        ownerName: newClient.name,
        ownerPhone: newClient.phone || ''
      }));
      setIsCreateClientOpen(false);
      toast.success('Cliente creado con éxito');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Error al crear el cliente');
    }
  };

  const handleCreateTenant = async (tenantData: any) => {
    try {
      const newTenant = await createClient({
        ...tenantData,
        isTenant: true // Marcar como inquilino
      });
      setClients(prev => [...prev, newTenant]);
      setFormData(prev => ({
        ...prev,
        occupiedBy: newTenant.id,
        occupiedByName: newTenant.name,
        isOccupied: true
      }));
      setOccupiedByType('TENANT');
      setIsCreateTenantOpen(false);
      toast.success('Inquilino creado con éxito');
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error('Error al crear el inquilino');
    }
  };

  const handleOccupiedByChange = (type: 'OWNER' | 'TENANT' | 'NONE') => {
    setOccupiedByType(type);
    setFormData(prev => ({
      ...prev,
      isOccupied: type !== 'NONE',
      occupiedBy: type === 'OWNER' ? null : prev.occupiedBy,
      occupiedByName: type === 'OWNER' || type === 'NONE' ? null : prev.occupiedByName
    }));
  };

  // Función para obtener el nombre del inquilino seleccionado
  const getSelectedTenantName = () => {
    return formData.occupiedByName || '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'occupiedBy' && value) {
      // Si se está seleccionando un inquilino, también guardar su nombre
      const selectedTenant = clients.find(client => client.id === value);
      setFormData(prev => ({
        ...prev,
        [name]: value || null,
        occupiedByName: selectedTenant ? selectedTenant.name : null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value ? Number(value) : null) : value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <HomeIcon className="h-5 w-5 mr-2 text-blue-600" />
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="population" className="block text-sm font-medium text-gray-700">
                Población
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="population"
                  name="population"
                  value={formData.population}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700">
                Zona
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="zoneId"
                  name="zoneId"
                  value={formData.zoneId || ''}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Seleccionar zona</option>
                  {zones?.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipo de Propiedad
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HomeModernIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  {Object.values(PropertyType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CheckCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  {Object.values(PropertyStatus).map((status) => (
                    <option key={status} value={status}>
                      {status === 'SIN_EMPEZAR' ? 'Sin empezar' : 
                       status === 'EMPEZADA' ? 'Empezada' : 
                       status === 'SOLD' ? 'Vendida' : status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700">
                Acción
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <XCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="action"
                  name="action"
                  value={formData.action}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  {Object.values(PropertyAction).map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>
            </div>


          </div>
        </div>

        {/* Información del Propietario */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
            Información del Propietario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                Propietario
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="clientId"
                  name="clientId"
                  value={formData.clientId || ''}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
            </div>

            <div>
              <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
                Teléfono del Propietario
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <div className="relative rounded-md shadow-sm flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="ownerPhone"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateClientOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Crear Cliente
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ocupado por */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
            Ocupado por
          </h3>
          
          {/* Selector de tipo de ocupación */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="occupiedBy"
                  value="NONE"
                  checked={occupiedByType === 'NONE'}
                  onChange={() => handleOccupiedByChange('NONE')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">No ocupado</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="occupiedBy"
                  value="OWNER"
                  checked={occupiedByType === 'OWNER'}
                  onChange={() => handleOccupiedByChange('OWNER')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Propietario</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="occupiedBy"
                  value="TENANT"
                  checked={occupiedByType === 'TENANT'}
                  onChange={() => handleOccupiedByChange('TENANT')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Inquilino</span>
              </label>
            </div>
          </div>

          {/* Selector de inquilino si está ocupado por inquilino */}
          {occupiedByType === 'TENANT' && (
            <div className="space-y-4">
              {/* Mostrar inquilino seleccionado si existe */}
              {formData.occupiedBy && getSelectedTenantName() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">
                        Inquilino actual: {getSelectedTenantName()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, occupiedBy: null }))}
                      className="text-green-600 hover:text-green-800 text-sm underline"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.occupiedBy && getSelectedTenantName() ? 'Cambiar Inquilino' : 'Seleccionar Inquilino'}
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="tenantId"
                      name="occupiedBy"
                      value={formData.occupiedBy || ''}
                      onChange={handleInputChange}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Seleccionar inquilino</option>
                      {clients.filter(client => client.isTenant).map(tenant => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setIsCreateTenantOpen(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Agregar Inquilino
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Información si está ocupado por el propietario */}
          {occupiedByType === 'OWNER' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  La propiedad está ocupada por el propietario
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Características de la Propiedad */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <HomeModernIcon className="h-5 w-5 mr-2 text-blue-600" />
            Características de la Propiedad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="habitaciones" className="block text-sm font-medium text-gray-700">
                Habitaciones
              </label>
              <input
                type="number"
                id="habitaciones"
                name="habitaciones"
                value={formData.habitaciones || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="banos" className="block text-sm font-medium text-gray-700">
                Baños
              </label>
              <input
                type="number"
                id="banos"
                name="banos"
                value={formData.banos || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="metrosCuadrados" className="block text-sm font-medium text-gray-700">
                Metros Cuadrados
              </label>
              <input
                type="number"
                id="metrosCuadrados"
                name="metrosCuadrados"
                value={formData.metrosCuadrados || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="parking"
                name="parking"
                checked={formData.parking}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="parking" className="text-sm font-medium text-gray-700">
                Parking
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="ascensor"
                name="ascensor"
                checked={formData.ascensor}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="ascensor" className="text-sm font-medium text-gray-700">
                Ascensor
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="piscina"
                name="piscina"
                checked={formData.piscina}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="piscina" className="text-sm font-medium text-gray-700">
                Piscina
              </label>
            </div>
          </div>
        </div>

        {/* Responsable */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <UsersIcon className="h-5 w-5 mr-2 text-blue-600" />
            Responsable
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="responsibleId" className="block text-sm font-medium text-gray-700">
                Responsable
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UsersIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="responsibleId"
                  name="responsibleId"
                  value={formData.responsibleId || ''}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Seleccionar responsable</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Guardar
          </button>
        </div>
      </form>

      {/* Crear Cliente Modal */}
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

      {/* Crear Inquilino Modal */}
      <Dialog
        open={isCreateTenantOpen}
        onClose={() => setIsCreateTenantOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-sm"></div>
            <Dialog.Panel className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  🏠 Nuevo Inquilino
                </Dialog.Title>
                <button
                  onClick={() => setIsCreateTenantOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ClientForm
                onSubmit={handleCreateTenant}
                onCancel={() => setIsCreateTenantOpen(false)}
              />
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </>
  );
}