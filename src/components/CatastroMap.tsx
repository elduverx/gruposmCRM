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
}

export default function CatastroMap({ properties }: CatastroMapProps) {
  // Default center is Catarroja, Spain
  const [center, setCenter] = useState<[number, number]>([39.3989, -0.4262]);
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
              <h3 className="font-bold">{marker.address || `${marker.streetType} ${marker.streetName}, ${marker.number}`}</h3>
              <p>Ref. Catastral: {marker.reference}</p>
              {marker.block && <p>Bloque: {marker.block}</p>}
              {marker.stairway && <p>Escalera: {marker.stairway}</p>}
              {marker.floor && <p>Planta: {marker.floor}</p>}
              {marker.door && <p>Puerta: {marker.door}</p>}
              {marker.age && <p>Año: {marker.age}</p>}
              {marker.quality && <p>Calidad: {marker.quality}</p>}
              {marker.constructedArea && <p>Superficie: {marker.constructedArea}m²</p>}
              {marker.propertyType && <p>Tipo: {marker.propertyType}</p>}
              {marker.reformType && marker.reformType !== ' ' && <p>Tipo reforma: {marker.reformType}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 