import { useState } from 'react';
import { ComplexCreateInput } from '@/types/complex';
import { 
  BuildingLibraryIcon, 
  MapPinIcon, 
  DocumentTextIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';

interface ComplexFormProps {
  onSubmit: (data: ComplexCreateInput) => void;
  initialData?: Partial<ComplexCreateInput>;
  onCancel?: () => void;
}

export default function ComplexForm({ onSubmit, initialData, onCancel }: ComplexFormProps) {
  const [formData, setFormData] = useState<ComplexCreateInput>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    population: initialData?.population || '',
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null,
    description: initialData?.description || null,
    totalBuildings: initialData?.totalBuildings || null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : null) : value || null
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <BuildingLibraryIcon className="h-5 w-5 mr-2 text-purple-600" />
          Información del Complejo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre del Complejo *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingLibraryIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Dirección *
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
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="population" className="block text-sm font-medium text-gray-700">
              Población *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="population"
                name="population"
                value={formData.population}
                onChange={handleInputChange}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="totalBuildings" className="block text-sm font-medium text-gray-700">
              Total de Edificios Estimado
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HashtagIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="totalBuildings"
                name="totalBuildings"
                value={formData.totalBuildings || ''}
                onChange={handleInputChange}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2 text-purple-600" />
          Coordenadas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
              Latitud
            </label>
            <input
              type="number"
              id="latitude"
              name="latitude"
              value={formData.latitude || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              step="any"
            />
          </div>

          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
              Longitud
            </label>
            <input
              type="number"
              id="longitude"
              name="longitude"
              value={formData.longitude || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              step="any"
            />
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-600" />
          Descripción
        </h3>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            placeholder="Descripción del complejo..."
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Guardar Complejo
        </button>
      </div>
    </form>
  );
}
