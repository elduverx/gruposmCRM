'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { getProperties } from '@/app/dashboard/properties/actions';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
  const [hasRequest, setHasRequest] = useState(initialData?.hasRequest || false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const propertiesData = await getProperties(1, 10000, '');
        if (propertiesData) {
          setProperties(propertiesData.properties);
          setFilteredProperties(propertiesData.properties);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filtrar propiedades cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProperties(properties);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = properties.filter(property => {
        const addressMatch = property.address?.toLowerCase().includes(term) || false;
        const populationMatch = property.population?.toLowerCase().includes(term) || false;
        return addressMatch || populationMatch;
      });
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      email,
      phone: phone || null,
      address: address || null,
      relatedProperties,
      hasRequest
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Inmuebles Relacionados
        </label>
        {isLoading ? (
          <p className="text-sm text-gray-500">Cargando inmuebles...</p>
        ) : properties.length > 0 ? (
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
            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
              {filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <div key={property.id} className="flex items-center py-1 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`property-${property.id}`}
                      checked={relatedProperties.includes(property.id)}
                      onChange={() => handlePropertyToggle(property.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`property-${property.id}`} className="ml-2 block text-sm text-gray-700">
                      {property.address} {property.population && `- ${property.population}`}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-2 text-center">No se encontraron inmuebles con ese término</p>
              )}
            </div>
            {filteredProperties.length > 0 && (
              <p className="text-xs text-gray-500 text-right">
                Mostrando {filteredProperties.length} de 12105 inmuebles
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay inmuebles disponibles</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="hasRequest"
          checked={hasRequest}
          onChange={(e) => setHasRequest(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="hasRequest" className="ml-2 block text-sm text-gray-700">
          Tiene pedido
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {initialData?.id ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
} 