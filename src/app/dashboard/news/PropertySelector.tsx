'use client';

import { useState, useEffect } from 'react';
import { getProperties } from '../properties/actions';
import { Property } from '@/types/property';

interface PropertySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PropertySelector({ value, onChange }: PropertySelectorProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await getProperties();
        setProperties(data);
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, []);

  const filteredProperties = properties.filter(property => 
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.population.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-2">
        <input
          type="text"
          placeholder="Buscar propiedad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      >
        <option value="">Selecciona una propiedad</option>
        {isLoading ? (
          <option value="" disabled>Cargando propiedades...</option>
        ) : (
          filteredProperties.map(property => (
            <option key={property.id} value={property.id}>
              {property.address} - {property.population}
            </option>
          ))
        )}
      </select>
    </div>
  );
} 