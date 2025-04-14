'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { Zone } from '@/app/dashboard/zones/actions';
import dynamic from 'next/dynamic';

// Importar MapWithDraw dinámicamente para evitar errores de SSR
const MapWithDraw = dynamic(() => import('./MapWithDraw'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" />
});

interface ZonesMapProps {
  center: [number, number];
  zoom: number;
  properties: Property[];
  zones: Zone[];
  newZoneColor: string;
  zoneCoordinates: { lat: number; lng: number }[];
  onZoneCreated: (coordinates: { lat: number; lng: number }[]) => void;
  onPropertyClick: (property: Property) => void;
  onZoneClick: (zone: Zone) => void;
  selectedPropertyId: string | null;
  onEditZone: (zone: Zone) => void;
  onDeleteZone: (zone: Zone) => void;
  setSelectedPropertyId: (id: string | null) => void;
  handleZoneClick: (zone: Zone) => void;
  selectedLocation?: {lat: number, lng: number, name: string} | null;
}

export default function ZonesMap({
  center,
  zoom,
  properties,
  zones,
  newZoneColor,
  zoneCoordinates,
  onZoneCreated,
  onPropertyClick,
  onZoneClick,
  selectedPropertyId,
  onEditZone,
  onDeleteZone,
  setSelectedPropertyId,
  handleZoneClick,
  selectedLocation
}: ZonesMapProps) {
  const [markerRefs, setMarkerRefs] = useState<{ [key: string]: any }>({});
  const [isClient, setIsClient] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [center, zoom]);

  if (!isClient) {
    return <div className="h-full w-full bg-gray-100 animate-pulse" />;
  }

  return (
    <div className="h-full w-full">
      <MapWithDraw
        key={mapKey}
        center={center}
        zoom={zoom}
        properties={properties}
        zones={zones}
        newZoneColor={newZoneColor}
        zoneCoordinates={zoneCoordinates}
        onZoneCreated={onZoneCreated}
        onPropertyClick={onPropertyClick}
        onZoneClick={onZoneClick}
        selectedPropertyId={selectedPropertyId}
        onEditZone={onEditZone}
        onDeleteZone={onDeleteZone}
        onMarkerRefsUpdate={setMarkerRefs}
        setSelectedPropertyId={setSelectedPropertyId}
        handleZoneClick={handleZoneClick}
        selectedLocation={selectedLocation}
      />
    </div>
  );
} 