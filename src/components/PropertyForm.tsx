import { useState } from 'react';
import { PropertyCreateInput, PropertyType, PropertyStatus, PropertyAction, OperationType } from '@/types/property';
//comment
interface PropertyFormProps {
  onSubmit: (data: PropertyCreateInput) => void;
  initialData?: Partial<PropertyCreateInput>;
}

export default function PropertyForm({ onSubmit, initialData }: PropertyFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Dirección
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="population" className="block text-sm font-medium text-gray-700">
          Población
        </label>
        <input
          type="text"
          id="population"
          name="population"
          value={formData.population}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Tipo
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          {Object.values(PropertyType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Estado
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          {Object.values(OperationType).map((status) => (
            <option key={status} value={status}>
              {status === 'SALE' ? 'Venta' : 'Alquiler'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="action" className="block text-sm font-medium text-gray-700">
          Acción
        </label>
        <select
          id="action"
          name="action"
          value={formData.action}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          {Object.values(PropertyAction).map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
          Nombre del Propietario
        </label>
        <input
          type="text"
          id="ownerName"
          name="ownerName"
          value={formData.ownerName}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
          Teléfono del Propietario
        </label>
        <input
          type="tel"
          id="ownerPhone"
          name="ownerPhone"
          value={formData.ownerPhone}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="parking"
            name="parking"
            checked={formData.parking}
            onChange={handleCheckboxChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="piscina" className="ml-2 block text-sm text-gray-700">
            Piscina
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Guardar
        </button>
      </div>
    </form>
  );
} 