import { useState } from 'react';
import { ComplexCreateInput } from '@/types/complex';
import { 
  BuildingLibraryIcon, 
  MapPinIcon, 
  DocumentTextIcon,
  HashtagIcon,
  SparklesIcon,
  InformationCircleIcon
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
    description: initialData?.description || null,
    totalBuildings: initialData?.totalBuildings || null,
  });

  const [addressSuggestion, setAddressSuggestion] = useState<string>('');
  const [isAnalyzingAddress, setIsAnalyzingAddress] = useState(false);

  // Función para analizar la dirección del complejo y extraer información
  const analyzeComplexAddress = (address: string) => {
    if (!address.trim()) return null;

    // Regex para detectar patrones como "Complejo Residencial Músico, 5" o "Urbanización Músico, 5"
    const complexPattern = /^(.+?)(?:,\s*(\d+))?$/;
    const match = address.match(complexPattern);

    if (match) {
      const [, complexName, buildingCount] = match;
      return {
        complexName: complexName.trim(),
        suggestedBuildings: buildingCount ? parseInt(buildingCount) : null
      };
    }

    return null;
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIsAnalyzingAddress(true);
    
    // Actualizar la dirección
    setFormData(prev => ({ ...prev, address: value }));
    
    // Analizar la dirección
    const analysis = analyzeComplexAddress(value);
    
    if (analysis && analysis.suggestedBuildings) {
      setAddressSuggestion(`Se detectaron ${analysis.suggestedBuildings} edificios en el complejo`);
      
      // Auto-completar el total de edificios si no se ha establecido manualmente
      if (!formData.totalBuildings) {
        setFormData(prev => ({ ...prev, totalBuildings: analysis.suggestedBuildings }));
      }
    } else {
      setAddressSuggestion('');
    }
    
    setTimeout(() => setIsAnalyzingAddress(false), 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 p-8 rounded-2xl border border-purple-100">
        <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="p-2 bg-purple-100 rounded-xl mr-3">
            <BuildingLibraryIcon className="h-6 w-6 text-purple-600" />
          </div>
          🏘️ Información del Complejo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Complejo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <BuildingLibraryIcon className="h-5 w-5 text-purple-500" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="pl-12 block w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-3 bg-white/80 backdrop-blur-sm"
                placeholder="Ej: Residencial Músico"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
              Dirección del Complejo *
              <span className="ml-2 text-xs text-purple-600 font-normal">
                (Formato: Residencial Músico, 5)
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPinIcon className="h-5 w-5 text-purple-500" />
              </div>
              {isAnalyzingAddress && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <SparklesIcon className="h-5 w-5 text-purple-500 animate-pulse" />
                </div>
              )}
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="pl-12 pr-12 block w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-3 bg-white/80 backdrop-blur-sm"
                placeholder="Ej: Residencial Músico, 5"
                required
              />
            </div>
            {addressSuggestion && (
              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center">
                  <InformationCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-sm text-purple-700 font-medium">
                    ✨ {addressSuggestion}
                  </span>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-600">
              💡 <strong>Tip:</strong> Usa el formato &quot;Residencial Músico, 5&quot; donde el número después de la coma indica la cantidad de edificios
            </p>
          </div>

          <div>
            <label htmlFor="population" className="block text-sm font-semibold text-gray-700 mb-2">
              Población *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPinIcon className="h-5 w-5 text-purple-500" />
              </div>
              <input
                type="text"
                id="population"
                name="population"
                value={formData.population}
                onChange={handleInputChange}
                className="pl-12 block w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-3 bg-white/80 backdrop-blur-sm"
                placeholder="Ej: Valencia"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="totalBuildings" className="block text-sm font-semibold text-gray-700 mb-2">
              Total de Edificios Estimado
              {addressSuggestion && (
                <span className="ml-2 text-xs text-purple-600 font-normal">
                  (Auto-detectado)
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-purple-500 font-bold">🏢</span>
              </div>
              <input
                type="number"
                id="totalBuildings"
                name="totalBuildings"
                value={formData.totalBuildings || ''}
                onChange={handleInputChange}
                className={`pl-12 block w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-3 bg-white/80 backdrop-blur-sm ${
                  addressSuggestion ? 'bg-purple-50 border-purple-200' : ''
                }`}
                placeholder="Ej: 5"
                min="0"
              />
            </div>
            <p className="mt-1 text-xs text-gray-600">Número estimado de edificios en el complejo</p>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 p-8 rounded-2xl border border-indigo-100">
        <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="p-2 bg-indigo-100 rounded-xl mr-3">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
          </div>
          📝 Descripción del Complejo
        </h3>
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Descripción del Complejo
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description || ''}
            onChange={handleInputChange}
            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3 px-4 bg-white/80 backdrop-blur-sm"
            placeholder="Descripción detallada del complejo, características, servicios, ubicación estratégica, etc..."
          />
          <p className="mt-2 text-xs text-gray-600">Información adicional sobre el complejo residencial (opcional)</p>
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
          className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 border border-transparent rounded-xl shadow-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105"
        >
          ✅ Guardar Complejo
        </button>
      </div>
    </form>
  );
}
