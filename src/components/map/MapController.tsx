'use client';

import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapControllerProps {
  ref?: React.ForwardedRef<L.Map>;
  coordinates?: { lat: number; lng: number } | null;
}

export const MapController = React.forwardRef<L.Map, MapControllerProps>((props, ref) => {
  const { coordinates } = props;
  const map = useMap();
  
  useEffect(() => {
    if (ref && typeof ref === 'function') {
      ref(map);
    } else if (ref && typeof ref === 'object') {
      (ref as React.MutableRefObject<L.Map>).current = map;
    }
  }, [map, ref]);
  
  useEffect(() => {
    if (coordinates) {
      map.setView([coordinates.lat, coordinates.lng], map.getZoom());
    }
  }, [coordinates, map]);
  
  return null;
});

MapController.displayName = 'MapController'; 