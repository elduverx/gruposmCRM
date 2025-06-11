/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// @ts-nocheck

'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { getProperties } from '../properties/actions';
import { getZones, createZone, Zone, updateZone, deleteZone, getPropertiesInZone, getZoneNewsAndAssignments } from './actions';
import { updateProperty } from '../properties/actions';
import { Property } from '@/types/property';
import { useRouter, usePathname } from 'next/navigation';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import dynamic from 'next/dynamic';
import SearchBar from '@/components/common/SearchBar';
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import L from 'leaflet';

// Importar el mapa dinámicamente para evitar errores de SSR
const ZonesMap = dynamic(() => import('@/components/map/ZonesMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-gray-100 animate-pulse" />
});

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
          📝 Nombre de la zona
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-lg text-slate-700 placeholder-slate-400"
          placeholder="Ingresa el nombre de la zona..."
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-bold text-slate-700 mb-2">
          📄 Descripción
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-lg text-slate-700 placeholder-slate-400"
          placeholder="Describe la zona (opcional)..."
          rows={3}
        />
      </div>
      
      <div>
        <label htmlFor="color" className="block text-sm font-bold text-slate-700 mb-2">
          🎨 Color de identificación
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            id="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="w-16 h-12 rounded-xl border border-white/20 shadow-lg cursor-pointer"
          />
          <div className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-600 font-medium">
            Color seleccionado: {formData.color}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
        >
          ❌ Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
        >
          {initialData ? '✏️ Actualizar' : '🆕 Crear'}
        </button>
      </div>
    </form>
  );
};

// Función para filtrar inmuebles con coordenadas válidas
const filterValidProperties = (properties: Property[]) => {
  return properties.filter(property => property.latitude && property.longitude);
};

// Función para verificar si una propiedad está dentro de una zona
const isPropertyInZone = (property: Property, zoneCoordinates: { lat: number; lng: number }[]) => {
  if (!property.latitude || !property.longitude) return false;
  
  const point = { lat: property.latitude, lng: property.longitude };
  let inside = false;
  
  for (let i = 0, j = zoneCoordinates.length - 1; i < zoneCoordinates.length; j = i++) {
    const { lat: lati, lng: lngi } = zoneCoordinates[i];
    const { lat: latj, lng: lngj } = zoneCoordinates[j];
    
    const intersect = ((lati > point.lat) !== (latj > point.lat)) &&
      (point.lng < (lngj - lngi) * (point.lat - lati) / (latj - lati) + lngi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
};

interface NominatimResponse {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Add UserAssignmentModal dynamic import
const UserAssignmentModal = dynamic(() => import('@/components/zones/UserAssignmentModal'), {
  ssr: false
});

export default function ZonesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesData, setPropertiesData] = useState<{ properties: Property[]; total: number }>({ properties: [], total: 0 });
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [newZoneColor, setNewZoneColor] = useState('#FF0000');
  const [zoneCoordinates, setZoneCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [markerRefs, setMarkerRefs] = useState<{ [key: string]: any }>({});
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{id: string, type: 'zone' | 'property' | 'address', name: string, description?: string, lat?: number, lng?: number}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.4015, -0.4027]);
  const [mapZoom, setMapZoom] = useState(15);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, name: string} | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<any>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [zoneNews, setZoneNews] = useState<PropertyNews[]>([]);
  const [zoneAssignments, setZoneAssignments] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [zoneLocalizedProperties, setZoneLocalizedProperties] = useState<Property[]>([]);
  const [zoneSearchTerm, setZoneSearchTerm] = useState('');
  const [visibleProperties, setVisibleProperties] = useState<Property[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const propertiesPerPage = 100;
  const [totalProperties, setTotalProperties] = useState(0);
  const [showUserAssignmentModal, setShowUserAssignmentModal] = useState(false);
  const [zoneUsers, setZoneUsers] = useState<{ [zoneId: string]: { id: string; name: string | null; email: string }[] }>({});

  // Función para cargar propiedades de forma paginada
  const loadProperties = useCallback(async (page = 1, searchTerm = '', zoneId?: string, loadAll = false) => {
    try {
      setIsLoadingProperties(true);
      
      // Si se solicita cargar todas las propiedades de una zona específica
      if (loadAll && zoneId) {
        const data = await getProperties(1, 10000, searchTerm, 'updatedAt', 'desc', zoneId);
        setProperties(data.properties);
        setVisibleProperties(data.properties);
        setTotalProperties(data.total);
        setHasMore(false); // No hay más para cargar si ya tenemos todas
        setCurrentPage(1);
        return data;
      }
      
      // Caso normal con paginación
      const data = await getProperties(page, propertiesPerPage, searchTerm, 'updatedAt', 'desc', zoneId);
      
      if (page === 1 || searchTerm !== '') {
        // Si es la primera página o hay un término de búsqueda, reemplazar las propiedades
        setProperties(data.properties);
        setVisibleProperties(data.properties);
      } else {
        // Si es paginación sin búsqueda, añadir a las propiedades existentes
        setProperties(prev => [...prev, ...data.properties]);
        setVisibleProperties(prev => [...prev, ...data.properties]);
      }
      
      setTotalProperties(data.total);
      setHasMore(data.properties.length === propertiesPerPage && page * propertiesPerPage < data.total);
      setCurrentPage(page);
      return data;
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Error al cargar las propiedades');
      return null;
    } finally {
      setIsLoadingProperties(false);
    }
  }, [propertiesPerPage]);

  // Cargar más propiedades cuando el usuario hace scroll
  const loadMoreProperties = async () => {
    if (isLoadingMore || !hasMore) return;
    
    try {
      setIsLoadingMore(true);
      await loadProperties(currentPage + 1, searchTerm, selectedZoneId || undefined);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Efecto para cargar datos cuando el componente se monta o cuando el usuario regresa a la página
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar zonas
        setLoadingZones(true);
        const zonesData = await getZones();
        setZones(zonesData);
        setLoadingZones(false);
        
        // Cargar propiedades paginadas
        const propertiesData = await loadProperties(1);
        
        // Cargar noticias de todas las zonas
        setIsLoadingNews(true);
        const allNews = await Promise.all(
          zonesData.map(zone => getZoneNewsAndAssignments(zone.id))
        );
        const flattenedNews = allNews.flatMap(result => result.news);
        setZoneNews(flattenedNews);
        setIsLoadingNews(false);
        
        // Si hay una zona seleccionada, actualizar sus datos
        if (selectedZoneId) {
          const selectedZone = zonesData.find(zone => zone.id === selectedZoneId);
          if (selectedZone) {
            setIsLoadingNews(true);
            const { news, assignments } = await getZoneNewsAndAssignments(selectedZoneId);
            setZoneNews(news);
            setZoneAssignments(assignments);
            setIsLoadingNews(false);
            
            // Actualizar las propiedades localizadas
            const localizedProps = getLocalizedPropertiesInSelectedZone();
            setZoneLocalizedProperties(localizedProps);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pathname, loadProperties]); // Dependencias actualizadas

  // Al cambiar la búsqueda, reiniciar la paginación
  useEffect(() => {
    if (searchTerm.trim() !== '') {
      setCurrentPage(1);
      loadProperties(1, searchTerm);
    }
  }, [searchTerm, loadProperties]);

  // Al seleccionar una zona, cargar todas sus propiedades específicas
  useEffect(() => {
    if (selectedZoneId) {
      setCurrentPage(1);
      loadProperties(1, '', selectedZoneId, true); // Cargar todas las propiedades de la zona
    }
  }, [selectedZoneId, loadProperties]);

  const handleZoneCreated = (coordinates: { lat: number; lng: number }[]) => {
    setZoneCoordinates(coordinates);
    setShowZoneForm(true);
  };

  const handleZoneFormSubmit = async (data: ZoneFormData) => {
    try {
      if (editingZone) {
        const updatedZone = await updateZone(editingZone.id, {
          name: data.name,
          description: data.description,
          color: data.color,
          coordinates: zoneCoordinates.length > 0 ? zoneCoordinates : editingZone.coordinates
        });
        setZones(prev => prev.map(zone => zone.id === updatedZone.id ? updatedZone : zone));
        
        // Cerrar el formulario y limpiar los estados inmediatamente después de la actualización
        setShowZoneForm(false);
        setEditingZone(null);
        setZoneCoordinates([]);
        toast.success('Zona actualizada correctamente');
      } else {
        if (!data.name || !data.color || zoneCoordinates.length === 0) {
          alert('Por favor, completa todos los campos requeridos');
          return;
        }
        
        // Cerrar el formulario inmediatamente
        setShowZoneForm(false);
        setEditingZone(null);
        setZoneCoordinates([]);
        
        // Mostrar un toast de carga explícito con mayor duración
        toast.success('Creando zona...', {
          duration: 3000,
        });
        
        // Crear la zona y gestionar errores específicos
        try {
          await createZone({
            name: data.name,
            description: data.description || '',
            color: data.color,
            coordinates: zoneCoordinates
          });
          
          // Si llegamos aquí, la zona se creó correctamente
          toast.success('¡Zona creada! Actualizando vista...', {
            duration: 3000,
          });
          
          // Forzar redirección garantizada con un hash único para evitar caché de cualquier tipo
          setTimeout(() => {
            const timestamp = new Date().getTime();
            const randomStr = Math.random().toString(36).substring(7);
            window.location.href = `/dashboard/zones?reload=${timestamp}&uid=${randomStr}`;
          }, 1500);
        } catch (error) {
          console.error('Error creating zone:', error);
          
          // Verificar si el error es de clave foránea pero la zona se creó de todas formas
          const errorStr = String(error);
          if (errorStr.includes('Foreign key constraint violated') || 
              errorStr.includes('zoneId') || 
              errorStr.includes('P2003')) {
            
            // La zona se creó pero hubo error al asignar propiedades
            toast.success('¡Zona creada correctamente! Actualizando vista...', {
              duration: 3000,
            });
            
            // Forzar redirección total con parámetros únicos
            setTimeout(() => {
              const timestamp = new Date().getTime();
              const randomStr = Math.random().toString(36).substring(7);
              window.location.href = `/dashboard/zones?reload=${timestamp}&uid=${randomStr}`;
            }, 1500);
          } else {
            // Otro tipo de error
            toast.error('Error al crear la zona. Intentando recargar...');
            
            // Intentar recargar de todas formas por si la zona se creó
            setTimeout(() => {
              const timestamp = new Date().getTime();
              const randomStr = Math.random().toString(36).substring(7);
              window.location.href = `/dashboard/zones?reload=${timestamp}&uid=${randomStr}`;
            }, 1500);
          }
        }
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('Error en el formulario');
    }
  };

  // Efectos especiales para detectar la recarga desde una creación de zona
  useEffect(() => {
    // Verificar si venimos de una creación/recarga de zona
    const urlParams = new URLSearchParams(window.location.search);
    const reloadParam = urlParams.get('reload');
    
    if (reloadParam) {
      // Limpiar la URL para evitar recargas repetidas
      window.history.replaceState({}, document.title, '/dashboard/zones');
      
      // Mostrar notificación de éxito (solo si no hay una ya visible)
      const toastId = toast.success('¡Zona creada correctamente!');
      
      // Forzar una recarga completa de los datos
      const loadFreshData = async () => {
        setLoadingZones(true);
        try {
          // Obtener las zonas más recientes directamente del servidor
          const freshZones = await getZones();
          setZones(freshZones);
          
          // Cargar las propiedades - Aumentar significativamente el límite para ver más propiedades
          const data = await getProperties(1, 1000, '', 'updatedAt', 'desc', null);
          if (data) {
            setProperties(data.properties);
            setVisibleProperties(data.properties);
            setTotalProperties(data.total);
            setHasMore(data.properties.length < data.total);
            setCurrentPage(1);
          }
          
          // Si hay zonas, centrar el mapa en la más reciente (primera de la lista)
          if (freshZones.length > 0) {
            const newestZone = freshZones[0];
            if (newestZone.coordinates && newestZone.coordinates.length > 0) {
              const lats = newestZone.coordinates.map(coord => coord.lat);
              const lngs = newestZone.coordinates.map(coord => coord.lng);
              const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
              const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
              
              setMapCenter([centerLat, centerLng]);
              setMapZoom(15);
              
              if (mapRef.current) {
                // Dar tiempo para que el mapa se renderice completamente
                setTimeout(() => {
                  mapRef.current.invalidateSize();
                  mapRef.current.setView([centerLat, centerLng], 15);
                }, 300);
              }
            }
          }
        } catch (err) {
          console.error('Error cargando datos frescos:', err);
          toast.error('Error al cargar los datos actualizados');
        } finally {
          setLoadingZones(false);
        }
      };
      
      loadFreshData();
    }
  }, [loadProperties]);

  // Función para refrescar todos los datos
  const refreshData = async () => {
    setLoading(true);
    try {
      // Recargar zonas
      const freshZones = await getZones();
      setZones(freshZones);
      
      // Recargar propiedades con límite mucho mayor
      const data = await getProperties(1, 1000, '', 'updatedAt', 'desc', null);
      if (data) {
        setProperties(data.properties);
        setVisibleProperties(data.properties);
        setTotalProperties(data.total);
        setHasMore(data.properties.length < data.total);
        setCurrentPage(1);
      }
      
      // Recargar noticias
      const allNews = await Promise.all(
        freshZones.map(zone => getZoneNewsAndAssignments(zone.id))
      );
      const flattenedNews = allNews.flatMap(result => result.news);
      setZoneNews(flattenedNews);
      
      // Centrar el mapa en la zona más reciente
      if (freshZones.length > 0) {
        const newestZone = freshZones[0]; // La primera zona debería ser la más reciente
        if (newestZone.coordinates && newestZone.coordinates.length > 0) {
          const lats = newestZone.coordinates.map(coord => coord.lat);
          const lngs = newestZone.coordinates.map(coord => coord.lng);
          const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
          const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
          
          setMapCenter([centerLat, centerLng]);
          
          if (mapRef.current) {
            setTimeout(() => {
              mapRef.current.invalidateSize();
              mapRef.current.setView([centerLat, centerLng], 15);
            }, 100);
          }
        }
      }
      
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error refrescando datos:', error);
      toast.error('Error al actualizar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
  };

  const handleDeleteZone = async (zone: Zone) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta zona?')) {
      try {
        await deleteZone(zone.id);
        setZones(prev => prev.filter(z => z.id !== zone.id));
      } catch (error) {
        console.error('Error deleting zone:', error);
        alert('Error al eliminar la zona');
      }
    }
  };

  const onPropertyClick = (property: Property) => {
    setSelectedPropertyId(property.id);
    
    // Center map on property location if coordinates are available
    if (property.latitude && property.longitude) {
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Update map center and zoom
        setMapCenter([lat, lng]);
        setMapZoom(16); // Zoom in to show the property better
        
        // Set selected location to show the marker
        setSelectedLocation({
          lat,
          lng,
          name: property.address || 'Propiedad seleccionada'
        });
        
        // Force a re-render of the map component
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 16);
          }
        }, 100);
      }
    }
  };

  const handleZoneClick = (zone: Zone) => {
    setSelectedZoneId(zone.id);
    // Eliminar la asignación a editingZone para evitar que se active el modo de edición
    // setEditingZone(zone); - Comentado para prevenir que el formulario se abra en modo de edición
    
    // Cargar todas las propiedades de la zona seleccionada
    loadProperties(1, '', zone.id, true).then(() => {
      // Una vez cargadas las propiedades, actualizar las propiedades localizadas en una única operación
      const localizedProps = properties.filter(property => 
        (property.zoneId === zone.id || 
         (property.latitude && property.longitude && isPropertyInZone(property, zone.coordinates))) && 
        (property.isLocated === true || property.isLocated === "true")
      );
      
      setZoneLocalizedProperties(localizedProps);
    });
    
    // Cargar las noticias de la zona seleccionada
    setIsLoadingNews(true);
    getZoneNewsAndAssignments(zone.id)
      .then(({ news, assignments }) => {
        setZoneNews(news);
        setZoneAssignments(assignments);
      })
      .catch(error => {
        console.error('Error loading zone news and assignments:', error);
        toast.error('Error al cargar las noticias y encargos de la zona');
      })
      .finally(() => {
        setIsLoadingNews(false);
      });
    
    setSelectedZone(zone);
  };

  const handlePolygonEdited = async (zone: Zone, newCoordinates: { lat: number; lng: number }[]) => {
    try {
      const updatedZone = await updateZone({
        ...zone,
        coordinates: newCoordinates
      });
      setZones(prev => prev.map(z => z.id === updatedZone.id ? updatedZone : z));
    } catch (error) {
      console.error('Error updating zone:', error);
    }
  };

  const handlePolygonDeleted = async (zone: Zone) => {
    await handleDeleteZone(zone);
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Actualizar sugerencias cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchSuggestions([]);
      return;
    }

    // Limpiar el timeout anterior si existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Establecer un nuevo timeout para evitar demasiadas llamadas a la API
    searchTimeoutRef.current = setTimeout(async () => {
      // Primero, buscar en zonas y propiedades locales
      const localSuggestions = [
        ...zones.map(zone => ({
          id: zone.id,
          type: 'zone' as const,
          name: zone.name,
          description: zone.description
        })),
        ...properties.map(property => ({
          id: property.id,
          type: 'property' as const,
          name: property.address,
          description: property.population
        }))
      ].filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      setSearchSuggestions(localSuggestions);
      setShowSuggestions(true);

      // Si el término de búsqueda tiene al menos 3 caracteres, buscar direcciones globales
      if (searchTerm.length >= 3) {
        try {
          setIsSearchingAddress(true);
          // Priorizar España en la búsqueda
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&countrycodes=es&limit=5`
          );
          
          if (response.ok) {
            const data = await response.json();
            
            // Añadir las direcciones encontradas a las sugerencias
            const addressSuggestions = data.map((item: any) => ({
              id: `address-${item.place_id}`,
              type: 'address' as const,
              name: item.display_name,
              description: `${item.lat}, ${item.lon}`,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            }));
            
            setSearchSuggestions(prev => [...prev, ...addressSuggestions]);
          }
        } catch (error) {
          console.error('Error searching addresses:', error);
        } finally {
          setIsSearchingAddress(false);
        }
      }
    }, 500); // Esperar 500ms antes de hacer la búsqueda

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, zones, properties]);

  const handleSuggestionClick = (suggestion: {id: string, type: 'zone' | 'property' | 'address', name: string, lat?: number, lng?: number}) => {
    if (suggestion.type === 'zone') {
      const zone = zones.find(z => z.id === suggestion.id);
      if (zone) {
        handleZoneClick(zone);
      }
    } else if (suggestion.type === 'property') {
      const property = properties.find(p => p.id === suggestion.id);
      if (property) {
        onPropertyClick(property);
      }
    } else if (suggestion.type === 'address' && suggestion.lat && suggestion.lng) {
      // Centrar el mapa en la ubicación seleccionada
      setMapCenter([suggestion.lat, suggestion.lng]);
      setMapZoom(16); // Aumentar el zoom para ver mejor la ubicación
      
      // Guardar la ubicación seleccionada para mostrar el marcador
      setSelectedLocation({
        lat: suggestion.lat,
        lng: suggestion.lng,
        name: suggestion.name
      });
      
      // Forzar la actualización del mapa después de un breve retraso
      setTimeout(() => {
        // Actualizar el estado para forzar una re-renderización
        setMapCenter(prev => [...prev]);
      }, 100);
    }
    setShowSuggestions(false);
    setSearchTerm('');
  };

  // Función para navegar a la página de creación de inmuebles con la ubicación seleccionada
  const navigateToNewProperty = () => {
    if (selectedLocation) {
      // Guardar la ubicación seleccionada en localStorage para que esté disponible en la página de creación
      localStorage.setItem('selectedLocation', JSON.stringify({
        ...selectedLocation,
        // Asegurarse de que la dirección se guarde correctamente
        address: selectedLocation.name,
        // Añadir un timestamp para evitar problemas de caché
        timestamp: new Date().getTime()
      }));
      
      // Navegar a la página de creación de inmuebles con un parámetro de consulta
      router.push(`/dashboard/properties/new?from=zones&address=${encodeURIComponent(selectedLocation.name)}&lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si hay sugerencias, seleccionar la primera
    if (searchSuggestions.length > 0) {
      handleSuggestionClick(searchSuggestions[0]);
    } else if (searchTerm.trim().length >= 3) {
      // Si no hay sugerencias pero hay un término de búsqueda, buscar directamente
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&countrycodes=es&limit=1`
      )
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            const item = data[0];
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            
            // Centrar el mapa en la ubicación encontrada
            setMapCenter([lat, lng]);
            setMapZoom(16);
            
            // Guardar la ubicación seleccionada para mostrar el marcador
            setSelectedLocation({
              lat: lat,
              lng: lng,
              name: item.display_name
            });
            
            // Forzar la actualización del mapa después de un breve retraso
            setTimeout(() => {
              // Actualizar el estado para forzar una re-renderización
              setMapCenter(prev => [...prev]);
            }, 100);
          }
        })
        .catch(error => {
          console.error('Error searching address:', error);
        });
    }
  };

  // Función para navegar a la página de detalles de una propiedad
  const navigateToProperty = (propertyId: string) => {
    router.push(`/dashboard/properties/${propertyId}`);
  };

  // Obtener las propiedades dentro de la zona seleccionada
  const getPropertiesInSelectedZone = () => {
    if (!selectedZoneId) return [];
    
    const selectedZone = zones.find(zone => zone.id === selectedZoneId);
    if (!selectedZone) return [];
    
    // Filtrar propiedades que están dentro de la zona seleccionada
    const propertiesInZone = properties.filter(property => isPropertyInZone(property, selectedZone.coordinates));
    
    // También incluir propiedades que tienen zoneId igual a selectedZoneId
    const propertiesWithZoneId = properties.filter(property => property.zoneId === selectedZoneId);
    
    // Combinar ambos conjuntos de propiedades, eliminando duplicados
    const combinedProperties = [...propertiesInZone];
    propertiesWithZoneId.forEach(property => {
      if (!combinedProperties.some(p => p.id === property.id)) {
        combinedProperties.push(property);
      }
    });
    
    return combinedProperties;
  };

  // Obtener las propiedades con noticias en la zona seleccionada
  const getPropertiesWithNewsInSelectedZone = () => {
    if (!selectedZoneId) return [];
    
    // Obtener las noticias de la zona seleccionada
    const zoneNewsItems = zoneNews.filter(news => news.property.zoneId === selectedZoneId);
    
    // Obtener IDs únicos de propiedades con noticias
    const propertyIdsWithNews = [...new Set(zoneNewsItems.map(news => news.propertyId))];
    
    // Obtener las propiedades completas
    return properties.filter(property => propertyIdsWithNews.includes(property.id));
  };

  // Obtener las propiedades localizadas en la zona seleccionada
  const getLocalizedPropertiesInSelectedZone = () => {
    if (!selectedZoneId) return [];
    
    // Utilizar directamente las propiedades filtradas por zona
    // en lugar de llamar recursivamente a getPropertiesInSelectedZone
    const selectedZone = zones.find(zone => zone.id === selectedZoneId);
    if (!selectedZone) return [];
    
    // Filtrar directamente las propiedades que tienen zoneId igual a selectedZoneId y están localizadas
    const localizedProps = properties.filter(property => 
      (property.zoneId === selectedZoneId || 
       (property.latitude && property.longitude && isPropertyInZone(property, selectedZone.coordinates))) && 
      (property.isLocated === true || property.isLocated === "true")
    );
    
    return localizedProps;
  };

  // Filtrar propiedades y zonas basadas en el término de búsqueda
  const filteredProperties = useMemo(() => 
    properties.filter(property => 
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.population.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [properties, searchTerm]
  );

  const filteredZones = useMemo(() => 
    zones.filter(zone => 
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (zone.description && zone.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [zones, searchTerm]
  );

  // Filtrar propiedades, noticias y encargos basados en el término de búsqueda de la zona
  const filteredZoneLocalizedProperties = useMemo(() => {
    if (!zoneSearchTerm) return zoneLocalizedProperties;
    
    return zoneLocalizedProperties.filter(property => 
      property.address.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
      property.population.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
      property.ownerName.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
      property.type.toLowerCase().includes(zoneSearchTerm.toLowerCase())
    );
  }, [zoneLocalizedProperties, zoneSearchTerm]);

  const filteredZoneNews = useMemo(() => {
    if (!zoneSearchTerm) return zoneNews;
    
    return zoneNews.filter(news => 
      news.property.address.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
      news.property.population.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
      news.type.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
      news.action.toLowerCase().includes(zoneSearchTerm.toLowerCase())
    );
  }, [zoneNews, zoneSearchTerm]);

  const filteredZoneAssignments = useMemo(() => {
    if (!zoneSearchTerm) return zoneAssignments;
    
    return zoneAssignments.filter(assignment => 
      assignment.property.address.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
      assignment.property.population.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
      (assignment.client && assignment.client.name.toLowerCase().includes(zoneSearchTerm.toLowerCase())) ||
      assignment.type.toLowerCase().includes(zoneSearchTerm.toLowerCase())
    );
  }, [zoneAssignments, zoneSearchTerm]);

  // Filtrar propiedades en la zona seleccionada basadas en el término de búsqueda
  const filteredPropertiesInZone = useMemo(() => {
    if (!selectedZoneId) return [];
    
    const selectedZone = zones.find(zone => zone.id === selectedZoneId);
    if (!selectedZone) return [];
    
    // Filtrar directamente las propiedades que están en la zona o tienen zoneId igual a selectedZoneId
    const propertiesInZone = properties.filter(property => 
      property.zoneId === selectedZoneId || 
      (property.latitude && property.longitude && isPropertyInZone(property, selectedZone.coordinates))
    );
    
    // Aplicar el filtro de búsqueda si existe
    if (!zoneSearchTerm) return propertiesInZone;
    
    return propertiesInZone.filter(property => 
      property.address.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
      property.population.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
      (property.ownerName && property.ownerName.toLowerCase().includes(zoneSearchTerm.toLowerCase())) ||
      (property.type && property.type.toLowerCase().includes(zoneSearchTerm.toLowerCase())) ||
      (property.habitaciones && property.habitaciones.toString().includes(zoneSearchTerm)) ||
      (property.metrosCuadrados && property.metrosCuadrados.toString().includes(zoneSearchTerm))
    );
  }, [selectedZoneId, zoneSearchTerm, properties, zones]);

  // Add function to handle user assignment
  const handleAssignUsers = async (userIds: string[]) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/zones/${selectedZone?.id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ userIds })
      });
      
      if (!response.ok) {
        throw new Error('Error al asignar usuarios a la zona');
      }
      
      // Update zoneUsers state for the selected zone
      if (selectedZone) {
        // Fetch updated users for this zone
        const updatedUsersResponse = await fetch(`/api/zones/${selectedZone.id}/users`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (updatedUsersResponse.ok) {
          const updatedUsers = await updatedUsersResponse.json();
          
          // Update the zoneUsers state
          setZoneUsers(prev => ({
            ...prev,
            [selectedZone.id]: updatedUsers
          }));
        }
      }
      
      toast.success('Usuarios asignados correctamente');
    } catch (error) {
      console.error('Error assigning users to zone:', error);
      toast.error('Error al asignar usuarios a la zona');
    } finally {
      setShowUserAssignmentModal(false);
    }
  };

  // Load users assigned to zones
  useEffect(() => {
    const loadZoneUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': token ? `Bearer ${token}` : ''
        };
        
        const promises = zones.map(zone => 
          fetch(`/api/zones/${zone.id}/users`, { headers })
            .then(response => response.ok ? response.json() : [])
            .catch(() => [])
        );
        
        const results = await Promise.all(promises);
        
        const newZoneUsers: { [zoneId: string]: any[] } = {};
        zones.forEach((zone, index) => {
          newZoneUsers[zone.id] = results[index];
        });
        
        setZoneUsers(newZoneUsers);
      } catch (error) {
        console.error('Error loading zone users:', error);
      }
    };
    
    if (zones.length > 0) {
      loadZoneUsers();
    }
  }, [zones]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
          </div>
          <p className="text-slate-700 text-lg font-medium">🗺️ Cargando zonas e inmuebles...</p>
          <p className="text-slate-500 text-sm mt-2">Preparando la vista de mapas</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-white/20">
          <div className="text-6xl mb-4 animate-bounce">⚠️</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2 font-audiowide">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => router.refresh()}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                    🗺️ Gestión de Zonas
                  </h1>
                  <p className="text-slate-600 mt-1">Administra zonas geográficas y propiedades asociadas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-xl border border-green-200">
                  <span className="text-green-700 font-medium text-sm">🏠 {totalProperties} Propiedades</span>
                </div>
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-xl border border-blue-200">
                  <span className="text-blue-700 font-medium text-sm">📍 {zones.length} Zonas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Enhanced Map Container */}
        <div className="relative mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="h-[65vh] w-full relative">
              {loadingZones && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-2xl">
                  <div className="text-center p-6">
                    <div className="relative mb-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
                    </div>
                    <p className="text-slate-700 font-medium">🗺️ Cargando zonas...</p>
                  </div>
                </div>
              )}
              <ZonesMap
                zones={zones}
                onZoneCreated={handleZoneCreated}
                onZoneClick={handleZoneClick}
                onEditZone={handleEditZone}
                onDeleteZone={handleDeleteZone}
                properties={properties}
                onPropertyClick={onPropertyClick}
                selectedPropertyId={selectedPropertyId}
                setSelectedPropertyId={setSelectedPropertyId}
                handleZoneClick={handleZoneClick}
                selectedLocation={selectedLocation}
                initialCenter={mapCenter}
                initialZoom={mapZoom}
                newZoneColor={newZoneColor}
                zoneCoordinates={zoneCoordinates}
                onMarkerRefsUpdate={setMarkerRefs}
                zoneUsers={zoneUsers}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
                <MagnifyingGlassIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <form onSubmit={handleSearchSubmit} className="relative" ref={searchRef}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-lg text-slate-700 placeholder-slate-400"
                    placeholder="🔍 Buscar zonas, propiedades o direcciones..."
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    {isSearchingAddress ? (
                      <div className="animate-spin h-6 w-6 text-blue-500">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <button type="submit" className="text-blue-500 hover:text-blue-700 transition-colors">
                        <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-2 w-full bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl border border-white/20 max-h-60 overflow-auto">
                      {searchSuggestions.map((suggestion) => (
                        <div
                          key={`${suggestion.type}-${suggestion.id}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer flex items-center justify-between transition-all duration-200 border-b border-slate-100 last:border-b-0"
                        >
                          <div>
                            <div className="font-medium text-slate-800">{suggestion.name}</div>
                            {suggestion.description && (
                              <div className="text-sm text-slate-500">{suggestion.description}</div>
                            )}
                          </div>
                          <div className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                            {suggestion.type === 'zone' ? '📍 Zona' : 
                             suggestion.type === 'property' ? '🏠 Propiedad' : '📍 Dirección'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            </div>
            
            {/* Selected Location Display */}
            {selectedLocation && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">📍 Ubicación seleccionada</p>
                      <p className="text-sm text-blue-600 truncate max-w-xs">{selectedLocation.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={navigateToNewProperty}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>Crear inmueble</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                  Administración de Zonas
                </h2>
                <p className="text-slate-600">Gestiona zonas geográficas y sus propiedades</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 rounded-xl border border-amber-200">
              <span className="text-amber-700 font-medium text-sm">💡 Dibuja un polígono en el mapa para crear una nueva zona</span>
            </div>
          </div>

          {/* Enhanced Zones Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-slate-800 font-audiowide">📍 Lista de Zonas</h3>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg font-medium">
                  {filteredZones.length} zonas
                </div>
              </div>
            </div>
            
            {filteredZones.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {searchTerm ? 'No se encontraron zonas' : 'No hay zonas creadas'}
                </h3>
                <p className="text-slate-500">
                  {searchTerm 
                    ? 'Prueba con otros términos de búsqueda' 
                    : 'Dibuja un polígono en el mapa para crear tu primera zona'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredZones.map((zone) => (
                  <div 
                    key={zone.id} 
                    className={`group p-6 rounded-2xl transition-all duration-300 border cursor-pointer transform hover:scale-105 ${
                      selectedZoneId === zone.id 
                        ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300 shadow-2xl' 
                        : 'bg-white/80 backdrop-blur-sm border-white/20 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 shadow-xl hover:shadow-2xl'
                    }`}
                    onClick={() => handleZoneClick(zone)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-xl shadow-lg ring-2 ring-white" 
                          style={{ backgroundColor: zone.color }}
                        />
                        <div>
                          <h4 className="font-bold text-lg text-slate-800 font-audiowide group-hover:text-blue-800 transition-colors">
                            {zone.name}
                          </h4>
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {zoneUsers[zone.id]?.length > 0 
                              ? `👥 ${zoneUsers[zone.id].map(user => user.name || user.email.split('@')[0]).join(', ')}`
                              : zone.description || '📋 Sin descripción'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteZone(zone);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-3 rounded-xl">
                        <div className="text-blue-800 font-bold text-lg">
                          {getPropertiesInSelectedZone().length || 0}
                        </div>
                        <div className="text-blue-600 text-xs font-medium">🏠 Propiedades</div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-3 rounded-xl">
                        <div className="text-purple-800 font-bold text-lg">
                          {zoneNews.filter(news => news.property.zoneId === zone.id).length}
                        </div>
                        <div className="text-purple-600 text-xs font-medium">📰 Noticias</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-xs text-slate-400 text-center">
                        👆 Click para ver detalles
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Properties Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-slate-800 font-audiowide">🏠 Propiedades</h3>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg font-medium">
                  {selectedZoneId ? filteredPropertiesInZone.length : properties.length} propiedades
                </div>
                {selectedZoneId && (
                  <button
                    onClick={() => {
                      setSelectedZoneId(null);
                      loadProperties(1);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-medium"
                  >
                    🔄 Ver todas las propiedades
                  </button>
                )}
              </div>
              <div className="bg-gradient-to-r from-slate-100 to-blue-100 px-4 py-2 rounded-xl border border-slate-200">
                <span className="text-slate-700 font-medium text-sm">
                  📊 Total: {totalProperties} propiedades
                </span>
              </div>
            </div>
            
            {isLoadingProperties ? (
              <div className="flex justify-center items-center h-32 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
                  </div>
                  <span className="text-slate-700 font-medium">🏠 Cargando propiedades...</span>
                </div>
              </div>
            ) : selectedZoneId && filteredPropertiesInZone.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay propiedades en esta zona</h3>
                <p className="text-slate-500">Esta zona aún no tiene propiedades asignadas</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {searchTerm ? 'No se encontraron propiedades' : 'No hay propiedades asignadas a zonas'}
                </h3>
                <p className="text-slate-500">
                  {searchTerm 
                    ? 'Prueba con otros términos de búsqueda' 
                    : 'Comienza agregando propiedades a las zonas'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {(selectedZoneId ? filteredPropertiesInZone : properties).map((property) => (
                    <div 
                      key={property.id} 
                      className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-slate-800 line-clamp-1 font-audiowide group-hover:text-blue-800 transition-colors">
                              {property.address}
                            </h4>
                            <p className="text-slate-600 text-sm mt-1">{property.population}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {property.status && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              property.status === 'SALE' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' : 
                              property.status === 'RENT' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' : 
                              'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800'
                            }`}>
                              {property.status === 'SALE' ? '💰 Venta' : 
                               property.status === 'RENT' ? '🏠 Alquiler' : 
                               '❓ No especificado'}
                            </span>
                          )}
                          {(property.isLocated === true || property.isLocated === "true") && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-teal-200 text-emerald-800">
                              ✅ Localizado
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => onPropertyClick(property)}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span>Ver en mapa</span>
                          </button>
                          <button
                            onClick={() => navigateToProperty(property.id)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Detalles</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {hasMore && (
                  <div className="text-center pt-8">
                    <button
                      onClick={loadMoreProperties}
                      disabled={isLoadingMore}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isLoadingMore ? (
                        <div className="flex items-center space-x-3">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Cargando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <span>Cargar más propiedades</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Zone Form Modal */}
      {showZoneForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-md shadow-2xl border border-white/20 transform transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                    {editingZone ? '✏️ Editar Zona' : '🆕 Nueva Zona'}
                  </h2>
                  <p className="text-slate-600 text-sm">
                    {editingZone ? 'Modifica los datos de la zona' : 'Crea una nueva zona geográfica'}
                  </p>
                </div>
              </div>
              <ZoneForm
                onSubmit={handleZoneFormSubmit}
                onCancel={() => {
                  setShowZoneForm(false);
                  setEditingZone(null);
                  setZoneCoordinates([]);
                }}
                initialData={editingZone || undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Zone Details Modal */}
      {selectedZoneId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                      📍 {zones.find(z => z.id === selectedZoneId)?.name}
                    </h2>
                    <p className="text-slate-600">Información detallada de la zona</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      const zoneToEdit = zones.find(z => z.id === selectedZoneId);
                      if (zoneToEdit) {
                        setSelectedZoneId(null);
                        setShowUserAssignmentModal(true);
                        setSelectedZone(zoneToEdit);
                      }
                    }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 font-medium"
                  >
                    <UserPlusIcon className="h-5 w-5" />
                    <span>Asignar Usuarios</span>
                  </button>
                  <button
                    onClick={() => setSelectedZoneId(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            
              {/* Enhanced Search Bar for Zone Content */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={zoneSearchTerm}
                        onChange={(e) => setZoneSearchTerm(e.target.value)}
                        placeholder="🔍 Buscar propiedades, noticias o encargos en esta zona..."
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-lg text-slate-700 placeholder-slate-400"
                      />
                      {zoneSearchTerm && (
                        <button
                          onClick={() => setZoneSearchTerm('')}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            
              {isLoadingNews ? (
                <div className="flex justify-center items-center h-32 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <div className="text-center">
                    <div className="relative mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
                    </div>
                    <span className="text-slate-700 font-medium">📊 Cargando información de la zona...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Enhanced Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-blue-800 font-audiowide">🏠 Propiedades</h3>
                      </div>
                      <p className="text-4xl font-bold text-blue-700 mb-2">{filteredPropertiesInZone.length}</p>
                      <p className="text-sm text-blue-600">Total en esta zona</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-xl shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-purple-800 font-audiowide">📰 Noticias</h3>
                      </div>
                      <p className="text-4xl font-bold text-purple-700 mb-2">{filteredZoneNews.length}</p>
                      <p className="text-sm text-purple-600">Inmuebles con noticias activas</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200 shadow-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 rounded-xl shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-orange-800 font-audiowide">📋 Encargos</h3>
                      </div>
                      <p className="text-4xl font-bold text-orange-700 mb-2">{filteredZoneAssignments.length}</p>
                      <p className="text-sm text-orange-600">Total encargos en esta zona</p>
                    </div>
                  </div>
                
                  {/* Enhanced Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Modern News Section */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-purple-800 font-audiowide">📰 Propiedades con noticias</h3>
                      </div>
                      
                      {filteredZoneNews.length === 0 ? (
                        <div className="text-center py-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                          <div className="text-4xl mb-3">📰</div>
                          <p className="text-slate-600 font-medium">No hay propiedades con noticias en esta zona</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                          {filteredZoneNews.map(news => {
                            const property = news.property;
                            return (
                              <div 
                                key={news.id} 
                                className="group p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:scale-105"
                                onClick={() => navigateToProperty(property.id)}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-bold text-slate-800 font-audiowide group-hover:text-purple-800 transition-colors">{property.address}</h4>
                                    <p className="text-sm text-slate-600">{property.population}</p>
                                  </div>
                                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                                    {news.type} - {news.action}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div className="text-sm">
                                    <span className="font-medium text-slate-700">🚨 Prioridad: </span>
                                    <span className={`font-bold ${
                                      news.priority === 'HIGH' ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {news.priority === 'HIGH' ? 'Alta' : 'Baja'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    📅 {new Date(news.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                    Ver detalles →
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Modern Assignments Section */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-xl shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-orange-800 font-audiowide">📋 Encargos en esta zona</h3>
                      </div>
                      
                      {filteredZoneAssignments.length === 0 ? (
                        <div className="text-center py-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                          <div className="text-4xl mb-3">📋</div>
                          <p className="text-slate-600 font-medium">No hay encargos en esta zona</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                          {filteredZoneAssignments.map(assignment => (
                            <div 
                              key={assignment.id} 
                              className="group p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:scale-105"
                              onClick={() => navigateToProperty(assignment.propertyId)}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-bold text-slate-800 font-audiowide group-hover:text-orange-800 transition-colors">{assignment.property.address}</h4>
                                  <p className="text-sm text-slate-600">{assignment.property.population}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${
                                  assignment.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 
                                  assignment.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white' : 
                                  'bg-gradient-to-r from-slate-400 to-slate-600 text-white'
                                }`}>
                                  {assignment.status === 'ACTIVE' ? '✅ Activo' : 
                                   assignment.status === 'PENDING' ? '⏳ Pendiente' : 
                                   '✓ Completado'}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-2 mb-3 text-sm">
                                <div>
                                  <span className="font-medium text-slate-700">👤 Cliente: </span>
                                  <span className="text-slate-600">{assignment.client.name}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-700">🏷️ Tipo: </span>
                                  <span className="text-slate-600">{assignment.type === 'SALE' ? '💰 Venta' : '🏠 Alquiler'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-700">💶 Precio: </span>
                                  <span className="text-slate-600">{assignment.price ? `${assignment.price}€` : 'No especificado'}</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                  📅 Creado: {new Date(assignment.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                  Ver detalles →
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                
                  {/* Enhanced Properties List */}
                  <div className="mt-8">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-2 rounded-xl shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-blue-800 font-audiowide">🏠 Inmuebles en esta zona</h3>
                        </div>
                      </div>
                      
                      {filteredPropertiesInZone.length === 0 ? (
                        <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                          <div className="text-6xl mb-4">🏠</div>
                          <h4 className="text-lg font-semibold text-slate-700 mb-2">
                            {zoneSearchTerm 
                              ? "No hay inmuebles que coincidan con la búsqueda" 
                              : "No hay inmuebles en esta zona"}
                          </h4>
                          <p className="text-slate-500">
                            {zoneSearchTerm 
                              ? "Prueba con otros términos de búsqueda" 
                              : "Esta zona aún no tiene propiedades asignadas"}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                          {filteredPropertiesInZone.map(property => (
                            <div 
                              key={property.id} 
                              className={`group p-5 rounded-2xl border cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl ${
                                property.isLocated === true || property.isLocated === "true" 
                                  ? 'bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-300' 
                                  : 'bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200'
                              }`}
                              onClick={() => navigateToProperty(property.id)}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h4 className="font-bold text-lg text-slate-800 font-audiowide group-hover:text-blue-800 transition-colors line-clamp-1">
                                    {property.address}
                                  </h4>
                                  <p className="text-sm text-slate-600 mt-1">{property.population}</p>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                {property.status && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${
                                    property.status === 'SALE' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 
                                    property.status === 'RENT' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 
                                    'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                                  }`}>
                                    {property.status === 'SALE' ? '💰 Venta' : 
                                     property.status === 'RENT' ? '🏠 Alquiler' : 
                                     '❓ No especificado'}
                                  </span>
                                )}
                                {(property.isLocated === true || property.isLocated === "true") && (
                                  <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                                    ✅ Localizado
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-2 mb-4 text-sm">
                                <div>
                                  <span className="font-medium text-slate-700">🏷️ Tipo: </span>
                                  <span className="text-slate-600">{property.type}</span>
                                </div>
                                {property.ownerName && (
                                  <div>
                                    <span className="font-medium text-slate-700">👤 Propietario: </span>
                                    <span className="text-slate-600">{property.ownerName}</span>
                                  </div>
                                )}
                                {property.habitaciones && (
                                  <div>
                                    <span className="font-medium text-slate-700">🛏️ Habitaciones: </span>
                                    <span className="text-slate-600">{property.habitaciones}</span>
                                  </div>
                                )}
                                {property.metrosCuadrados && (
                                  <div>
                                    <span className="font-medium text-slate-700">📐 Metros: </span>
                                    <span className="text-slate-600">{property.metrosCuadrados}m²</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                  Ver detalles →
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {showUserAssignmentModal && selectedZone && (
        <UserAssignmentModal
          zone={selectedZone}
          onClose={() => setShowUserAssignmentModal(false)}
          onSave={handleAssignUsers}
        />
      )}
    </div>
  );
} 