'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Next.js
const icon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationMarkerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ onLocationSelect }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapControllerProps {
  coordinates: { lat: number; lng: number } | null;
}

function MapController({ coordinates }: MapControllerProps) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates) {
      map.setView([coordinates.lat, coordinates.lng], 14);
    }
  }, [coordinates, map]);
  
  return null;
}

interface PropertyMapProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  defaultLocation: { lat: number; lng: number };
}

export default function PropertyMap({ selectedLocation, onLocationSelect, defaultLocation }: PropertyMapProps) {
  return (
    <MapContainer
      center={[defaultLocation.lat, defaultLocation.lng]}
      zoom={14}
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <LocationMarker onLocationSelect={onLocationSelect} />
      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={icon}
        />
      )}
      <MapController coordinates={selectedLocation} />
    </MapContainer>
  );
} 