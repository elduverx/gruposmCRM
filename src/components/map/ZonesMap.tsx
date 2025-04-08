'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { Zone } from '@/app/dashboard/zones/actions';
import dynamic from 'next/dynamic';

// Importar MapWithDraw dinámicamente para evitar errores de SSR
const MapWithDraw = dynamic(() => import('@/components/map/MapWithDraw'), {
  ssr: false
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
  handlePolygonEdited: (e: any) => void;
  handlePolygonDeleted: (e: any) => void;
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
  handlePolygonEdited,
  handlePolygonDeleted
}: ZonesMapProps) {
  const [markerRefs, setMarkerRefs] = useState<{ [key: string]: any }>({});

  return (
    <div className="h-full w-full">
      <MapWithDraw
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
      />
    </div>
  );
} 