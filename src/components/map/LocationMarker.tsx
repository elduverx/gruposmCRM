import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface LocationMarkerProps {
  position: [number, number];
  address: string;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({ position, address }) => {
  return (
    <Marker position={position}>
      <Popup>
        <div className="p-2">
          <h3 className="font-semibold">Ubicación seleccionada</h3>
          <p className="text-sm text-gray-600">{address}</p>
        </div>
      </Popup>
    </Marker>
  );
}; 