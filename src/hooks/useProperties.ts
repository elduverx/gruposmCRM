import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { getProperties } from '@/app/dashboard/properties/actions';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getProperties();
        setProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar las propiedades'));
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return { properties, loading, error };
} 