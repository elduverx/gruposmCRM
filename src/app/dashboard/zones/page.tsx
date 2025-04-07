'use client';

import { useEffect, useState, useRef } from 'react';
import { getProperties } from '../properties/actions';
import { getZones, createZone, Zone, updateZone, deleteZone } from './actions';
import { Property } from '@/types/property';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import { useRouter } from 'next/navigation';
import React from 'react';
import { MapContainer as LeafletMapContainer, TileLayer as LeafletTileLayer, Marker as LeafletMarker, Popup as LeafletPopup, Polygon as LeafletPolygon } from 'react-leaflet';
import DrawControl from '@/components/map/DrawControl';
import { useAuth } from '@/context/AuthContext';

// Componente para el formulario de zonas
interface ZoneFormData {
  name: string;
  description: string;
  color: string;
  coordinates: { lat: number; lng: number }[];
}

interface ZoneFormProps {
  onSubmit: (data: ZoneFormData) => void;
  onCancel: () => void;
  initialData?: Zone;
}

const ZoneForm = ({ onSubmit, onCancel, initialData }: ZoneFormProps) => {
  const [formData, setFormData] = useState<ZoneFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    color: initialData?.color || '#FF0000',
    coordinates: initialData?.coordinates || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
            <input
              type="text"
          id="name"
              value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
            <textarea
          id="description"
              value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              rows={3}
            />
          </div>
          <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700">
          Color
        </label>
              <input
                type="color"
          id="color"
                value={formData.color}
          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
      <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
          {initialData ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
  );
};

// Fix para los iconos por defecto de Leaflet
let icon: L.Icon | L.DivIcon | undefined = undefined;

if (typeof window !== 'undefined') {
  import('leaflet').then((L) => {
    icon = L.default.icon({
      iconUrl: '/marker-icon.png',
      shadowUrl: '/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  });
}

// Componente para el mapa con la funcionalidad de dibujo
const MapWithDraw = React.forwardRef<L.Map, { 
  center: [number, number], 
  zoom: number, 
  properties: Property[], 
  zones: Zone[], 
  newZoneColor: string, 
  zoneCoordinates: { lat: number; lng: number }[], 
  onZoneCreated: (coordinates: { lat: number; lng: number }[]) => void, 
  onPropertyClick: (property: Property) => void, 
  onZoneClick: (zone: Zone) => void,
  selectedPropertyId: string | null,
  onEditZone: (zone: Zone) => void,
  onDeleteZone: (zone: Zone) => void,
  onMarkerRefsUpdate: (refs: { [key: string]: L.Marker | null }) => void,
  setSelectedPropertyId: (id: string | null) => void
}>(({ 
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
  setSelectedPropertyId
}, ref) => {
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const initializedRef = useRef<boolean>(false);
  const router = useRouter();
  
  // Efecto para notificar al componente padre cuando los marcadores cambian
  useEffect(() => {
    // Notificar al componente padre sobre los cambios en los marcadores
    onMarkerRefsUpdate(markerRefs.current);
  }, [properties, onMarkerRefsUpdate]);

  // Efecto para abrir el popup cuando se selecciona una propiedad
  useEffect(() => {
    if (selectedPropertyId && markerRefs.current[selectedPropertyId]) {
      // Usar setTimeout para asegurar que el popup se abra después de que el mapa se haya actualizado
      setTimeout(() => {
        try {
          const marker = markerRefs.current[selectedPropertyId];
          if (marker && marker.openPopup) {
            marker.openPopup();
            console.log(`Abriendo popup para la propiedad ${selectedPropertyId}`);
          } else {
            console.warn(`No se pudo abrir el popup para la propiedad ${selectedPropertyId}: marcador no válido`);
          }
        } catch (error) {
          console.error(`Error al abrir el popup para la propiedad ${selectedPropertyId}:`, error);
        }
      }, 300); // Reducir el tiempo de espera de 1000ms a 300ms
    }
  }, [selectedPropertyId]);

  // Efecto para centrar el mapa cuando cambia el centro o el zoom
  useEffect(() => {
    if (ref && (ref as React.MutableRefObject<L.Map>).current) {
      const map = (ref as React.MutableRefObject<L.Map>).current;
      map.setView(center, zoom);
    }
  }, [center, zoom, ref]);

  // Efecto para inicializar el control de dibujo
  useEffect(() => {
    if (typeof window !== 'undefined' && ref && (ref as React.MutableRefObject<L.Map>).current) {
      const map = (ref as React.MutableRefObject<L.Map>).current;
      
      // Crear un grupo de características para almacenar las zonas dibujadas
      if (!featureGroupRef.current) {
        featureGroupRef.current = new L.FeatureGroup().addTo(map);
      }
      
      // Crear el control de dibujo
      if (!drawControlRef.current) {
        const drawControl = new L.Control.Draw({
          draw: {
            polyline: false,
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polygon: {
              allowIntersection: false,
              drawError: {
                color: '#e1e100',
                message: '<strong>Error:</strong> Los polígonos no pueden intersectarse!'
              },
              shapeOptions: {
                color: newZoneColor
              }
            }
          },
          edit: {
            featureGroup: featureGroupRef.current,
            remove: false
          }
        });
        
        drawControlRef.current = drawControl;
        map.addControl(drawControl);
        
        // Evento cuando se completa el dibujo de un polígono
        map.on('draw:created', (e: { layer: L.Layer }) => {
          const layer = e.layer;
          featureGroupRef.current?.addLayer(layer);
          
          if (layer instanceof L.Polygon) {
            const latLngs = layer.getLatLngs()[0];
            if (Array.isArray(latLngs)) {
              const coordinates = latLngs.map((latLng: L.LatLng) => [latLng.lat, latLng.lng]);
              onZoneCreated(coordinates);
            }
          }
        });
      }
    }
  }, [ref, newZoneColor, onZoneCreated]);

  return (
    <LeafletMapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      ref={ref as React.RefObject<L.Map>}
    >
      <LeafletTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Mostrar zonas */}
      {zones.map((zone) => (
        <LeafletPolygon
          key={zone.id}
          positions={zone.coordinates?.map(coord => [coord.lat, coord.lng]) || []}
          pathOptions={{ 
            color: zone.color || '#FF0000',
            fillColor: zone.color || '#FF0000',
            fillOpacity: 0.2
          }}
          eventHandlers={{
            click: () => {
              setSelectedZone(zone);
              setShowZoneForm(true);
            }
          }}
        >
          <LeafletPopup>
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
          </LeafletPopup>
        </LeafletPolygon>
      ))}
      
      {/* Mostrar zona en creación */}
      {zoneCoordinates.length > 0 && (
        <LeafletPolygon
          positions={zoneCoordinates.map(coord => [coord.lat, coord.lng])}
          pathOptions={{ 
            color: newZoneColor, 
            fillColor: newZoneColor, 
            fillOpacity: 0.2,
            weight: 2
          }}
        />
      )}
      
      {/* Mostrar inmuebles */}
      {properties.map((property) => (
        property.latitude && property.longitude ? (
          <LeafletMarker
            key={property.id}
            position={[property.latitude, property.longitude]}
            icon={icon}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[property.id] = ref;
                // Notificar inmediatamente cuando se crea un nuevo marcador
                onMarkerRefsUpdate(markerRefs.current);
              }
            }}
            eventHandlers={{
              click: () => {
                onPropertyClick(property);
                setSelectedPropertyId(property.id);
              }
            }}
          >
            <LeafletPopup>
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      property.status === 'SIN_EMPEZAR' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {property.status === 'SIN_EMPEZAR' ? 'Sin empezar' : 'Empezada'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-900`}>
                      {property.type}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Propietario: {property.ownerName}</p>
                    <p className="text-gray-900">Tel: {property.ownerPhone}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => onPropertyClick(property)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver en mapa
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 font-medium"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            </LeafletPopup>
          </LeafletMarker>
        ) : null
      ))}
    </LeafletMapContainer>
  );
});

MapWithDraw.displayName = 'MapWithDraw';

// Función para filtrar inmuebles con coordenadas válidas
const filterValidProperties = (properties: Property[]) => {
  return properties.filter(property => 
    property.latitude !== null && 
    property.longitude !== null && 
    !isNaN(property.latitude) && 
    !isNaN(property.longitude)
  );
};

// Función para verificar si una propiedad está dentro de una zona
const isPropertyInZone = (property: Property, zoneCoordinates: { lat: number; lng: number }[]) => {
  if (!property.latitude || !property.longitude) return false;
  
  // Implementación simple del algoritmo point-in-polygon
  let inside = false;
  for (let i = 0, j = zoneCoordinates.length - 1; i < zoneCoordinates.length; j = i++) {
    const xi = zoneCoordinates[i].lng;
    const yi = zoneCoordinates[i].lat;
    const xj = zoneCoordinates[j].lng;
    const yj = zoneCoordinates[j].lat;
    
    const intersect = ((yi > property.latitude) !== (yj > property.latitude))
        && (property.longitude < (xj - xi) * (property.latitude - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};

export default function ZonesPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, isAdmin, refreshToken } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [zoneCoordinates, setZoneCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [center, setCenter] = useState<[number, number]>([39.4025, -0.4022]); // Catarroja, Valencia
  const [zoom, setZoom] = useState(14); // Zoom más cercano para ver mejor Catarroja
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDescription, setNewZoneDescription] = useState('');
  const [newZoneColor, setNewZoneColor] = useState('#FF0000');
  const [isEditing, setIsEditing] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDrawingControl, setShowDrawingControl] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    action: '',
    isOccupied: '',
    isLocated: ''
  });
  const [map, setMap] = useState<L.Map | null>(null);
  const [editableLayers, setEditableLayers] = useState<L.FeatureGroup | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [activeTab, setActiveTab] = useState<'map' | 'zones'>('map');
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [showZoneDetails, setShowZoneDetails] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');

  // Importar estilos de leaflet-draw
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css');
      import('leaflet-draw/dist/leaflet.draw.css');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching properties and zones...');
        
        const [propertiesData, zonesData] = await Promise.all([
          getProperties(),
          getZones()
        ]);
        
        console.log('Properties fetched:', propertiesData);
        console.log('Zones fetched:', zonesData);
        
        if (!propertiesData || propertiesData.length === 0) {
          console.log('No properties found');
          setError('No se encontraron inmuebles');
          return;
        }

        // Filtrar inmuebles con coordenadas válidas
        const validProperties = filterValidProperties(propertiesData);

        console.log('Valid properties with coordinates:', validProperties);
        
        setProperties(validProperties);
        setAllProperties(validProperties); // Guardar todos los inmuebles válidos
        setZones(zonesData);
        
        // Solo centrar en la primera propiedad si no hay zonas existentes
        if (validProperties.length > 0 && zonesData.length === 0) {
          const firstProperty = validProperties[0];
          console.log('Centering map on first property:', firstProperty);
          setCenter([firstProperty.latitude!, firstProperty.longitude!]);
        }
        // Si no hay inmuebles válidos, mantener Catarroja como centro por defecto
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setSelectedPropertyId(property.id);
    setShowPropertyDetails(true);
    
    // Verificar que las coordenadas existan antes de centrar el mapa
    if (property.latitude && property.longitude) {
      setCenter([property.latitude, property.longitude]);
      setZoom(15);
    }
    
    // Asegurarse de que el popup se abra cuando se selecciona una propiedad
    console.log(`Propiedad seleccionada: ${property.id}`);
  };

  const handleZoneClick = async (zone: Zone) => {
    setSelectedZone(zone);
    setSelectedProperty(null);
    setSelectedPropertyId(null); // Limpiar la propiedad seleccionada al cambiar de zona
    setShowZoneDetails(true);
    
    try {
      // Filtrar inmuebles que están dentro de la zona
      const propertiesInZone = allProperties.filter(property => 
        isPropertyInZone(property, zone.coordinates)
      );
      
      setProperties(propertiesInZone);
      
      // Calcular el centro de la zona
      const centerLat = zone.coordinates.reduce((sum, coord) => sum + coord.lat, 0) / zone.coordinates.length;
      const centerLng = zone.coordinates.reduce((sum, coord) => sum + coord.lng, 0) / zone.coordinates.length;
      
      // Centrar el mapa en la zona
      setCenter([centerLat, centerLng]);
      setZoom(13);
    } catch (error) {
      console.error('Error filtering properties in zone:', error);
    }
  };

  const handleZoneCreated = (coordinates: { lat: number; lng: number }[]) => {
    setZoneCoordinates(coordinates);
    setShowZoneForm(true);
  };

  const handleZoneFormSubmit = async (formData: ZoneFormData) => {
    try {
      if (selectedZone) {
        await updateZone(selectedZone.id, {
          ...formData,
        coordinates: zoneCoordinates
      });
      } else {
        await createZone({
          ...formData,
          color: formData.color || '#FF0000',
          coordinates: zoneCoordinates
        });
      }
      const updatedZones = await getZones();
      setZones(updatedZones);
      setShowZoneForm(false);
      setSelectedZone(null);
      setZoneCoordinates([]);
    } catch (error) {
      console.error('Error saving zone:', error);
      setError('Error al guardar la zona');
    }
  };

  const handlePolygonCreated = (e: any) => {
    const layer = e.layer;
    const latLngs = layer.getLatLngs()[0] as L.LatLng[];
    const coordinates = latLngs.map(latLng => ({
      lat: latLng.lat,
      lng: latLng.lng
    }));
    setZoneCoordinates(coordinates);
    setShowZoneForm(true);
  };

  const handlePolygonEdited = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: L.Polygon) => {
      const latLngs = layer.getLatLngs()[0] as L.LatLng[];
      const coordinates = latLngs.map(latLng => ({
        lat: latLng.lat,
        lng: latLng.lng
      }));
      const zone = zones.find(z => 
        z.coordinates?.some((c, i) => 
          c.lat === coordinates[i].lat && c.lng === coordinates[i].lng
        )
      );
      if (zone) {
        setSelectedZone(zone);
        setZoneCoordinates(coordinates);
    setShowZoneForm(true);
      }
    });
  };

  const handlePolygonDeleted = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: L.Polygon) => {
      const latLngs = layer.getLatLngs()[0] as L.LatLng[];
      const coordinates = latLngs.map(latLng => ({
        lat: latLng.lat,
        lng: latLng.lng
      }));
      const zone = zones.find(z => 
        z.coordinates?.some((c, i) => 
          c.lat === coordinates[i].lat && c.lng === coordinates[i].lng
        )
      );
      if (zone) {
        deleteZone(zone.id);
        setZones(zones.filter(z => z.id !== zone.id));
      }
    });
  };

  const handleDeleteZone = async (zone: Zone) => {
    try {
      await deleteZone(zone.id);
      setZones(zones.filter(z => z.id !== zone.id));
      setShowZoneForm(false);
      setSelectedZone(null);
    } catch (error) {
      console.error('Error deleting zone:', error);
    }
  };

  const showTooltipMessage = (message: string) => {
    setTooltipMessage(message);
    setShowTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando zonas e inmuebles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Gestión de Zonas</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowZoneForm(true);
                  setSelectedZone(null);
              setZoneCoordinates([]);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Nueva Zona
              </button>
              <button
                onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors flex items-center"
              >
                {isMapFullscreen ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a2 2 0 012-2h2V3H7a4 4 0 00-4 4v2h2zm10 0V7a4 4 0 00-4-4h-2v2h2a2 2 0 012 2v2h2zm0 2v2a2 2 0 01-2 2h-2v2h2a4 4 0 004-4v-2h-2zm-10 0v2a4 4 0 004 4h2v-2H9a2 2 0 01-2-2v-2H5z" clipRule="evenodd" />
                    </svg>
                    Salir de pantalla completa
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Pantalla completa
                  </>
                )}
              </button>
      </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`container mx-auto px-4 py-6 ${isMapFullscreen ? 'max-w-full' : ''}`}>
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('map')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'map'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mapa
              </button>
              <button
                onClick={() => setActiveTab('zones')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'zones'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Zonas
              </button>
            </nav>
          </div>
        </div>

        {/* Map View */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px] relative">
                <LeafletMapContainer
            center={center}
            zoom={zoom}
                  style={{ height: '100%', width: '100%' }}
                  whenReady={(mapInstance) => setMap(mapInstance.target)}
                >
                  <LeafletTileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <DrawControl
                    editableLayers={editableLayers}
                    onCreated={handlePolygonCreated}
                    onEdited={handlePolygonEdited}
                    onDeleted={handlePolygonDeleted}
                    polygonColor={selectedColor}
                  />
                  {zones.map((zone) => (
                    <LeafletPolygon
                      key={zone.id}
                      positions={zone.coordinates?.map(coord => [coord.lat, coord.lng]) || []}
                      pathOptions={{
                        color: zone.color || '#FF0000',
                        fillColor: zone.color || '#FF0000',
                        fillOpacity: 0.2
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedZone(zone);
                          setShowZoneForm(true);
                        }
                      }}
                    />
                  ))}
                  
                  {/* Mostrar inmuebles en el mapa */}
                  {properties.map((property) => (
                    property.latitude && property.longitude ? (
                      <LeafletMarker
                        key={property.id}
                        position={[property.latitude, property.longitude]}
                        icon={icon}
                        eventHandlers={{
                          click: () => {
                            onPropertyClick(property);
                            setSelectedPropertyId(property.id);
                          }
                        }}
                      >
                        <LeafletPopup>
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
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  property.status === 'SIN_EMPEZAR' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {property.status === 'SIN_EMPEZAR' ? 'Sin empezar' : 'Empezada'}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                                <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-900`}>
                                  {property.type}
                                </span>
      </div>
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">Propietario: {property.ownerName}</p>
                                <p className="text-gray-900">Tel: {property.ownerPhone}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                  <button
                                  onClick={() => onPropertyClick(property)}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                                  Ver en mapa
                  </button>
                  <button
                                  onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 font-medium"
                                >
                                  Ver detalles
                                </button>
                              </div>
                            </div>
                          </div>
                        </LeafletPopup>
                      </LeafletMarker>
                    ) : null
                  ))}
                </LeafletMapContainer>
                <div className="absolute top-4 right-4 bg-white p-2 rounded-md shadow-md z-10">
                  <div className="flex flex-col space-y-2">
                  <button
                      onClick={() => setShowDrawingControl(!showDrawingControl)}
                      className={`p-2 rounded-md ${showDrawingControl ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                      title="Activar/Desactivar herramientas de dibujo"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                  </button>
                  <button
                    onClick={() => {
                        setCenter([39.4025, -0.4022]);
                        setZoom(14);
                      }}
                      className="p-2 rounded-md bg-gray-100 text-gray-800"
                      title="Centrar mapa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                  </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="bg-white rounded-lg shadow-lg p-4 h-[600px] overflow-y-auto">
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar inmuebles..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                  <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                  Filtros {showFilters ? '(Ocultar)' : '(Mostrar)'}
                  </button>
                
                {showFilters && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Estado</label>
                        <select 
                          className="w-full text-sm border border-gray-300 rounded-md p-1"
                          value={filters.status}
                          onChange={(e) => setFilters({...filters, status: e.target.value})}
                        >
                          <option value="">Todos</option>
                          <option value="SIN_EMPEZAR">Sin empezar</option>
                          <option value="EMPEZADA">Empezada</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                        <select 
                          className="w-full text-sm border border-gray-300 rounded-md p-1"
                          value={filters.type}
                          onChange={(e) => setFilters({...filters, type: e.target.value})}
                        >
                          <option value="">Todos</option>
                          <option value="CASA">Casa</option>
                          <option value="PISO">Piso</option>
                          <option value="LOCAL">Local</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button 
                        onClick={() => setFilters({
                          status: '',
                          type: '',
                          action: '',
                          isOccupied: '',
                          isLocated: ''
                        })}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Zonas</h2>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {zones.length > 0 ? (
                    zones.map((zone) => (
                      <div
                        key={zone.id}
                        className={`border rounded-md p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedZone?.id === zone.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => handleZoneClick(zone)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{zone.name}</h3>
                            <p className="text-xs text-gray-500 truncate">{zone.description}</p>
                          </div>
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: zone.color }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-2">No hay zonas creadas</p>
              )}
            </div>
          </div>
          
              {selectedZone && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">Inmuebles en {selectedZone.name}</h2>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {properties.length > 0 ? (
                      properties.map((property) => (
                <div
                  key={property.id}
                          className={`border rounded-md p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedProperty?.id === property.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handlePropertyClick(property)}
                >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{property.address}</h3>
                              <p className="text-xs text-gray-500">{property.population}</p>
                      </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              property.status === 'SIN_EMPEZAR' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {property.status === 'SIN_EMPEZAR' ? 'Sin empezar' : 'Empezada'}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            <p>Propietario: {property.ownerName}</p>
                            <p>Tel: {property.ownerPhone}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-2">No hay inmuebles en esta zona</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zones List View */}
        {activeTab === 'zones' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Lista de Zonas</h2>
              <button
                onClick={() => {
                  setShowZoneForm(true);
                  setSelectedZone(null);
                  setZoneCoordinates([]);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Nueva Zona
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zones.length > 0 ? (
                zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div 
                      className="h-3"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold">{zone.name}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedZone(zone);
                              setShowZoneForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar zona"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteZone(zone)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar zona"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{zone.description || 'Sin descripción'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {properties.filter(p => isPropertyInZone(p, zone.coordinates)).length} inmuebles
                    </span>
                        <button
                          onClick={() => {
                            setActiveTab('map');
                            handleZoneClick(zone);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver en mapa
                        </button>
                  </div>
                </div>
            </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-gray-500 text-lg">No hay zonas creadas</p>
                  <p className="text-gray-400 text-sm mt-2">Crea una nueva zona para comenzar</p>
                  <button
                    onClick={() => {
                      setShowZoneForm(true);
                      setSelectedZone(null);
                      setZoneCoordinates([]);
                    }}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Crear zona
                  </button>
                      </div>
                    )}
                  </div>
          </div>
        )}
      </main>

      {/* Zone Form Modal */}
      {showZoneForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedZone ? 'Editar Zona' : 'Nueva Zona'}
              </h2>
              <div className="flex items-center space-x-2">
                {selectedZone && (
                  <button
                    onClick={() => handleDeleteZone(selectedZone)}
                    className="text-red-600 hover:text-red-800 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Eliminar
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowZoneForm(false);
                    setSelectedZone(null);
                    setZoneCoordinates([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <ZoneForm
              onSubmit={handleZoneFormSubmit}
              onCancel={() => {
                setShowZoneForm(false);
                setSelectedZone(null);
                setZoneCoordinates([]);
              }}
              initialData={selectedZone || undefined}
            />
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {showPropertyDetails && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Detalles de la Propiedad</h2>
              <button
                onClick={() => setShowPropertyDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedProperty.address}</h3>
                <p className="text-gray-600">{selectedProperty.population}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedProperty.status === 'SIN_EMPEZAR' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedProperty.status === 'SIN_EMPEZAR' ? 'Sin empezar' : 'Empezada'}
                    </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedProperty.action === 'IR_A_DIRECCION' 
                    ? 'bg-blue-100 text-blue-800'
                    : selectedProperty.action === 'REPETIR'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {selectedProperty.action === 'IR_A_DIRECCION' 
                    ? 'Ir a dirección' 
                    : selectedProperty.action === 'REPETIR'
                    ? 'Repetir'
                    : 'Localizar verificado'}
                    </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-900">
                  {selectedProperty.type}
                    </span>
                  </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-2">Información del propietario</h4>
                <p className="text-gray-600">Nombre: {selectedProperty.ownerName}</p>
                <p className="text-gray-600">Teléfono: {selectedProperty.ownerPhone}</p>
                </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-2">Ubicación</h4>
                <p className="text-gray-600">Latitud: {selectedProperty.latitude}</p>
                <p className="text-gray-600">Longitud: {selectedProperty.longitude}</p>
            </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowPropertyDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => router.push(`/dashboard/properties/${selectedProperty.id}`)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Ver detalles completos
                </button>
        </div>
      </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in">
          {tooltipMessage}
        </div>
      )}
    </div>
  );
} 