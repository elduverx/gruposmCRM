'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { getProperties } from '@/app/dashboard/properties/actions';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  HomeModernIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface ClientFormProps {
  initialData?: {
    id?: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    properties: string[];
    hasRequest: boolean;
  };
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    relatedProperties: string[];
    hasRequest: boolean;
  }) => void;
  onCancel: () => void;
}

export default function ClientForm({ initialData, onSubmit, onCancel }: ClientFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [relatedProperties, setRelatedProperties] = useState<string[]>(initialData?.properties || []);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);

  // Cargar propiedades iniciales
  useEffect(() => {
    const fetchInitialProperties = async () => {
      setIsLoading(true);
      try {
        const { properties: propertiesData, total } = await getProperties(1, 20, '');
        setFilteredProperties(propertiesData);
        setTotalProperties(total);
      } catch (error) {
        toast.error('Error al cargar las propiedades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialProperties();
  }, []);

  // Buscar propiedades cuando cambie el término de búsqueda
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchTerm.trim() === '') {
        const { properties: propertiesData, total } = await getProperties(1, 20, '');
        setFilteredProperties(propertiesData);
        setTotalProperties(total);
      } else {
        setIsLoading(true);
        try {
          const { properties: propertiesData, total } = await getProperties(1, 20, searchTerm);
          setFilteredProperties(propertiesData);
          setTotalProperties(total);
        } catch (error) {
          toast.error('Error al buscar propiedades');
        } finally {
          setIsLoading(false);
        }
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(searchTimeout);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      email,
      phone: phone || null,
      address: address || null,
      relatedProperties,
      hasRequest: false
    });
  };

  const handlePropertyToggle = (propertyId: string) => {
    setRelatedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  return (
    <div className="w-full max-w-4xl">
      <form id="client-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda - Información Personal */}
          <div className="space-y-4">
            {/* Tarjeta de Información Personal */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-md">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">📋 Información Personal</h3>
              </div>
              
              <div className="space-y-4">
                <div className="group">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-blue-500" />
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full bg-gray-50/50 border-2 border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                      required
                      placeholder="Ej: Juan Pérez García"
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4 text-blue-500" />
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full bg-gray-50/50 border-2 border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                      required
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4 text-blue-500" />
                    Teléfono
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full bg-gray-50/50 border-2 border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                      placeholder="+34 XXX XXX XXX"
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-blue-500" />
                    Dirección
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPinIcon className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      type="text"
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full bg-gray-50/50 border-2 border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                      placeholder="Calle Principal, 123, Ciudad"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Inmuebles Relacionados */}
          <div className="space-y-4">
            {/* Tarjeta de Inmuebles */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-md">
                  <HomeModernIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">🏠 Inmuebles Relacionados</h3>
                  <p className="text-xs text-gray-600">Selecciona los inmuebles asociados a este cliente</p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <span className="mt-2 text-blue-700 font-medium text-sm">Buscando inmuebles...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Buscador moderno */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
                    </div>
                    <input
                      type="text"
                      placeholder="🔍 Buscar por dirección, población..."
                      className="pl-10 pr-4 py-2 w-full bg-gradient-to-r from-gray-50 to-emerald-50/30 border-2 border-gray-200 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all duration-200 text-gray-800 placeholder-gray-500 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Lista de inmuebles con diseño moderno */}
                  <div className="max-h-48 overflow-y-auto bg-gradient-to-b from-white to-gray-50/50 border-2 border-gray-100 rounded-xl p-3 shadow-inner">
                    {filteredProperties.length > 0 ? (
                      <div className="space-y-2">
                        {filteredProperties.map((property) => (
                          <div key={property.id} className="group relative">
                            <label 
                              htmlFor={`property-${property.id}`}
                              className={`
                                flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md
                                ${relatedProperties.includes(property.id) 
                                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-sm' 
                                  : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                                }
                              `}
                            >
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  id={`property-${property.id}`}
                                  checked={relatedProperties.includes(property.id)}
                                  onChange={() => handlePropertyToggle(property.id)}
                                  className="sr-only"
                                />
                                <div className={`
                                  w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200
                                  ${relatedProperties.includes(property.id)
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500 shadow-md'
                                    : 'bg-white border-gray-300 group-hover:border-emerald-400'
                                  }
                                `}>
                                  {relatedProperties.includes(property.id) && (
                                    <CheckCircleIcon className="w-3 h-3 text-white" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="ml-3 flex-1">
                                <div className="flex items-center gap-1">
                                  <HomeModernIcon className="w-3 h-3 text-emerald-600" />
                                  <span className="font-medium text-gray-800 text-sm">{property.address}</span>
                                </div>
                                {property.population && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <MapPinIcon className="w-2.5 h-2.5 text-gray-500" />
                                    <span className="text-xs text-gray-600">{property.population}</span>
                                  </div>
                                )}
                                {property.ownerName && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <UserIcon className="w-2.5 h-2.5 text-gray-500" />
                                    <span className="text-xs text-gray-500">Propietario: {property.ownerName}</span>
                                  </div>
                                )}
                              </div>

                              {relatedProperties.includes(property.id) && (
                                <div className="ml-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    ✓
                                  </span>
                                </div>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <HomeModernIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500 font-medium text-sm">No se encontraron inmuebles</p>
                        <p className="text-xs text-gray-400 mt-1">Prueba con otros términos de búsqueda</p>
                      </div>
                    )}
                  </div>

                  {/* Estadísticas */}
                  {filteredProperties.length > 0 && (
                    <div className="flex items-center justify-between text-xs bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-2 border border-emerald-200">
                      <div className="flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">
                          {relatedProperties.length} seleccionado{relatedProperties.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="text-emerald-600">
                        {filteredProperties.length} de {totalProperties}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </form>

        {/* Botones de acción */}
        <div className="flex justify-center gap-4 pt-6 border-t mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
          >
            ❌ Cancelar
          </button>
          <button
            type="submit"
            form="client-form"
            className="px-6 py-2 border-2 border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200"
          >
            {initialData?.id ? '💾 Actualizar Cliente' : '✨ Crear Cliente'}
          </button>
        </div>
    </div>
  );
} 