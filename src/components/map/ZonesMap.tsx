/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import DrawControl from './DrawControl';
import { Zone } from '@/app/dashboard/zones/actions';
import { Property } from '@/types/property';
import { useRouter } from 'next/navigation';

interface ZonesMapProps {
  zones: Zone[];
  onZoneCreated: (coordinates: { lat: number; lng: number }[]) => void;
  onZoneClick: (zone: Zone) => void;
  onEditZone?: (zone: Zone) => void;
  properties: Property[];
  onPropertyClick: (property: Property) => void;
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  handleZoneClick: (zone: Zone) => void;
  selectedLocation?: {lat: number, lng: number, name: string} | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  onMarkerRefsUpdate: (refs: { [key: string]: L.Marker | null }) => void;
  newZoneColor?: string;
  zoneCoordinates?: { lat: number; lng: number }[];
  zoneUsers?: { [zoneId: string]: { id: string; name: string | null; email: string }[] };
}

const ZonesMap: React.FC<ZonesMapProps> = ({
  zones = [],
  onZoneCreated,
  onZoneClick,
  onEditZone,
  initialCenter = [39.4015, -0.4027],
  initialZoom = 15,
  properties = [],
  onPropertyClick,
  setSelectedPropertyId,
  handleZoneClick,
  selectedLocation,
  newZoneColor = '#FF0000',
  zoneCoordinates = [],
  onMarkerRefsUpdate,
  zoneUsers
}) => {
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const [icon, setIcon] = useState<L.Icon | undefined>(undefined);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const [visibleProperties, setVisibleProperties] = useState<Property[]>([]);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Cargar icono para los marcadores
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const leafletIcon = L.icon({
      iconUrl: '/marker-icon.png',
      shadowUrl: '/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    setIcon(leafletIcon);
  }, []);

  // Efecto para inicializar el mapa
  useEffect(() => {
    // Intentamos obtener el mapa de manera más segura
    setTimeout(() => {
      try {
        const mapElement = document.querySelector('.leaflet-container');
        if (mapElement && !mapRef.current) {
          // @ts-ignore
          mapRef.current = mapElement._leaflet_map;
          
          // Inicializar FeatureGroup
          if (mapRef.current && !featureGroupRef.current) {
            featureGroupRef.current = new L.FeatureGroup();
            mapRef.current.addLayer(featureGroupRef.current);
          }
          
          // Ajustar el mapa a los bounds si hay zonas
          if (mapRef.current && zones.length > 0) {
            try {
              const latLngs = zones.flatMap(zone => 
                zone.coordinates.map(coord => new L.LatLng(coord.lat, coord.lng))
              );
              if (latLngs.length > 0) {
                const newBounds = new L.LatLngBounds(latLngs);
                mapRef.current.fitBounds(newBounds);
              }
            } catch (error) {
              console.error('Error al calcular bounds:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener referencia al mapa:', error);
      }
    }, 500);
  }, [zones]);

  // Función para cargar propiedades visibles en el área actual del mapa
  const loadVisibleProperties = useCallback((bounds: L.LatLngBounds) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Filtrar propiedades que están dentro de los límites del mapa
    const visible = properties.filter(property => {
      if (!property.latitude || !property.longitude) return false;
      
      // Convertir a número de manera segura
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      
      // Verificar que los valores son números válidos
      if (isNaN(lat) || isNaN(lng)) return false;
      
      return bounds.contains([lat, lng]);
    });
    
    setVisibleProperties(visible);
    setIsLoading(false);
  }, [isLoading, properties]);

  // Efecto para actualizar las propiedades visibles cuando cambia el área del mapa
  useEffect(() => {
    if (!mapRef.current || !mapBounds) return;
    
    loadVisibleProperties(mapBounds);
  }, [mapBounds, loadVisibleProperties]);

  // Efecto para actualizar los marcadores cuando cambian las propiedades visibles
  useEffect(() => {
    if (onMarkerRefsUpdate) {
      onMarkerRefsUpdate(markerRefs.current);
    }
  }, [visibleProperties, onMarkerRefsUpdate]);

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

  // Función para manejar el evento de movimiento del mapa
  const handleMapMoveEnd = useCallback(() => {
    if (mapRef.current) {
      setMapBounds(mapRef.current.getBounds());
    }
  }, []);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenReady={() => {
          if (mapRef.current) {
            setMapBounds(mapRef.current.getBounds());
          }
        }}
        // @ts-ignore - La propiedad onMoveEnd existe en Leaflet pero no está tipada correctamente
        onMoveEnd={handleMapMoveEnd}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DrawControl
          editableLayers={featureGroupRef.current}
          onCreated={handleCreated}
        />

        {/* Renderizar las zonas como polígonos */}
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
                if (onZoneClick) onZoneClick(zone);
                if (handleZoneClick) handleZoneClick(zone);
              },
              dblclick: () => {
                if (onEditZone) onEditZone(zone);
              }
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{zone.name}</h3>
                {zoneUsers && zoneUsers[zone.id]?.length > 0 ? (
                  <div className="mt-1">
                    <p className="text-sm font-medium text-gray-700">Usuarios asignados:</p>
                    <ul className="text-sm text-gray-600 mt-1 pl-2">
                      {zoneUsers[zone.id].map(user => (
                        <li key={user.id}>{user.name || user.email.split('@')[0]}</li>
                      ))}
                    </ul>
                  </div>
                ) : zone.description ? (
                  <p className="text-sm text-gray-600">{zone.description}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin usuarios asignados</p>
                )}
              </div>
            </Popup>
          </Polygon>
        ))}
        
        {/* Renderizar la zona en creación */}
        {zoneCoordinates && zoneCoordinates.length > 0 && (
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
        
        {/* Renderizar las propiedades visibles */}
        {visibleProperties.map((property) => {
          if (!property.latitude || !property.longitude) return null;
          
          // Convertir a número de manera segura
          const lat = Number(property.latitude);
          const lng = Number(property.longitude);
          
          // Verificar que los valores son números válidos
          if (isNaN(lat) || isNaN(lng)) return null;
          
          return (
            <Marker
              key={property.id}
              position={[lat, lng]}
              icon={icon}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[property.id] = ref;
                }
              }}
              eventHandlers={{
                click: () => {
                  if (onPropertyClick) onPropertyClick(property);
                  if (setSelectedPropertyId) setSelectedPropertyId(property.id);
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
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        property.status === 'SALE'
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {property.status === 'SALE' ? 'Venta' : 'Alquiler'}
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
          );
        })}

        {/* Renderizar la ubicación seleccionada */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={icon}
            eventHandlers={{
              click: () => {
                const marker = markerRefs.current['selected-location'];
                if (marker?.openPopup) {
                  marker.openPopup();
                }
              }
            }}
            ref={(ref) => {
              if (ref) {
                markerRefs.current['selected-location'] = ref;
              }
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">Ubicación seleccionada</h3>
                <p className="text-sm text-gray-600">{selectedLocation.name}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default ZonesMap; 