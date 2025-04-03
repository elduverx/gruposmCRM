'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getAddressFromCoordinates } from '@/utils/geocoding';

// Fix para los iconos por defecto de Leaflet
const icon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapControllerProps {
  center: [number, number];
  zoom: number;
  onLocationSelect: (location: { lat: number; lng: number; address: string; population: string }) => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: MapControllerProps['onLocationSelect'] }) {
  const map = useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      const addressData = await getAddressFromCoordinates(lat, lng);
      onLocationSelect({
        lat,
        lng,
        address: addressData.address,
        population: addressData.population
      });
    },
  });

  return null;
}

export default function MapController({ center, zoom, onLocationSelect }: MapControllerProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef as any}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={center} icon={icon} />
      <MapClickHandler onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
} 