'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import { Property } from '@/types/property';
import { Zone } from '@/app/dashboard/zones/actions';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Importar DrawControl dinámicamente para evitar errores de SSR
const DrawControl = dynamic(() => import('@/components/map/DrawControl'), {
  ssr: false
});

interface MapWithDrawProps {
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
  onMarkerRefsUpdate: (refs: { [key: string]: L.Marker | null }) => void;
  setSelectedPropertyId: (id: string | null) => void;
  handleZoneClick: (zone: Zone) => void;
}

const MapWithDraw = React.forwardRef<L.Map, MapWithDrawProps>(({
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
  onMarkerRefsUpdate,
  setSelectedPropertyId,
  handleZoneClick
}, ref) => {
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const [icon, setIcon] = React.useState<L.Icon | undefined>(undefined);
  const router = useRouter();

  // Cargar el icono solo en el cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const leafletIcon = L.icon({
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      setIcon(leafletIcon);
    }
  }, []);

  // Efecto para notificar al componente padre cuando los marcadores cambian
  useEffect(() => {
    onMarkerRefsUpdate(markerRefs.current);
  }, [properties, onMarkerRefsUpdate]);

  // Efecto para abrir el popup cuando se selecciona una propiedad
  useEffect(() => {
    if (selectedPropertyId && markerRefs.current[selectedPropertyId]) {
      setTimeout(() => {
        try {
          const marker = markerRefs.current[selectedPropertyId];
          if (marker && marker.openPopup) {
            marker.openPopup();
          }
        } catch (error) {
          console.error(`Error al abrir el popup para la propiedad ${selectedPropertyId}:`, error);
        }
      }, 300);
    }
  }, [selectedPropertyId]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      ref={ref as React.RefObject<L.Map>}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <DrawControl
        editableLayers={featureGroupRef.current}
        onCreated={(e: any) => {
          const layer = e.layer;
          const coordinates: { lat: number; lng: number }[] = [];
          layer.getLatLngs()[0].forEach((latLng: L.LatLng) => {
            coordinates.push({
              lat: latLng.lat,
              lng: latLng.lng
            });
          });
          onZoneCreated(coordinates);
        }}
      />

      {zones.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.coordinates?.map(coord => [coord.lat, coord.lng]) || []}
          pathOptions={{ 
            color: zone.color || '#FF0000',
            fillColor: zone.color || '#FF0000',
            fillOpacity: 0.2
          }}
          eventHandlers={{
            click: () => {
              handleZoneClick(zone);
            },
            dblclick: () => {
              onEditZone(zone);
            }
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">{zone.name}</h3>
              {zone.description && (
                <p className="text-sm text-gray-600">{zone.description}</p>
              )}
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditZone(zone);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteZone(zone);
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Popup>
        </Polygon>
      ))}
      
      {zoneCoordinates.length > 0 && (
        <Polygon
          positions={zoneCoordinates.map(coord => [coord.lat, coord.lng])}
          pathOptions={{ 
            color: newZoneColor, 
            fillColor: newZoneColor, 
            fillOpacity: 0.2,
            weight: 2
          }}
        />
      )}
      
      {properties.map((property) => (
        property.latitude && property.longitude ? (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
            icon={icon}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[property.id] = ref;
                onMarkerRefsUpdate(markerRefs.current);
              }
            }}
            eventHandlers={{
              click: () => {
                setSelectedPropertyId(property.id);
              }
            }}
          >
            <Popup>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{property.address}</h3>
                  <span className="text-sm font-medium text-gray-900">{property.population}</span>
                </div>
                <div className="space-y-2">
                  {property.dpv && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">DPV: </span>
                      <span className="text-gray-900">{property.dpv.toString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      property.status === 'SIN_EMPEZAR' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {property.status === 'SIN_EMPEZAR' ? 'Sin empezar' : 'Empezada'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      property.action === 'IR_A_DIRECCION' 
                        ? 'bg-blue-100 text-blue-800'
                        : property.action === 'REPETIR'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {property.action === 'IR_A_DIRECCION' 
                        ? 'Ir a dirección' 
                        : property.action === 'REPETIR'
                        ? 'Repetir'
                        : 'Localizar verificado'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-gray-100 text-gray-900`}>
                      {property.type}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Propietario: {property.ownerName}</p>
                    <p className="text-gray-900">Tel: {property.ownerPhone}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 font-medium"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  );
});

MapWithDraw.displayName = 'MapWithDraw';

export default MapWithDraw; 