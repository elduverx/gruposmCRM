/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import DrawControl from './DrawControl';
import { Zone } from '@/app/dashboard/zones/actions';
import { Property } from '@/types/property';

// Definir tipos para los eventos de dibujo
interface DrawEvent {
  layer: L.Layer & { getLatLngs: () => L.LatLng[][] };
  layerType: string;
  layers?: L.FeatureGroup;
}

interface ZonesMapProps {
  zones: Zone[];
  onZoneCreated: (coordinates: { lat: number; lng: number }[]) => void;
  onZoneClick?: (zone: Zone) => void;
  onEditZone?: (zone: Zone) => void;
  onDeleteZone?: (zone: Zone) => void;
  selectedZoneId?: string | null;
  newZoneColor?: string;
  zoneCoordinates?: { lat: number; lng: number }[];
  initialCenter?: [number, number];
  initialZoom?: number;
  properties?: Property[];
  onPropertyClick?: (property: Property) => void;
  selectedPropertyId?: string | null;
  setSelectedPropertyId?: (id: string | null) => void;
  handleZoneClick?: (zone: Zone) => void;
  selectedLocation?: {lat: number, lng: number, name: string} | null;
}

const ZonesMap: React.FC<ZonesMapProps> = ({
  zones,
  onZoneCreated,
  initialCenter = [-34.603722, -58.381592],
  initialZoom = 13
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  // Función para manejar la creación de un polígono
  const handleCreated = (e: { layer: L.Layer & { getLatLngs: () => L.LatLng[][] } }) => {
    if (e.layer.getLatLngs) {
      const coordinates = e.layer.getLatLngs()[0].map(latLng => ({
        lat: latLng.lat,
        lng: latLng.lng
      }));
      onZoneCreated(coordinates);
    }
  };

  // Efecto para inicializar el mapa
  useEffect(() => {
    if (!map) return;

    // Inicializar FeatureGroup si no existe
    if (!featureGroupRef.current) {
      featureGroupRef.current = new L.FeatureGroup();
      map.addLayer(featureGroupRef.current);
    }

    // Calcular bounds iniciales
    if (zones.length > 0) {
      const latLngs = zones.flatMap(zone => 
        zone.coordinates.map(coord => new L.LatLng(coord.lat, coord.lng))
      );
      const newBounds = new L.LatLngBounds(latLngs);
      setBounds(newBounds);
      map.fitBounds(newBounds);
    }

    return () => {
      if (featureGroupRef.current) {
        map.removeLayer(featureGroupRef.current);
      }
    };
  }, [map, zones]);

  // Efecto para actualizar bounds cuando cambian las zonas
  useEffect(() => {
    if (!map || !bounds) return;
    map.fitBounds(bounds);
  }, [map, bounds]);

  // Efecto para establecer los iconos por defecto
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Establecer iconos por defecto
      const defaultIcon = L.Icon.Default.prototype;
      if (defaultIcon && '_getIconUrl' in defaultIcon) {
        delete (defaultIcon as any)._getIconUrl;
      }

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/marker-icon-2x.png',
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    } catch (error) {
      console.error('Error al configurar iconos por defecto:', error);
    }
  }, []);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DrawControl
          editableLayers={featureGroupRef.current}
          onCreated={handleCreated}
        />
      </MapContainer>
    </div>
  );
};

export default ZonesMap; 