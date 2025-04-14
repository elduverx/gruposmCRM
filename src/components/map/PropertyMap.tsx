'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
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

// Dynamically import Leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

// Custom components that use hooks need special handling
const LocationMarkerComponent = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  const [reactLeafletLoaded, setReactLeafletLoaded] = useState(false);
  
  // Define un tipo más específico para el hook useMapEvents
  type UseMapEventsType = (handlers: {
    click: (e: { latlng: { lat: number, lng: number } }) => void;
  }) => void;
  
  const callbackRef = useRef<UseMapEventsType | null>(null);
  
  useEffect(() => {
    // Only load once
    if (reactLeafletLoaded) return;
    
    // Dynamic import in useEffect
    import('react-leaflet').then((module) => {
      // Store the module in the ref, not in state
      callbackRef.current = module.useMapEvents;
      setReactLeafletLoaded(true);
    });
  }, [reactLeafletLoaded]);
  
  // Don't render anything until it's loaded
  if (!reactLeafletLoaded || !callbackRef.current) {
    return null;
  }
  
  // This never changes once loaded, so it won't cause re-renders
  const useMapEvents = callbackRef.current;
  
  // We define this outside to make it stable
  const LocationMarker = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    useMapEvents({
      click(e: { latlng: { lat: number, lng: number } }) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };
  
  return <LocationMarker />;
};

// Inner component for MapController
const MapControllerComponent = ({ coordinates }: { coordinates: { lat: number; lng: number } | null }) => {
  const [reactLeafletLoaded, setReactLeafletLoaded] = useState(false);
  
  // Define un tipo más específico para el hook useMap
  type UseMapType = () => {
    setView: (center: [number, number], zoom: number) => void;
  };
  
  const callbackRef = useRef<UseMapType | null>(null);
  
  useEffect(() => {
    // Only load once
    if (reactLeafletLoaded) return;
    
    // Dynamic import in useEffect
    import('react-leaflet').then((module) => {
      // Store the module in the ref, not in state
      callbackRef.current = module.useMap;
      setReactLeafletLoaded(true);
    });
  }, [reactLeafletLoaded]);
  
  // Don't render anything until it's loaded
  if (!reactLeafletLoaded || !callbackRef.current) {
    return null;
  }
  
  // This never changes once loaded, so it won't cause re-renders
  const useMap = callbackRef.current;
  
  const MapController = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const map = useMap();
    
    // Extract coordinates to local variables to address the exhaustive deps warning
    const lat = coordinates?.lat;
    const lng = coordinates?.lng;
    
    useEffect(() => {
      if (coordinates && lat !== undefined && lng !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        map.setView([lat, lng], 14);
      }
    }, [map, lat, lng]);
    
    return null;
  };
  
  return <MapController />;
};

interface PropertyMapProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  defaultLocation: { lat: number; lng: number };
}

export default function PropertyMap({ selectedLocation, onLocationSelect, defaultLocation }: PropertyMapProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div style={{ height: '600px', width: '100%', background: '#f0f0f0' }}></div>;
  }
  
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
      <LocationMarkerComponent onLocationSelect={onLocationSelect} />
      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={icon}
        />
      )}
      <MapControllerComponent coordinates={selectedLocation} />
    </MapContainer>
  );
} 