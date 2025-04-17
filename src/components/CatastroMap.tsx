'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CatastroProperty } from '@/types/property';

// Fix for default marker icons in leaflet
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 38],
  iconAnchor: [12, 38],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface CatastroMapProps {
  properties: CatastroProperty[];
  center: [number, number];
}

export default function CatastroMap({ properties, center }: CatastroMapProps) {
  const [markers, setMarkers] = useState<CatastroProperty[]>([]);

  useEffect(() => {
    if (properties && properties.length > 0) {
      // For demo purposes, generate random coordinates around Catarroja
      // In a real application, you would geocode the addresses
      const newMarkers = properties.map((property) => {
        if (!property.lat || !property.lng) {
          // Random offset within ~1km
          const latOffset = (Math.random() - 0.5) * 0.01;
          const lngOffset = (Math.random() - 0.5) * 0.01;
          
          return {
            ...property,
            lat: center[0] + latOffset,
            lng: center[1] + lngOffset,
          };
        }
        return property;
      });
      
      setMarkers(newMarkers);
    }
  }, [properties, center]);

  if (typeof window === 'undefined') {
    return <div className="h-96 bg-gray-100 flex items-center justify-center">Loading map...</div>;
  }

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: "500px", width: "100%" }}
      className="rounded-lg overflow-hidden"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {markers.map((marker, index) => (
        <Marker 
          key={index} 
          position={[marker.lat || center[0], marker.lng || center[1]]}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">{`${marker.streetName}, ${marker.number}`}</h3>
              <p>Ref. Catastral: {marker.reference}</p>
              {marker.door && <p>Puerta: {marker.door}</p>}
              {marker.floor && <p>Planta: {marker.floor}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 