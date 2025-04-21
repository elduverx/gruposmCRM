/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */

'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import { CatastroProperty } from '@/types/property';
import 'leaflet-draw';
import { debounce } from 'lodash';

// Define Address interface locally to avoid circular import
interface Address {
  id: string;
  street: string;
  number: string;
  portal?: string;
  floor?: string;
  door?: string;
  postalCode: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
  notes?: string;
}

// Fix for default marker icons in leaflet
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 38],
  iconAnchor: [12, 38],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Recenter component
function Recenter({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// DrawControl component
function DrawControl({ onPolygonCreated }: { onPolygonCreated: (coords: L.LatLng[]) => void }) {
  const map = useMap();
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  useEffect(() => {
    if (!map) return;

    // Crear FeatureGroup para almacenar los elementos dibujados
    if (!featureGroupRef.current) {
      featureGroupRef.current = new L.FeatureGroup();
      map.addLayer(featureGroupRef.current);
    }

    // Eliminar controles existentes para evitar duplicados
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
    }

    // Configurar opciones para el control de dibujo
    const drawOptions: L.Control.DrawConstructorOptions = {
      position: 'topright',
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
            message: 'Los polígonos no pueden intersectarse'
          },
          shapeOptions: {
            color: '#3388ff',
            weight: 2
          }
        }
      },
      edit: {
        featureGroup: featureGroupRef.current,
        remove: true
      }
    };

    // Crear el control de dibujo
    drawControlRef.current = new L.Control.Draw(drawOptions);
    map.addControl(drawControlRef.current);

    // Manejar eventos de dibujo
    map.off('draw:created');
    map.off('draw:edited');
    map.off('draw:deleted');

    map.on('draw:created', (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const layer = e.layer;
      featureGroupRef.current?.clearLayers(); // Limpiar polígonos anteriores
      featureGroupRef.current?.addLayer(layer);
      
      // Obtener las coordenadas del polígono
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (layer.getLatLngs && layer.getLatLngs()[0]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        onPolygonCreated(layer.getLatLngs()[0]);
      }
    });

    map.on('draw:edited', (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const layers = e.layers;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      layers.eachLayer((layer: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (layer.getLatLngs && layer.getLatLngs()[0]) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          onPolygonCreated(layer.getLatLngs()[0]);
        }
      });
    });

    map.on('draw:deleted', () => {
      // Cuando se elimina el polígono, resetear el filtro
      onPolygonCreated([]);
    });

    return () => {
      if (map && drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        map.off('draw:created');
        map.off('draw:edited');
        map.off('draw:deleted');
      }
    };
  }, [map, onPolygonCreated]);

  return null;
}

// Función para verificar si un punto está dentro de un polígono
function isPointInPolygon(point: [number, number], polygon: L.LatLng[]): boolean {
  if (!polygon || polygon.length === 0) return true; // Si no hay polígono, mostrar todos los puntos
  
  const x = point[0];
  const y = point[1];
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

interface DynamicMapProps {
  addresses: Address[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (addressId: string) => void;
  selectedAddressId?: string | null;
  catastroProperties?: CatastroProperty[];
  showCatastro?: boolean;
}

// Función para geocodificar una dirección y obtener coordenadas precisas
async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    // Usamos la API de OpenStreetMap Nominatim para geocodificación
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=es`
    );
    
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('Error al geocodificar:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      return [lat, lon];
    }
    
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error de geocodificación:', error);
    return null;
  }
}

// Type definitions for Leaflet layers and events
interface LeafletLayer {
  getLatLngs: () => L.LatLng[][];
  eachLayer: (callback: (layer: LeafletLayer) => void) => void;
  layers: LeafletLayer[];
}

export default function DynamicMap({ 
  addresses, 
  center = [39.4015, -0.4027], // Default to Catarroja
  zoom = 15,
  onMarkerClick,
  selectedAddressId,
  catastroProperties = [],
  showCatastro = false
}: DynamicMapProps) {
  const [allMarkers, setAllMarkers] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState<number>(zoom);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const [visibleMarkers, setVisibleMarkers] = useState<any[]>([]);
  const [polygonCoords, setPolygonCoords] = useState<L.LatLng[]>([]);
  const [isFilteringByPolygon, setIsFilteringByPolygon] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const mapRef = useRef<L.Map | null>(null);
  const [showPropertyList, setShowPropertyList] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("address");
  const [filterFloor, setFilterFloor] = useState<string>("");
  const [uniqueFloors, setUniqueFloors] = useState<string[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [showGeocodingControls, setShowGeocodingControls] = useState(false);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  
  // Memoized data source based on props
  const dataSource = useMemo(() => {
    return showCatastro ? catastroProperties : addresses;
  }, [showCatastro, catastroProperties, addresses]);

  // Función para formatear la dirección completa para geocodificación
  const formatFullAddress = useCallback((item: any): string => {
    const isCatastroProperty = 'reference' in item;
    
    let address = '';
    
    if (isCatastroProperty) {
      // Formato para propiedades de catastro
      address = item.address || '';
      
      if (!address && item.streetType && item.streetName) {
        address = `${item.streetType} ${item.streetName}`;
        if (item.number) address += `, ${item.number}`;
      }
    } else {
      // Formato para direcciones generales
      address = `${item.street || ''}, ${item.number || ''}`;
      if (item.postalCode) address += `, ${item.postalCode}`;
      if (item.city) address += ` ${item.city}`;
      if (item.province) address += `, ${item.province}`;
    }
    
    // Añadir "Catarroja, Valencia, España" si no hay suficientes detalles
    if (!address.includes('Catarroja') && !address.toLowerCase().includes('valencia')) {
      address += ', Catarroja, Valencia, España';
    } else if (!address.toLowerCase().includes('españa')) {
      address += ', España';
    }
    
    return address;
  }, []);

  // Effect to update data source when props change
  useEffect(() => {
    console.log("Data source changed:", showCatastro ? 
      `Using ${catastroProperties.length} cadastral properties` : 
      `Using ${addresses.length} addresses`);
      
    setAllMarkers(dataSource);
    
    // No cargamos marcadores inicialmente - los cargaremos bajo demanda
    setVisibleMarkers([]);
    
  }, [dataSource]);

  // Function to handle polygon creation/edit
  const handlePolygonCreated = useCallback((coords: L.LatLng[]) => {
    setPolygonCoords(coords);
    setIsFilteringByPolygon(coords.length > 0);
    
    // Limpiamos los marcadores visibles y luego aplicamos el filtro
    setVisibleMarkers([]);
    
    // Mostrar la lista de propiedades cuando se dibuja un polígono
    setShowPropertyList(coords.length > 0);
    
    // Restablecer filtros cuando se cambia de polígono
    setFilterFloor("");
    
    // Trigger viewport update to refresh markers
    if (mapRef.current) {
      refreshMarkersInView(mapRef.current);
    }
  }, []);

  // Función para mejorar la precisión de coordenadas a través de geocodificación
  const improveCoordinatesPrecision = useCallback(async () => {
    if (!isFilteringByPolygon || polygonCoords.length === 0) {
      alert("Primero debes seleccionar una zona dibujando un polígono.");
      return;
    }
    
    setIsGeocoding(true);
    setGeocodingProgress(0);
    
    // Filtramos los marcadores dentro del polígono
    const markersInPolygon = allMarkers.filter((marker) => 
      marker.lat && marker.lng && isPointInPolygon([marker.lat, marker.lng], polygonCoords)
    );
    
    if (markersInPolygon.length === 0) {
      alert("No hay propiedades en la zona seleccionada para geocodificar.");
      setIsGeocoding(false);
      return;
    }
    
    // Solo procesaremos un máximo de 100 marcadores por limitaciones de la API
    const maxToProcess = Math.min(100, markersInPolygon.length);
    const markersToProcess = markersInPolygon.slice(0, maxToProcess);
    
    const updatedMarkers = [...allMarkers];
    
    // Usamos for loop para controlar la velocidad y evitar sobrecargar la API
    for (let i = 0; i < markersToProcess.length; i++) {
      const marker = markersToProcess[i];
      const fullAddress = formatFullAddress(marker);
      
      if (fullAddress) {
        try {
          // Esperar un tiempo entre peticiones para no sobrecargar la API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const coordinates = await geocodeAddress(fullAddress);
          if (coordinates) {
            // Encontrar el índice del marcador en el array original
            const index = updatedMarkers.findIndex(m => {
              const mId = 'reference' in m ? m.reference : m.id;
              const markerId = 'reference' in marker ? marker.reference : marker.id;
              return mId === markerId;
            });
            
            if (index !== -1) {
              // Actualizar coordenadas
              updatedMarkers[index] = {
                ...updatedMarkers[index],
                lat: coordinates[0],
                lng: coordinates[1],
                coordinatesPrecision: 'exact' // Marcar como coordenadas precisas
              };
            }
          }
        } catch (error) {
          console.error(`Error geocodificando ${fullAddress}:`, error);
        }
      }
      
      // Actualizar progreso
      setGeocodingProgress(Math.round(((i + 1) / markersToProcess.length) * 100));
    }
    
    // Actualizar marcadores con las nuevas coordenadas
    setAllMarkers(updatedMarkers);
    setIsGeocoding(false);
    
    // Refrescar vista
    if (mapRef.current) {
      refreshMarkersInView(mapRef.current);
    }
    
    alert(`Se ha mejorado la precisión de ${maxToProcess} propiedades en la zona seleccionada.`);
  }, [allMarkers, isFilteringByPolygon, polygonCoords, formatFullAddress]);
  
  // Función para exportar los datos con coordenadas precisas
  const exportGeocodedData = useCallback(() => {
    // Filtrar propiedades con coordenadas geocodificadas
    const geocodedProperties = allMarkers.filter(
      marker => marker.coordinatesPrecision === 'exact'
    );
    
    if (geocodedProperties.length === 0) {
      alert("No hay propiedades con coordenadas precisas para exportar. Ejecuta primero la geocodificación.");
      return;
    }
    
    // Preparar datos para exportar
    const exportData = geocodedProperties.map(prop => {
      const isCatastro = 'reference' in prop;
      
      return {
        id: isCatastro ? prop.reference : prop.id,
        address: isCatastro ? 
          (prop.address || `${prop.streetType || ''} ${prop.streetName || ''}, ${prop.number || ''}`) : 
          `${prop.street || ''}, ${prop.number || ''}`,
        floor: prop.floor || '',
        latitude: prop.lat,
        longitude: prop.lng,
        ...(isCatastro && { reference: prop.reference }),
        ...(isCatastro && { constructedArea: prop.constructedArea })
      };
    });
    
    // Convertir a JSON y crear blob
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    
    // Crear URL y link para descargar
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'propiedades_geocodificadas.json';
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [allMarkers]);

  // Custom marker icons based on coordinate precision
  const getMarkerIcon = useCallback((item: any, isSelected: boolean, isFloorMatch: boolean) => {
    if (isSelected) {
      return L.icon({
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/marker-shadow.png',
        iconSize: [35, 50],
        iconAnchor: [17, 50],
        className: `selected-marker ${item.coordinatesPrecision === 'exact' ? 'exact-marker' : ''}`
      });
    } else if (isFloorMatch) {
      return L.icon({
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/marker-shadow.png',
        iconSize: [30, 45],
        iconAnchor: [15, 45],
        className: `pulse-marker ${item.coordinatesPrecision === 'exact' ? 'exact-marker' : ''}`
      });
    } else {
      // Usar el icono predeterminado con clase según la precisión
      return L.icon({
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/marker-shadow.png',
        iconSize: [25, 38],
        iconAnchor: [12, 38],
        className: item.coordinatesPrecision === 'exact' ? 'exact-marker' : ''
      });
    }
  }, []);

  // Utility function to check if a marker matches search
  const markerMatchesSearch = useCallback((marker: any, term: string): boolean => {
    if (!term || term.trim() === '') return true;
    
    const searchLower = term.toLowerCase();
    
    // Determine if marker is CatastroProperty or Address
    const isCatastroProperty = 'reference' in marker;
    
    if (isCatastroProperty) {
      // Floor search for CatastroProperty
      if (marker.floor && marker.floor.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in other fields
      return (
        (marker.reference && marker.reference.toLowerCase().includes(searchLower)) ||
        (marker.streetName && marker.streetName.toLowerCase().includes(searchLower)) ||
        (marker.address && marker.address.toLowerCase().includes(searchLower)) ||
        (marker.door && marker.door.toLowerCase().includes(searchLower)) ||
        (marker.number && marker.number.toLowerCase().includes(searchLower))
      );
    } else {
      // Floor search for Address
      if (marker.floor && marker.floor.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in other fields
      return (
        (marker.street && marker.street.toLowerCase().includes(searchLower)) ||
        (marker.number && marker.number.toLowerCase().includes(searchLower)) ||
        (marker.door && marker.door.toLowerCase().includes(searchLower)) ||
        (marker.postalCode && marker.postalCode.includes(searchLower)) ||
        (marker.city && marker.city.toLowerCase().includes(searchLower))
      );
    }
  }, []);

  // Debounced function to refresh markers
  const refreshMarkersInView = useCallback((map: L.Map) => {
    if (!map) return;
    
    const bounds = map.getBounds();
    const currentZoom = map.getZoom();
    const currentMarkers = allMarkers;
    
    // Si no hay suficiente zoom, limitamos el número de marcadores
    if (currentZoom < 13) {
      // eslint-disable-next-line no-console
      console.log(`Zoom level too low (${currentZoom}), showing only zone selector`);
      setVisibleMarkers([]);
      return;
    }
    
    // First filter by search term to prioritize searched properties
    let filtered = currentMarkers;
    
    // Si estamos filtrando por polígono, este es el filtro prioritario
    if (isFilteringByPolygon && polygonCoords.length > 0) {
      filtered = filtered.filter((marker) => 
        isPointInPolygon([marker.lat, marker.lng], polygonCoords)
      );
      
      // eslint-disable-next-line no-console
      console.log(`Filtered to ${filtered.length} markers within polygon`);
      
      // Si no hay resultados dentro del polígono, no mostramos nada
      if (filtered.length === 0) {
        setVisibleMarkers([]);
        return;
      }
      
      // Extraer pisos únicos para el selector de filtro
      const floors = filtered
        .map(item => item.floor || "")
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
      
      return;
    } else if (currentZoom < 15) {
      // Si no hay polígono y el zoom es bajo, mostramos un número limitado
      // para evitar sobrecargar el mapa
      const sampleSize = Math.min(50, Math.floor(filtered.length * 0.05));
      // eslint-disable-next-line no-console
      console.log(`No polygon, medium zoom level (${currentZoom}), showing sample of ${sampleSize} markers`);
      filtered = filtered.slice(0, sampleSize);
    }
    
    // Aplicar filtro adicional por piso si está seleccionado
    if (filterFloor) {
      filtered = filtered.filter(marker => 
        marker.floor && marker.floor.toLowerCase() === filterFloor.toLowerCase()
      );
    }
    
    // Luego aplicamos el filtro de búsqueda si existe
    if (searchTerm) {
      filtered = filtered.filter(marker => markerMatchesSearch(marker, searchTerm));
      
      // If specifically searching for a floor, prioritize floor results
      if (searchTerm.toLowerCase().includes('piso') || 
          searchTerm.toLowerCase().includes('planta') ||
          /^\d+[a-z]?$/i.test(searchTerm.trim())) { // Match floor numbers like "1", "2A", etc.
        
        // Move matches to the top
        filtered.sort((a, b) => {
          const aHasFloor = a.floor && a.floor.toLowerCase().includes(searchTerm.toLowerCase());
          const bHasFloor = b.floor && b.floor.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (aHasFloor && !bHasFloor) return -1;
          if (!aHasFloor && bHasFloor) return 1;
          return 0;
        });
      }
    }
    
    // Ordenar los resultados según el criterio seleccionado
    filtered = sortProperties(filtered, sortBy);
    
    // A continuación, filtramos por la vista actual del mapa
    if (!showPropertyList) { // Solo aplicamos este filtro si no estamos mostrando la lista
      filtered = filtered.filter((marker) => {
        return marker.lat && marker.lng && 
          bounds.contains(new L.LatLng(marker.lat, marker.lng));
      });
    }
    
    console.log(`Found ${filtered.length} markers in current view${isFilteringByPolygon ? ' and within polygon' : ''}${searchTerm ? ' matching search' : ''}`);
    
    // Limit to max markers to maintain performance
    const maxMarkers = isFilteringByPolygon ? 1000 : 300; // Permitimos más marcadores si hay polígono
    const markersToShow = filtered.length > maxMarkers ? 
      filtered.slice(0, maxMarkers) : filtered;
      
    console.log(`Displaying ${markersToShow.length} markers (limited to ${maxMarkers} max)`);
    setVisibleMarkers(markersToShow);
  }, [allMarkers, isFilteringByPolygon, polygonCoords, searchTerm, markerMatchesSearch, filterFloor, sortBy, showPropertyList]);

  // Debounced version of refreshMarkersInView to avoid excessive updates
  const debouncedRefreshMarkers = useMemo(
    () => debounce(refreshMarkersInView, 300),
    [refreshMarkersInView]
  );

  // Effect to center the map on the selected address
  useEffect(() => {
    if (selectedAddressId && addresses) {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      if (selectedAddress) {
        setMapCenter([selectedAddress.lat, selectedAddress.lng]);
        setMapZoom(17); // Zoom in a bit
      }
    }
  }, [selectedAddressId, addresses]);

  // Función para ordenar propiedades
  const sortProperties = useCallback((properties: any[], criteria: string) => {
    return [...properties].sort((a, b) => {
      switch (criteria) {
        case 'floor':
          const floorA = a.floor || '';
          const floorB = b.floor || '';
          return floorA.localeCompare(floorB);
        case 'address':
          const addressA = 'reference' in a 
            ? (a.address || `${a.streetType || ''} ${a.streetName || ''}, ${a.number || ''}`)
            : (a.street || '');
          const addressB = 'reference' in b 
            ? (b.address || `${b.streetType || ''} ${b.streetName || ''}, ${b.number || ''}`)
            : (b.street || '');
          return addressA.localeCompare(addressB);
        case 'size':
          const sizeA = a.constructedArea ? parseFloat(a.constructedArea) : 0;
          const sizeB = b.constructedArea ? parseFloat(b.constructedArea) : 0;
          return sizeB - sizeA; // Mayor a menor
        default:
          return 0;
      }
    });
  }, []);

  // Handler para seleccionar una propiedad en la lista
  const handlePropertySelect = useCallback((id: string) => {
    setSelectedProperty(id);
    
    // Buscar la propiedad para centrar el mapa
    const property = visibleMarkers.find(item => {
      const propId = 'reference' in item ? item.reference : item.id;
      return propId === id;
    });
    
    if (property && property.lat && property.lng) {
      // Primero centrar el mapa en la ubicación
      setMapCenter([property.lat, property.lng]);
      setMapZoom(18); // Zoom más cercano
      
      // Abrir el popup después de que el mapa se haya centrado
      setTimeout(() => {
        const marker = markerRefs.current[id];
        if (marker) {
          try {
            // Intentar abrir el popup
            marker.openPopup();
            
            // Asegurarnos de que sea visible resaltándolo
            marker.setZIndexOffset(1000); // Poner este marcador por encima de los demás
            
            // Registrar en consola para depuración
            // eslint-disable-next-line no-console
            console.log('Abriendo popup para marcador:', id);
            
            // Programar otro intento por si el primer intento falla debido a timing
            setTimeout(() => {
              if (marker && marker.getPopup && !marker.getPopup()?.isOpen()) {
                marker.openPopup();
                // eslint-disable-next-line no-console
                console.log('Segundo intento de abrir popup');
              }
            }, 500);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Error al abrir popup:', e);
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn('No se encontró el marcador con ID:', id);
          
          // Si no se encuentra el marcador en las referencias, podría ser porque
          // no está en el DOM todavía. Intentamos forzar un nuevo renderizado
          // para asegurarnos de que todos los marcadores estén disponibles.
          if (mapRef.current) {
            refreshMarkersInView(mapRef.current);
            
            // Programar otro intento después del renderizado
            setTimeout(() => {
              const marker = markerRefs.current[id];
              if (marker) {
                marker.openPopup();
                // eslint-disable-next-line no-console
                console.log('Popup abierto después de refrescar marcadores');
              }
            }, 300);
          }
        }
      }, 400); // Incrementar el tiempo de espera para asegurar que el mapa se haya actualizado
    }
  }, [visibleMarkers, refreshMarkersInView]);

  // Effect para cambiar el filtro de piso
  useEffect(() => {
    if (mapRef.current) {
      refreshMarkersInView(mapRef.current);
    }
  }, [filterFloor, sortBy]);

  // Función para formatear la dirección según el tipo de propiedad
  const formatAddress = useCallback((item: any) => {
    const isCatastroProperty = 'reference' in item;
    if (isCatastroProperty) {
      return item.address || `${item.streetType || ''} ${item.streetName || ''}, ${item.number || ''}`;
    } else {
      return `${item.street || ''}, ${item.number || ''}`;
    }
  }, []);

  // Handler for search input changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Refresh markers with the new search term
    if (mapRef.current) {
      debouncedRefreshMarkers(mapRef.current);
    }
  }, [debouncedRefreshMarkers]);

  // Component to handle map events and prevent infinite loop
  function MapUpdater() {
    const map = useMap();
    
    // Store map reference
    useEffect(() => {
      mapRef.current = map;
      
      // Initial filtering when map is ready
      debouncedRefreshMarkers(map);
      
      // Required cleanup
      return () => {
        mapRef.current = null;
      };
    }, [map]);
    
    // Set up event listeners for map movement and zoom
    useEffect(() => {
      function onMapChange() {
        debouncedRefreshMarkers(map);
      }
      
      // Use addEventListener instead of on for compatibility
      map.addEventListener('moveend', onMapChange);
      map.addEventListener('zoomend', onMapChange);
      
      return () => {
        map.removeEventListener('moveend', onMapChange);
        map.removeEventListener('zoomend', onMapChange);
      };
    }, [map]);
    
    return null;
  }

  if (typeof window === 'undefined') {
    return (
      <div className="h-[600px] w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-500">
        <p>Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col md:flex-row h-[600px]">
      {/* Contenedor del mapa */}
      <div className={`relative ${showPropertyList ? 'md:w-2/3' : 'w-full'} h-full`}>
        {/* Search input */}
        <div className="absolute top-4 left-4 z-[1000] w-64">
          <input
            type="text"
            placeholder="Buscar por piso, dirección, etc..."
            className="w-full p-2 rounded-md shadow-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* Control de Geocodificación */}
        <div className="absolute top-4 right-4 z-[1000]">
          <button 
            className="bg-white p-2 rounded-md shadow-md border border-gray-300 text-gray-700 hover:bg-gray-50 mb-2"
            onClick={() => setShowGeocodingControls(!showGeocodingControls)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showGeocodingControls && (
            <div className="bg-white p-3 rounded-md shadow-md border border-gray-300 w-60">
              <h4 className="font-medium text-sm mb-2">Mejorar precisión de ubicaciones</h4>
              
              {isGeocoding ? (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${geocodingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">Geocodificando... {geocodingProgress}%</p>
                </div>
              ) : (
                <>
                  <button 
                    className="w-full bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600 mb-2"
                    onClick={improveCoordinatesPrecision}
                    disabled={!isFilteringByPolygon}
                  >
                    Geocodificar selección
                  </button>
                  
                  <button 
                    className="w-full bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-200"
                    onClick={exportGeocodedData}
                  >
                    Exportar datos
                  </button>
                  
                  <div className="mt-2 text-xs">
                    <div className="flex items-center mb-1">
                      <span className="h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
                      <span>Ubicación aproximada</span>
                    </div>
                    <div className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                      <span>Ubicación precisa</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          className="rounded-lg overflow-hidden shadow-md"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomright" />
          <Recenter center={mapCenter} zoom={mapZoom} />
          <DrawControl onPolygonCreated={handlePolygonCreated} />
          <MapUpdater />
          
          <LayerGroup>
            {visibleMarkers.map((item, index) => {
              // Handle both Address and CatastroProperty types
              const isCatastroProperty = 'reference' in item;
              const id = isCatastroProperty ? item.reference : item.id;
              const position: [number, number] = [
                item.lat || mapCenter[0],
                item.lng || mapCenter[1]
              ];
              
              // Highlight marker if it matches floor search or is selected
              const isFloorMatch = searchTerm && item.floor && 
                item.floor.toLowerCase().includes(searchTerm.toLowerCase());
              
              const isSelected = id === selectedProperty;
              
              // Obtener icono según la precisión de las coordenadas
              const markerIcon = getMarkerIcon(item, isSelected, isFloorMatch);
              
              return (
                <Marker
                  key={id || index}
                  position={position}
                  icon={markerIcon}
                  ref={(ref) => {
                    if (id) markerRefs.current[id] = ref;
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedProperty(id);
                      if (onMarkerClick && id) {
                        onMarkerClick(id);
                      }
                    }
                  }}
                >
                  <Popup>
                    {isCatastroProperty ? (
                      // CatastroProperty popup
                      <div className="p-2">
                        <h3 className="font-bold">{item.address || `${item.streetType} ${item.streetName}, ${item.number}`}</h3>
                        <p>Ref. Catastral: {item.reference}</p>
                        {item.block && <p>Bloque: {item.block}</p>}
                        {item.stairway && <p>Escalera: {item.stairway}</p>}
                        {item.floor && (
                          <p className={isFloorMatch ? "font-bold text-blue-600" : ""}>
                            Planta: {item.floor}
                          </p>
                        )}
                        {item.door && <p>Puerta: {item.door}</p>}
                        {item.age && <p>Año: {item.age}</p>}
                        {item.quality && <p>Calidad: {item.quality}</p>}
                        {item.constructedArea && <p>Superficie: {item.constructedArea}m²</p>}
                        {item.propertyType && <p>Tipo: {item.propertyType}</p>}
                        {item.reformType && item.reformType !== ' ' && <p>Tipo reforma: {item.reformType}</p>}
                        <p className="mt-2 text-xs text-gray-500">
                          Coordenadas: {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                          <br/>
                          <span className={item.coordinatesPrecision === 'exact' ? 'text-green-600' : 'text-blue-600'}>
                            Precisión: {item.coordinatesPrecision === 'exact' ? 'Exacta' : 'Aproximada'}
                          </span>
                        </p>
                      </div>
                    ) : (
                      // Address popup
                      <div className="p-2">
                        <h3 className="font-bold">{item.street}, {item.number}</h3>
                        {item.portal && <p>Portal: {item.portal}</p>}
                        {item.floor && (
                          <p className={isFloorMatch ? "font-bold text-blue-600" : ""}>
                            Planta: {item.floor}
                          </p>
                        )}
                        {item.door && <p>Puerta: {item.door}</p>}
                        <p>{item.postalCode} {item.city}, {item.province}</p>
                        {item.notes && <p className="text-sm text-gray-500 mt-1">{item.notes}</p>}
                        <p className="mt-2 text-xs text-gray-500">
                          Coordenadas: {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                          <br/>
                          <span className={item.coordinatesPrecision === 'exact' ? 'text-green-600' : 'text-blue-600'}>
                            Precisión: {item.coordinatesPrecision === 'exact' ? 'Exacta' : 'Aproximada'}
                          </span>
                        </p>
                      </div>
                    )}
                  </Popup>
                </Marker>
              );
            })}
          </LayerGroup>
        </MapContainer>
        
        <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-md shadow-md z-[1000] text-sm">
          {isFilteringByPolygon ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Mostrando <b>{visibleMarkers.length}</b> inmuebles en la zona seleccionada</span>
            </div>
          ) : (
            <div>
              <p>Dibuja un polígono para ver los inmuebles de esa zona</p>
              <p className="text-xs text-gray-500">Usa la herramienta de dibujo en la esquina superior derecha</p>
            </div>
          )}
          {searchTerm && <div className="mt-1">Buscando: "{searchTerm}"</div>}
        </div>
      </div>
      
      {/* Panel lateral con lista de propiedades */}
      {showPropertyList && (
        <div className="md:w-1/3 w-full h-full overflow-hidden flex flex-col bg-white border-l border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold mb-2">Propiedades en la zona</h3>
            <p className="text-sm text-gray-600 mb-3">
              {visibleMarkers.length} inmuebles encontrados
            </p>
            
            {/* Filtros y ordenación */}
            <div className="flex flex-col space-y-2">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Ordenar por:</label>
                <select 
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="address">Dirección</option>
                  <option value="floor">Planta</option>
                  <option value="size">Tamaño</option>
                </select>
              </div>
              
              {uniqueFloors.length > 0 && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Filtrar por planta:</label>
                  <select 
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    value={filterFloor}
                    onChange={(e) => setFilterFloor(e.target.value)}
                  >
                    <option value="">Todas las plantas</option>
                    {uniqueFloors.map(floor => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {visibleMarkers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {visibleMarkers.map((item) => {
                  const isCatastroProperty = 'reference' in item;
                  const id = isCatastroProperty ? item.reference : item.id;
                  const isSelected = id === selectedProperty;
                  const isPrecise = item.coordinatesPrecision === 'exact';
                  
                  return (
                    <li 
                      key={id} 
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                      onClick={() => handlePropertySelect(id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className={`inline-block h-2 w-2 rounded-full mr-2 ${isPrecise ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                            <p className="font-medium">{formatAddress(item)}</p>
                          </div>
                          
                          <div className="mt-1 text-sm text-gray-600">
                            {item.floor && (
                              <span className="inline-flex items-center mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Planta: {item.floor}
                              </span>
                            )}
                            
                            {item.door && (
                              <span className="inline-flex items-center mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Puerta: {item.door}
                              </span>
                            )}
                          </div>
                          
                          {isCatastroProperty && (
                            <div className="mt-1 flex text-xs text-gray-500">
                              {item.constructedArea && (
                                <span className="inline-flex items-center mr-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3-3 3 3 3-3 3 3V4a2 2 0 00-2-2H5zm2.5 3a.5.5 0 00-.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 010-1h1a.5.5 0 00.5-.5v-1a.5.5 0 01.5-.5h6a.5.5 0 01.5.5v1a.5.5 0 00.5.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5v-1a.5.5 0 00-.5-.5h-6z" clipRule="evenodd" />
                                  </svg>
                                  {item.constructedArea}m²
                                </span>
                              )}
                              {item.reference && (
                                <span className="truncate max-w-[120px]">Ref: {item.reference}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-center p-4">
                  No se encontraron propiedades en el área seleccionada
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Estilos para la animación del marcador */}
      <style jsx global>{`
        .pulse-marker {
          animation: pulse 1.5s infinite;
        }
        
        .selected-marker {
          filter: hue-rotate(190deg) brightness(1.2);
          animation: bounce 1s infinite;
        }
        
        .exact-marker {
          filter: hue-rotate(90deg) brightness(1.1);
        }
        
        .selected-marker.exact-marker {
          filter: hue-rotate(90deg) brightness(1.2);
          animation: bounce 1s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
} 