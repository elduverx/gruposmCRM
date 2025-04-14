/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

'use client';

import React, { useEffect, useState, useRef, forwardRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { Property } from '@/types/property';
import { Zone } from '@/app/dashboard/zones/actions';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useRouter } from 'next/navigation';
import LeafletInit from './LeafletInit';
import 'leaflet-draw';
import DrawControl from './DrawControl';

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

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);

// Export the interface for importing elsewhere
export interface MapWithDrawProps {
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
  selectedLocation?: {lat: number, lng: number, name: string} | null;
  initialCenter?: [number, number];
  initialZoom?: number;
}

const MapWithDraw = forwardRef<L.Map, MapWithDrawProps>((props, ref) => {
  // Destructure props to avoid the exhaustive-deps warning
  const { 
    center, 
    zoom, 
    properties, 
    zones, 
    newZoneColor,
    zoneCoordinates,
    onZoneCreated,
    selectedPropertyId,
    onEditZone,
    onDeleteZone,
    onMarkerRefsUpdate,
    setSelectedPropertyId,
    handleZoneClick,
    selectedLocation,
    initialCenter = [-34.603722, -58.381592],
    initialZoom = 13
  } = props;

  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const [icon, setIcon] = useState<L.Icon | undefined>(undefined);
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load icon only on client side
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

  // Handle map reference
  const handleMapRef = useCallback((map: L.Map | null) => {
    if (map) {
      mapRef.current = map;
      if (ref && typeof ref === 'function') {
        ref(map);
      } else if (ref && typeof ref === 'object') {
        (ref as React.MutableRefObject<L.Map>).current = map;
      }
      setIsMapReady(true);
    }
  }, [ref]);

  // Update marker refs when properties change
  useEffect(() => {
    if (isMapReady) {
      onMarkerRefsUpdate(markerRefs.current);
    }
  }, [properties, onMarkerRefsUpdate, isMapReady]);

  // Handle selected property popup
  useEffect(() => {
    if (!isMapReady || !selectedPropertyId) return;

    const marker = markerRefs.current[selectedPropertyId];
    if (marker?.openPopup) {
      setTimeout(() => {
        try {
          marker.openPopup();
        } catch (error) {
          // Silent error handling
        }
      }, 300);
    }
  }, [selectedPropertyId, isMapReady]);

  // Update map center
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !center) return;

    try {
      mapRef.current.setView(center, zoom);
    } catch (error) {
      // Silent error handling
    }
  }, [center, zoom, isMapReady]);

  // Handle selected location popup
  useEffect(() => {
    if (!isMapReady || !selectedLocation) return;

    const marker = markerRefs.current['selected-location'];
    if (marker?.openPopup) {
      setTimeout(() => {
        try {
          marker.openPopup();
        } catch (error) {
          // Silent error handling
        }
      }, 300);
    }
  }, [selectedLocation, isMapReady]);

  // Inicializar FeatureGroup para el DrawControl
  useEffect(() => {
    if (!isClient || !isMapReady || !mapRef.current) return;
    
    if (!featureGroupRef.current) {
      featureGroupRef.current = new L.FeatureGroup();
      mapRef.current.addLayer(featureGroupRef.current);
    }
    
    return () => {
      if (mapRef.current && featureGroupRef.current) {
        mapRef.current.removeLayer(featureGroupRef.current);
      }
    };
  }, [isClient, isMapReady]);

  if (!isClient) {
    return <div style={{ height: '100%', width: '100%' }} />;
  }

  // Función que maneja la creación de zonas
  const handleCreated = (e: { layer: L.Layer & { getLatLngs: () => L.LatLng[][] } }) => {
    if (e.layer.getLatLngs) {
      const coordinates = e.layer.getLatLngs()[0].map(latLng => ({
        lat: latLng.lat,
        lng: latLng.lng
      }));
      onZoneCreated(coordinates);
    }
  };

  // Función para manejar la edición de un polígono
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdited = (e: { layers: L.LayerGroup }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    e.layers.eachLayer((layer: L.Layer) => {
      // Verificar primero si la capa tiene la propiedad getLatLngs
      if ('getLatLngs' in layer) {
        const polygonLayer = layer as L.Layer & { getLatLngs: () => L.LatLng[][] };
        const coordinates = polygonLayer.getLatLngs()[0].map(latLng => ({
          lat: latLng.lat,
          lng: latLng.lng
        }));
        onZoneCreated(coordinates);
      }
    });
  };

  // Función para manejar la eliminación de un polígono
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleted = (e: { layers: L.LayerGroup }) => {
    console.log('Polígono eliminado:', e);
  };

  return (
    <>
      <LeafletInit />
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        // The react-leaflet types are not compatible with forwardRef
        // @ts-expect-error - React-leaflet has incompatible ref types with forwardRef
        ref={handleMapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Usar el componente DrawControl original */}
        {isMapReady && featureGroupRef.current && (
          <DrawControl 
            editableLayers={featureGroupRef.current}
            onCreated={handleCreated}
          />
        )}
        
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
                  markerRefs.current[property.id as string] = ref;
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
                        property.status === 'SALE'
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {property.status === 'SALE' ? 'Venta' : 'Alquiler'}
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
    </>
  );
});

MapWithDraw.displayName = 'MapWithDraw';

export default MapWithDraw; 