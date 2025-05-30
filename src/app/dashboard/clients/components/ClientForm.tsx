'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { getProperties } from '@/app/dashboard/properties/actions';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            placeholder="Nombre completo"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="+34 XXX XXX XXX"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Dirección completa"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Inmuebles Relacionados
        </label>
        {isLoading ? (
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-500">Buscando inmuebles...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por dirección o población..."
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-white">
              {filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <div key={property.id} className="flex items-center py-2 px-1 hover:bg-gray-50 rounded-md transition-colors duration-150">
                    <input
                      type="checkbox"
                      id={`property-${property.id}`}
                      checked={relatedProperties.includes(property.id)}
                      onChange={() => handlePropertyToggle(property.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`property-${property.id}`} className="ml-2 block text-sm text-gray-700 cursor-pointer flex-1">
                      <span className="font-medium">{property.address}</span>
                      {property.population && (
                        <span className="text-gray-500 ml-1">- {property.population}</span>
                      )}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No se encontraron inmuebles con ese término</p>
                </div>
              )}
            </div>
            {filteredProperties.length > 0 && (
              <p className="text-xs text-gray-500 text-right">
                Mostrando {filteredProperties.length} de {totalProperties} inmuebles
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
        >
          {initialData?.id ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
} 