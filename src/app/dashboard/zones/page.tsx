'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { getProperties } from '../properties/actions';
import { getZones, createZone, Zone, updateZone, deleteZone } from './actions';
import { Property } from '@/types/property';
import L from 'leaflet';

// Importar componentes de Leaflet dinámicamente para evitar el error de window
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" />
});

const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), {
  ssr: false
});

const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), {
  ssr: false
});

const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), {
  ssr: false
});

const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), {
  ssr: false
});

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
const MapWithDraw = ({ 
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
  onDeleteZone
}: { 
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
  onDeleteZone: (zone: Zone) => void
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const initializedRef = useRef<boolean>(false);
  
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
      }, 300); // Aumentar el tiempo de espera para asegurar que el mapa esté listo
    }
  }, [selectedPropertyId]);

  // Efecto para inicializar el control de dibujo
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || !initializedRef.current) return;
    
    // Guardar una referencia al mapa actual
    const currentMap = mapRef.current;
    
    const initializeDrawControl = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet-draw');
        
        // Crear un grupo de características para almacenar las zonas dibujadas
        if (!featureGroupRef.current) {
          featureGroupRef.current = new L.FeatureGroup().addTo(currentMap);
        }
        
        // Crear el control de dibujo
        if (!drawControlRef.current) {
          drawControlRef.current = new L.Control.Draw({
            draw: {
              // Deshabilitar todas las herramientas de dibujo excepto polígono
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
          
          // Añadir el control al mapa
          currentMap.addControl(drawControlRef.current);
          
          // Evento cuando se completa el dibujo de un polígono
          currentMap.on('draw:created', (e: { layer: L.Layer }) => {
            const layer = e.layer;
            featureGroupRef.current?.addLayer(layer);
            
            // Obtener las coordenadas del polígono
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
                
                // Llamar a la función de callback con las coordenadas
                onZoneCreated(coordinates);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error al inicializar el control de dibujo:', error);
      }
    };
    
    // Iniciar el control de dibujo
    initializeDrawControl();
    
    // Función de limpieza
    return () => {
      console.log('Limpiando control de dibujo');
      if (drawControlRef.current && currentMap) {
        currentMap.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
      if (featureGroupRef.current && currentMap) {
        currentMap.removeLayer(featureGroupRef.current);
        featureGroupRef.current = null;
      }
    };
  }, [onZoneCreated, newZoneColor]);

  // Efecto para asegurar que el control de dibujo permanezca visible
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || !initializedRef.current) return;
    
    // Guardar una referencia al mapa actual
    const currentMap = mapRef.current;
    
    const ensureDrawControlVisible = async () => {
      try {
        const L = await import('leaflet');
        
        // Verificar si el control de dibujo ya está en el mapa
        if (!currentMap) return;
        
        // @ts-expect-error - La propiedad _toolbar no está en los tipos de Leaflet
        const drawControls = currentMap._toolbar?._container?.children;
        
        if (!drawControls || drawControls.length === 0) {
          console.log('Reinicializando control de dibujo...');
          
          // Crear FeatureGroup si no existe
          if (!featureGroupRef.current) {
            featureGroupRef.current = new L.FeatureGroup();
            currentMap.addLayer(featureGroupRef.current);
          }
          
          // Configurar el control de dibujo
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
                  color: '#FF0000'
                }
              }
            },
            edit: {
              featureGroup: featureGroupRef.current,
              remove: true
            }
          });
          
          // Guardar referencia al control
          drawControlRef.current = drawControl;
          
          // Añadir el control al mapa
          currentMap.addControl(drawControl);
          console.log('Control de dibujo reinicializado');
        }
      } catch (error) {
        console.error('Error al asegurar que el control de dibujo esté visible:', error);
      }
    };
    
    // Asegurar que el control de dibujo esté visible
    ensureDrawControlVisible();
  }, [selectedPropertyId]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef as unknown as React.RefObject<L.Map>}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Mostrar zonas */}
      {zones.map((zone) => (
        <Polygon
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
      
      {/* Mostrar zona en creación */}
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
      
      {/* Mostrar propiedades */}
      {properties.map((property) => (
        property.latitude && property.longitude ? (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
            icon={icon}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[property.id] = ref;
              }
            }}
            eventHandlers={{
              click: () => {
                onPropertyClick(property);
              }
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{property.address}</h3>
                <p className="text-sm text-gray-600">{property.population}</p>
                <p className="text-sm text-gray-600">Estado: {property.status}</p>
                <p className="text-sm text-gray-600">Propietario: {property.ownerName}</p>
                <p className="text-sm text-gray-600">Teléfono: {property.ownerPhone}</p>
                <p className="text-sm text-gray-600">Tipo: {property.type}</p>
                <p className="text-sm text-gray-600">Acción: {property.action}</p>
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  );
};

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
    setSelectedZone(zone);
    setEditingZone(zone);
    setIsEditing(true);
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
        
        {showZoneForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Editar Zona' : 'Detalles de la Zona'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="zoneName" className="block text-sm font-medium text-gray-700">
                  Nombre de la Zona
                </label>
                <input
                  type="text"
                  id="zoneName"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Ej: Zona Centro"
                />
              </div>
              <div>
                <label htmlFor="zoneDescription" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <input
                  type="text"
                  id="zoneDescription"
                  value={newZoneDescription}
                  onChange={(e) => setNewZoneDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Ej: Área central de la ciudad"
                />
              </div>
              <div>
                <label htmlFor="zoneColor" className="block text-sm font-medium text-gray-700">
                  Color
                </label>
                <input
                  type="color"
                  id="zoneColor"
                  value={newZoneColor}
                  onChange={(e) => setNewZoneColor(e.target.value)}
                  className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={isEditing ? handleEditZone : handleCreateZone}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {isEditing ? 'Guardar Cambios' : 'Guardar Zona'}
              </button>
              <button
                onClick={() => {
                  handleCancelZoneCreation();
                  setIsEditing(false);
                  setEditingZone(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
            </div>
          </div>
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
          />
        )}
      </div>

      {/* Lista de zonas e inmuebles */}
      <div className="h-[40vh] border-t border-gray-200">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
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
                      setSelectedPropertyId(null); // Limpiar la propiedad seleccionada
                      // Recargar todas las propiedades
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto h-[calc(40vh-5rem)]">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedProperty?.id === property.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => handlePropertyClick(property)}
                >
                  <h3 className="font-semibold">{property.address}</h3>
                  <p className="text-sm text-gray-600">{property.population}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {property.type}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {property.status}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {property.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto h-[calc(40vh-5rem)]">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedProperty?.id === property.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => handlePropertyClick(property)}
                >
                  <h3 className="font-semibold">{property.address}</h3>
                  <p className="text-sm text-gray-600">{property.population}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {property.type}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {property.status}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
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