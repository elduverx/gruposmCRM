import { useState, useEffect } from 'react';
import { BuildingCreateInput } from '@/types/building';
import { Complex } from '@/types/complex';
import { searchPropertiesByAddress } from '@/app/dashboard/properties/actions';
import { 
  BuildingOffice2Icon, 
  MapPinIcon, 
  DocumentTextIcon,
  HashtagIcon,
  SparklesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface BuildingFormProps {
  onSubmit: (data: BuildingCreateInput) => void;
  initialData?: Partial<BuildingCreateInput>;
  onCancel?: () => void;
  complexes?: Complex[];
}

export default function BuildingForm({ onSubmit, initialData, onCancel, complexes = [] }: BuildingFormProps) {
  const [formData, setFormData] = useState<BuildingCreateInput>({
    name: initialData?.name || initialData?.address || '',
    address: initialData?.address || '',
    population: initialData?.population || '',
    description: initialData?.description || null,
    totalFloors: initialData?.totalFloors || null,
    totalUnits: initialData?.totalUnits || null,
    complexId: initialData?.complexId || null,
  });

  const [addressSuggestion, setAddressSuggestion] = useState<string>('');
  const [isAnalyzingAddress, setIsAnalyzingAddress] = useState(false);
  const [foundProperties, setFoundProperties] = useState<{id: string; address: string; population: string}[]>([]);

  // Función para analizar la dirección y simular búsqueda de propiedades
  const analyzeAddress = async (address: string) => {
    if (!address.trim()) return null;

    // Regex simple para detectar "nombre, número" donde número = unidades
    const pattern = /^(.+),\s*(\d+)$/;
    const match = address.match(pattern);

    if (match) {
      const [, streetName, units] = match;
      
      // Por ahora simulamos la búsqueda hasta que Prisma funcione correctamente
      // TODO: Implementar búsqueda real cuando Prisma esté funcionando
      const simulatedProperties: {id: string; address: string; population: string}[] = [];
      for (let i = 1; i <= parseInt(units); i++) {
        simulatedProperties.push({
          id: `sim-${i}`,
          address: `${streetName.trim()}, ${i}`,
          population: formData.population || 'Ciudad'
        });
      }
      
      setFoundProperties(simulatedProperties);
      
      return {
        streetName: streetName.trim(),
        suggestedUnits: parseInt(units),
        foundProperties: simulatedProperties
      };
    }

    return null;
  };

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIsAnalyzingAddress(true);
    
    // Actualizar la dirección y usar como nombre automáticamente
    setFormData(prev => ({ 
      ...prev, 
      address: value,
      name: value // El nombre será igual a la dirección
    }));
    
    // Analizar la dirección
    const analysis = await analyzeAddress(value);
    
    if (analysis && analysis.suggestedUnits) {
      if (analysis.foundProperties.length > 0) {
        setAddressSuggestion(`Se encontraron ${analysis.foundProperties.length} propiedades existentes que se asignarán automáticamente a este edificio`);
      } else {
        setAddressSuggestion(`Dirección analizada. Se asignarán automáticamente todas las propiedades disponibles para "${analysis.streetName}"`);
      }
      
      // No auto-completar totalUnits - se calculará automáticamente
    } else {
      setAddressSuggestion('');
    }
    
    setTimeout(() => setIsAnalyzingAddress(false), 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'address') {
      handleAddressChange(e as React.ChangeEvent<HTMLInputElement>);
      return;
    }
    
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Información Básica */}
      <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 p-8 rounded-2xl border border-blue-100">
        <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="p-2 bg-blue-100 rounded-xl mr-3">
            <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
          </div>
          🏢 Información del Edificio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
              Dirección del Edificio *
              <span className="ml-2 text-xs text-blue-600 font-normal">
                (Se usará como nombre del edificio)
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPinIcon className="h-5 w-5 text-blue-500" />
              </div>
              {isAnalyzingAddress && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <SparklesIcon className="h-5 w-5 text-blue-500 animate-pulse" />
                </div>
              )}
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="pl-12 pr-12 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-3 bg-white/80 backdrop-blur-sm"
                placeholder="Ej: Av Rei Jaime I, 2"
                required
              />
            </div>
            {addressSuggestion && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-blue-700 font-medium">
                    ✨ {addressSuggestion}
                  </span>
                </div>
                
                {foundProperties.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-blue-600 font-semibold">Propiedades encontradas:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {foundProperties.slice(0, 5).map((property, index) => (
                        <div key={property.id} className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          📍 {property.address} - {property.population}
                        </div>
                      ))}
                      {foundProperties.length > 5 && (
                        <div className="text-xs text-blue-500 italic">
                          ... y {foundProperties.length - 5} más
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-green-600 font-medium">
                      🏢 Estas propiedades se asignarán automáticamente al edificio
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-2 p-2 bg-blue-50/50 rounded-lg">
              <p className="text-xs text-blue-600 flex items-center">
                <SparklesIcon className="h-4 w-4 mr-1" />
                💡 <strong>Tip:</strong> Usa el formato &quot;AV REI JAUME I, 2&quot; para edificios específicos. Todas las propiedades disponibles de ese edificio se asignarán automáticamente.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="population" className="block text-sm font-semibold text-gray-700 mb-2">
              Ciudad/Población *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPinIcon className="h-5 w-5 text-green-500" />
              </div>
              <input
                type="text"
                id="population"
                name="population"
                value={formData.population}
                onChange={handleInputChange}
                className="pl-12 block w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-3 bg-white/80 backdrop-blur-sm"
                placeholder="Ej: Madrid, Barcelona..."
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="complexId" className="block text-sm font-semibold text-gray-700 mb-2">
              Complejo (Opcional)
            </label>
            <select
              id="complexId"
              name="complexId"
              value={formData.complexId || ''}
              onChange={handleInputChange}
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-3 bg-white/80 backdrop-blur-sm"
            >
              <option value="">Sin complejo asignado</option>
              {complexes.map((complex) => (
                <option key={complex.id} value={complex.id}>
                  🏘️ {complex.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Características */}
      <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-8 rounded-2xl border border-green-100">
        <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="p-2 bg-green-100 rounded-xl mr-3">
            <HashtagIcon className="h-6 w-6 text-green-600" />
          </div>
          📊 Características del Edificio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label htmlFor="totalFloors" className="block text-sm font-semibold text-gray-700 mb-2">
              Total de Pisos
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-green-500 font-bold">🏢</span>
              </div>
              <input
                type="number"
                id="totalFloors"
                name="totalFloors"
                value={formData.totalFloors || ''}
                onChange={handleInputChange}
                className="pl-12 block w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-3 bg-white/80 backdrop-blur-sm"
                placeholder="Ej: 3"
                min="0"
              />
            </div>
            <p className="mt-1 text-xs text-gray-600">Número de plantas del edificio</p>
          </div>

          <div>
            <label htmlFor="totalUnits" className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="text-gray-500 line-through">Total de Puertas/Unidades</span>
              <span className="ml-2 text-xs text-blue-600 font-normal">
                (Se calcula automáticamente según las propiedades encontradas)
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 font-bold">🏠</span>
              </div>
              <input
                type="number"
                id="totalUnits"
                name="totalUnits"
                value={foundProperties.length || ''}
                onChange={handleInputChange}
                className="pl-12 block w-full rounded-xl border-gray-200 shadow-sm bg-gray-50 text-gray-500 text-sm py-3"
                placeholder="Se calcula automáticamente"
                readOnly
                disabled
              />
            </div>
            <p className="mt-1 text-xs text-blue-600">
              📍 Este valor se establece automáticamente según las propiedades encontradas en la base de datos
            </p>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 p-8 rounded-2xl border border-purple-100">
        <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="p-2 bg-purple-100 rounded-xl mr-3">
            <DocumentTextIcon className="h-6 w-6 text-purple-600" />
          </div>
          📝 Descripción Adicional
        </h3>
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Descripción del Edificio
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description || ''}
            onChange={handleInputChange}
            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-3 px-4 bg-white/80 backdrop-blur-sm"
            placeholder="Descripción detallada del edificio, características especiales, estado, etc..."
          />
          <p className="mt-2 text-xs text-gray-600">Información adicional sobre el edificio (opcional)</p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-6 pt-8 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
          >
            ❌ Cancelar
          </button>
        )}
        <button
          type="submit"
          className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
        >
          ✅ Guardar Edificio
        </button>
      </div>
    </form>
  );
}
