'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface LocationMarkerProps {
  position: [number, number];
}

export default function LocationMarker({ position }: LocationMarkerProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);

  return null;
} 