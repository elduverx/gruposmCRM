'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { getProperties } from '../properties/actions';
import { getZones, createZone, Zone, updateZone, deleteZone } from './actions';
import { Property } from '@/types/property';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { MagnifyingGlassIcon, FunnelIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React from 'react';
import { MapContainer as LeafletMapContainer, TileLayer as LeafletTileLayer, Marker as LeafletMarker, Popup as LeafletPopup, Polygon as LeafletPolygon } from 'react-leaflet';

// Componente para el formulario de zonas
interface ZoneFormProps {
  zone?: Zone | null;
  onSubmit: (formData: { name: string; description: string; color: string }) => void;
  onCancel: () => void;
}

function ZoneForm({ zone, onSubmit, onCancel }: ZoneFormProps) {
  const [formData, setFormData] = useState({
    name: zone?.name || '',
    description: zone?.description || '',
    color: zone?.color || '#FF0000'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6">
          {zone ? 'Editar Zona' : 'Nueva Zona'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="h-10 w-20 rounded-md border-gray-300"
              />
              <span className="text-sm text-gray-500">{formData.color}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {zone ? 'Guardar Cambios' : 'Crear Zona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
              const coordinates = latLngs.map((latLng: L.LatLng | L.LatLng[]) => {
                if (latLng instanceof L.LatLng) {
                  return {
                    lat: latLng.lat,
                    lng: latLng.lng
                  };
                }
                return null;
              }).filter((coord): coord is { lat: number; lng: number } => coord !== null);
              
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
          positions={zone.coordinates.map(coord => [coord.lat, coord.lng])}
          pathOptions={{ 
            color: zone.color, 
            fillColor: zone.color, 
            fillOpacity: 0.2,
            weight: 2
          }}
          eventHandlers={{
            click: () => onZoneClick(zone)
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
      
      {/* Mostrar propiedades */}
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
                // Asegurarse de que la propiedad seleccionada se actualice en el componente padre
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPropertyClick(property)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver en mapa
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                      className="text-sm text-gray-900 hover:text-gray-700 font-medium"
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

export default function ZonesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>([40.4168, -3.7038]); // Madrid por defecto
  const [zoom, setZoom] = useState(13);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDescription, setNewZoneDescription] = useState('');
  const [newZoneColor, setNewZoneColor] = useState('#FF0000');
  const [zoneCoordinates, setZoneCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
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

        // Filtrar propiedades con coordenadas válidas
        const validProperties = filterValidProperties(propertiesData);

        console.log('Valid properties with coordinates:', validProperties);
        
        setProperties(validProperties);
        setAllProperties(validProperties); // Guardar todas las propiedades válidas
        setZones(zonesData);
        
        // Si hay propiedades válidas, centrar el mapa en la primera
        if (validProperties.length > 0) {
          const firstProperty = validProperties[0];
          console.log('Centering map on first property:', firstProperty);
          setCenter([firstProperty.latitude!, firstProperty.longitude!]);
        }
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
    
    try {
      // Filtrar propiedades que están dentro de la zona
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

  const handleCreateZone = async () => {
    if (zoneCoordinates.length < 3) {
      alert('Necesitas al menos 3 puntos para crear una zona');
      return;
    }

    try {
      // Crear la zona con las coordenadas
      const newZone = await createZone({
        name: newZoneName,
        description: newZoneDescription,
        color: newZoneColor,
        coordinates: zoneCoordinates
      });

      // Añadir la zona a la lista de zonas
      setZones([...zones, newZone]);
      
      // Filtrar propiedades que están dentro de la zona
      const propertiesInZone = allProperties.filter(property => 
        isPropertyInZone(property, newZone.coordinates)
      );
      
      // Actualizar la lista de propiedades mostradas
      setProperties(propertiesInZone);
      
      // Seleccionar la zona recién creada
      setSelectedZone(newZone);
      
      // Calcular el centro de la zona
      const centerLat = zoneCoordinates.reduce((sum, coord) => sum + coord.lat, 0) / zoneCoordinates.length;
      const centerLng = zoneCoordinates.reduce((sum, coord) => sum + coord.lng, 0) / zoneCoordinates.length;
      
      // Centrar el mapa en la zona
      setCenter([centerLat, centerLng]);
      setZoom(13);
      
      // Limpiar el formulario
      setZoneCoordinates([]);
      setNewZoneName('');
      setNewZoneDescription('');
      setNewZoneColor('#FF0000');
      setShowZoneForm(false);
      
      // Mostrar mensaje de éxito
      alert(`Zona creada correctamente. Se encontraron ${propertiesInZone.length} inmuebles dentro de la zona.`);
    } catch (error) {
      console.error('Error creating zone:', error);
      alert('Error al crear la zona');
    }
  };

  const handleCancelZoneCreation = () => {
    setZoneCoordinates([]);
    setNewZoneName('');
    setNewZoneDescription('');
    setNewZoneColor('#FF0000');
    setShowZoneForm(false);
  };

  const handleStartEditing = (zone: Zone) => {
    setEditingZone(zone);
    setNewZoneName(zone.name);
    setNewZoneDescription(zone.description || '');
    setNewZoneColor(zone.color);
    setZoneCoordinates(zone.coordinates);
    setShowZoneForm(true);
  };

  const handleEditZone = async () => {
    if (!editingZone) return;

    try {
      const updatedZone = await updateZone(editingZone.id, {
        name: newZoneName,
        description: newZoneDescription,
        color: newZoneColor,
        coordinates: zoneCoordinates
      });

      // Actualizar la lista de zonas
      setZones(zones.map(zone => zone.id === updatedZone.id ? updatedZone : zone));
      
      // Limpiar el formulario
      setZoneCoordinates([]);
      setNewZoneName('');
      setNewZoneDescription('');
      setNewZoneColor('#FF0000');
      setShowZoneForm(false);
      setIsEditing(false);
      setEditingZone(null);
      
      // Mostrar mensaje de éxito
      alert('Zona actualizada correctamente');
    } catch (error) {
      console.error('Error updating zone:', error);
      alert('Error al actualizar la zona');
    }
  };

  const handleDeleteZone = async () => {
    if (!selectedZone) return;

    if (!confirm('¿Estás seguro de que quieres eliminar esta zona?')) return;

    try {
      await deleteZone(selectedZone.id);
      
      // Actualizar la lista de zonas
      setZones(zones.filter(zone => zone.id !== selectedZone.id));
      
      // Limpiar la selección
      setSelectedZone(null);
      
      // Recargar todas las propiedades
      const propertiesData = await getProperties();
      if (propertiesData) {
        const validProperties = filterValidProperties(propertiesData);
        setProperties(validProperties);
      }
      
      // Mostrar mensaje de éxito
      alert('Zona eliminada correctamente');
    } catch (error) {
      console.error('Error deleting zone:', error);
      alert('Error al eliminar la zona');
    }
  };

  // Función para determinar si un punto está dentro de un polígono
  const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  // Función para filtrar propiedades con coordenadas válidas
  const filterValidProperties = (properties: Property[]): Property[] => {
    return properties.filter(prop => 
      prop.latitude !== null && 
      prop.longitude !== null && 
      !isNaN(prop.latitude || 0) && 
      !isNaN(prop.longitude || 0)
    );
  };

  // Función para verificar si una propiedad está dentro de una zona
  const isPropertyInZone = (property: Property, zoneCoordinates: { lat: number; lng: number }[]): boolean => {
    if (!property.latitude || !property.longitude) return false;
    
    return isPointInPolygon(
      [property.latitude, property.longitude],
      zoneCoordinates.map(coord => [coord.lat, coord.lng])
    );
  };

  const handleZoneFormSubmit = (formData: { name: string; description: string; color: string }) => {
    if (editingZone) {
      // Actualizar zona existente
      setNewZoneName(formData.name);
      setNewZoneDescription(formData.description);
      setNewZoneColor(formData.color);
      handleEditZone();
    } else {
      // Crear nueva zona
      setNewZoneName(formData.name);
      setNewZoneDescription(formData.description);
      setNewZoneColor(formData.color);
      handleCreateZone();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Mapa de Zonas</h1>
            <p className="mt-2 text-sm text-gray-700">
              Visualiza y gestiona las zonas de inmuebles en el mapa.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {properties.length} inmuebles encontrados
            </p>
          </div>
        </div>
        
        {/* Formulario de zona */}
        {showZoneForm && (
          <ZoneForm
            zone={editingZone}
            onSubmit={handleZoneFormSubmit}
            onCancel={() => {
              setShowZoneForm(false);
              setEditingZone(null);
              setZoneCoordinates([]);
              setNewZoneName('');
              setNewZoneDescription('');
              setNewZoneColor('#FF0000');
            }}
          />
        )}
      </div>
      
      {/* Mapa */}
      <div className="flex-1 min-h-[50vh]">
        {icon && (
          <MapWithDraw
            center={center}
            zoom={zoom}
            properties={properties}
            zones={zones}
            newZoneColor={newZoneColor}
            zoneCoordinates={zoneCoordinates}
            onZoneCreated={handleZoneCreated}
            onPropertyClick={handlePropertyClick}
            onZoneClick={handleZoneClick}
            selectedPropertyId={selectedPropertyId}
            onEditZone={handleStartEditing}
            onDeleteZone={handleDeleteZone}
            onMarkerRefsUpdate={(refs) => {
              // Implementa la lógica para notificar cambios en los marcadores
            }}
            setSelectedPropertyId={(id) => {
              setSelectedPropertyId(id);
            }}
          />
        )}
      </div>

      {/* Lista de zonas e inmuebles */}
      <div className="h-[40vh] border-t border-gray-200">
        <div className="p-2">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedZone ? `Inmuebles en ${selectedZone.name}` : 'Todos los Inmuebles'}
            </h2>
            <div className="flex space-x-2">
              {selectedZone && (
                <>
                  <button
                    onClick={() => handleStartEditing(selectedZone)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Editar Zona
                  </button>
                  <button
                    onClick={handleDeleteZone}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Eliminar Zona
                  </button>
                  <button
                    onClick={() => {
                      setSelectedZone(null);
                      setSelectedPropertyId(null);
                      getProperties().then(data => {
                        if (data) {
                          const validProperties = filterValidProperties(data);
                          setProperties(validProperties);
                        }
                      });
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Ver todos los inmuebles
                  </button>
                </>
              )}
            </div>
          </div>
          
          {selectedZone ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 overflow-y-auto h-[calc(40vh-3rem)]">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedProperty?.id === property.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => handlePropertyClick(property)}
                >
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-gray-900 text-sm">{property.address}</h3>
                    <span className="text-xs text-gray-900 mt-1">{property.population}</span>
                    {property.dpv && (
                      <div className="mt-1 text-xs text-gray-900">
                        <span className="font-medium">DPV: </span>
                        {property.dpv.toString()}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-900">
                      {property.type}
                    </span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-900">
                      {property.status}
                    </span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-900">
                      {property.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 overflow-y-auto h-[calc(40vh-3rem)]">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedProperty?.id === property.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => handlePropertyClick(property)}
                >
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-gray-900 text-sm">{property.address}</h3>
                    <span className="text-xs text-gray-900 mt-1">{property.population}</span>
                    {property.dpv && (
                      <div className="mt-1 text-xs text-gray-900">
                        <span className="font-medium">DPV: </span>
                        {property.dpv.toString()}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-900">
                      {property.type}
                    </span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-900">
                      {property.status}
                    </span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-900">
                      {property.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 