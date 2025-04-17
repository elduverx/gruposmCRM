import { useState, useEffect } from 'react';
import { Zone as ZoneType } from '@/types/zone';
import { getZones, Zone as ZoneAction } from '@/app/dashboard/zones/actions';

export function useZones() {
  const [zones, setZones] = useState<ZoneType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadZones = async () => {
      try {
        setIsLoading(true);
        const zonesData = await getZones();
        if (Array.isArray(zonesData)) {
          // Convertir las zonas del formato de actions al formato de types
          const convertedZones: ZoneType[] = zonesData.map((zone: ZoneAction) => ({
            id: zone.id,
            name: zone.name,
            description: zone.description || null,
            color: zone.color,
            coordinates: {
              type: 'Polygon',
              coordinates: [zone.coordinates.map(coord => [coord.lat, coord.lng])]
            },
            createdAt: zone.createdAt,
            updatedAt: zone.updatedAt
          }));
          setZones(convertedZones);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar las zonas'));
      } finally {
        setIsLoading(false);
      }
    };

    loadZones();
  }, []);

  return {
    zones,
    isLoading,
    error
  };
} 