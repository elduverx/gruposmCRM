import { useState } from 'react';
import { PropertyCreateInput, PropertyType, PropertyAction, OperationType } from '@/types/property';
import { 
  HomeIcon, 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon, 
  BuildingOfficeIcon, 
  HomeModernIcon, 
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface PropertyFormProps {
  onSubmit: (data: PropertyCreateInput) => void;
  initialData?: Partial<PropertyCreateInput>;
  onCancel?: () => void;
  zones?: { id: string; name: string }[];
}

export default function PropertyForm({ onSubmit, initialData, onCancel, zones }: PropertyFormProps) {
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
    isLocated: initialData?.isLocated || false,
    responsible: initialData?.responsible || null,
    habitaciones: initialData?.habitaciones || null,
    banos: initialData?.banos || null,
    metrosCuadrados: initialData?.metrosCuadrados || null,
    parking: initialData?.parking || false,
    ascensor: initialData?.ascensor || false,
    piscina: initialData?.piscina || false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : null) : value
    }));
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <HomeIcon className="h-5 w-5 mr-2 text-blue-600" />
          Información Básica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {Object.values(OperationType).map((status) => (
                  <option key={status} value={status}>
                    {status === 'SALE' ? 'Venta' : 'Alquiler'}
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
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
          Información del Propietario
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
              Nombre del Propietario
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleInputChange}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
              Teléfono del Propietario
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
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
          </div>
        </div>
      </div>

      {/* Características de la Propiedad */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <HomeIcon className="h-5 w-5 mr-2 text-blue-600" />
          Características de la Propiedad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="habitaciones" className="block text-sm font-medium text-gray-700">
              Habitaciones
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="habitaciones"
                name="habitaciones"
                value={formData.habitaciones || ''}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                min="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="banos" className="block text-sm font-medium text-gray-700">
              Baños
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="banos"
                name="banos"
                value={formData.banos || ''}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                min="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="metrosCuadrados" className="block text-sm font-medium text-gray-700">
              Metros Cuadrados
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="metrosCuadrados"
                name="metrosCuadrados"
                value={formData.metrosCuadrados || ''}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Amenidades</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="parking"
                name="parking"
                checked={formData.parking}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="parking" className="ml-2 block text-sm text-gray-700">
                Parking
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="ascensor"
                name="ascensor"
                checked={formData.ascensor}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="ascensor" className="ml-2 block text-sm text-gray-700">
                Ascensor
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="piscina"
                name="piscina"
                checked={formData.piscina}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="piscina" className="ml-2 block text-sm text-gray-700">
                Piscina
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
} 