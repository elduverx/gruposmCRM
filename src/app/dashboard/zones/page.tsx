/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { getProperties } from '../properties/actions';
import { getZones, createZone, Zone, updateZone, deleteZone, getPropertiesInZone, getZoneNewsAndAssignments } from './actions';
import { updateProperty } from '../properties/actions';
import { Property } from '@/types/property';
import { useRouter, usePathname } from 'next/navigation';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import SearchBar from '@/components/common/SearchBar';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

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

export default function ZonesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
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

  // Efecto para cargar datos cuando el componente se monta o cuando el usuario regresa a la página
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [propertiesData, zonesData] = await Promise.all([
          getProperties(),
          getZones()
        ]);
        setProperties(propertiesData);
        setZones(zonesData);
        
        // Cargar noticias de todas las zonas
        const allNews = await Promise.all(
          zonesData.map(zone => getZoneNewsAndAssignments(zone.id))
        );
        const flattenedNews = allNews.flatMap(result => result.news);
        setZoneNews(flattenedNews);
        
        // Si hay una zona seleccionada, actualizar sus datos
        if (selectedZoneId) {
          const selectedZone = zonesData.find(zone => zone.id === selectedZoneId);
          if (selectedZone) {
            const { news, assignments } = await getZoneNewsAndAssignments(selectedZoneId);
            setZoneNews(news);
            setZoneAssignments(assignments);
            
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
  }, [pathname]); // Se ejecuta cuando cambia la ruta

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
      } else {
        if (!data.name || !data.color || zoneCoordinates.length === 0) {
          alert('Por favor, completa todos los campos requeridos');
          return;
        }
        const newZone = await createZone({
          name: data.name,
          description: data.description || '',
          color: data.color,
          coordinates: zoneCoordinates
        });
        setZones(prev => [...prev, newZone]);

        // Actualizar las propiedades que estén dentro de la nueva zona
        const propertiesToUpdate = properties.filter(property => 
          property.latitude && 
          property.longitude && 
          isPropertyInZone(property, zoneCoordinates)
        );

        // Actualizar cada propiedad encontrada
        for (const property of propertiesToUpdate) {
          try {
            await updateProperty(property.id, {
              zoneId: newZone.id
            });
          } catch (error) {
            console.error(`Error actualizando propiedad ${property.id}:`, error);
          }
        }

        // Actualizar el estado local de las propiedades
        setProperties(prev => prev.map(property => {
          if (propertiesToUpdate.some(p => p.id === property.id)) {
            return { ...property, zoneId: newZone.id };
          }
          return property;
        }));
      }
      setShowZoneForm(false);
      setEditingZone(null);
      setZoneCoordinates([]);
    } catch (error) {
      console.error('Error saving zone:', error);
      alert('Error al guardar la zona');
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
  };

  const handleZoneClick = (zone: Zone) => {
    setSelectedZoneId(zone.id);
    setEditingZone(zone);
    
    // Cargar las noticias de la zona seleccionada
    setIsLoadingNews(true);
    getZoneNewsAndAssignments(zone.id)
      .then(({ news, assignments }) => {
        setZoneNews(news);
        setZoneAssignments(assignments);
        
        // Actualizar las propiedades localizadas
        const localizedProps = getLocalizedPropertiesInSelectedZone();
        console.log('Propiedades localizadas:', localizedProps.length, localizedProps);
        
        // Depuración: Verificar todas las propiedades en la zona
        const allPropsInZone = getPropertiesInSelectedZone();
        console.log('Todas las propiedades en la zona:', allPropsInZone.length);
        
        // Depuración: Verificar propiedades con zoneId igual a selectedZoneId
        const propsWithZoneId = properties.filter(p => p.zoneId === zone.id);
        console.log('Propiedades con zoneId igual a selectedZoneId:', propsWithZoneId.length);
        console.log('Propiedades con zoneId y localizadas:', 
          propsWithZoneId.filter(p => p.isLocated === true || p.isLocated === "true").length
        );
        
        console.log('Propiedades con isLocated=true:', allPropsInZone.filter(p => p.isLocated === true).length);
        console.log('Propiedades con isLocated="true":', allPropsInZone.filter(p => p.isLocated === "true").length);
        console.log('Propiedades con isLocated=false:', allPropsInZone.filter(p => p.isLocated === false).length);
        console.log('Propiedades con isLocated undefined:', allPropsInZone.filter(p => p.isLocated === undefined).length);
        
        // Depuración: Verificar el estado de las propiedades
        console.log('Propiedades con status=SALE:', allPropsInZone.filter(p => p.status === 'SALE').length);
        console.log('Propiedades con status=RENT:', allPropsInZone.filter(p => p.status === 'RENT').length);
        console.log('Propiedades con status undefined:', allPropsInZone.filter(p => p.status === undefined).length);
        
        // Depuración: Verificar propiedades que cumplen ambas condiciones
        console.log('Propiedades localizadas y activas:', 
          allPropsInZone.filter(p => 
            (p.isLocated === true || p.isLocated === "true") && 
            (p.status === 'SALE' || p.status === 'RENT')
          ).length
        );
        
        // Asegurarse de que las propiedades localizadas tengan todos los datos necesarios
        const localizedPropsWithDetails = localizedProps.map(prop => {
          // Buscar la propiedad completa en el array de propiedades
          const fullProperty = properties.find(p => p.id === prop.id);
          return fullProperty || prop;
        });
        
        setZoneLocalizedProperties(localizedPropsWithDetails);
      })
      .catch(error => {
        console.error('Error loading zone news and assignments:', error);
        toast.error('Error al cargar las noticias y encargos de la zona');
      })
      .finally(() => {
        setIsLoadingNews(false);
      });
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

  // Obtener las propiedades dentro de la zona seleccionada
  const getPropertiesInSelectedZone = () => {
    if (!selectedZoneId) return filteredProperties;
    
    const selectedZone = zones.find(zone => zone.id === selectedZoneId);
    if (!selectedZone) return filteredProperties;
    
    // Filtrar propiedades que están dentro de la zona seleccionada
    const propertiesInZone = filteredProperties.filter(property => isPropertyInZone(property, selectedZone.coordinates));
    
    // También incluir propiedades que tienen zoneId igual a selectedZoneId
    const propertiesWithZoneId = filteredProperties.filter(property => property.zoneId === selectedZoneId);
    
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
    
    // Filtrar propiedades que están en la zona seleccionada y están localizadas
    const propertiesInZone = getPropertiesInSelectedZone();
    
    // Filtrar propiedades que están localizadas
    const localizedProps = propertiesInZone.filter(property => {
      return property.isLocated === true || property.isLocated === "true";
    });
    
    // También buscar propiedades que tienen zoneId igual a selectedZoneId y están localizadas
    const propsWithZoneId = properties.filter(property => 
      property.zoneId === selectedZoneId && 
      (property.isLocated === true || property.isLocated === "true")
    );
    
    // Combinar ambos conjuntos de propiedades, eliminando duplicados
    const combinedProps = [...localizedProps];
    propsWithZoneId.forEach(property => {
      if (!combinedProps.some(p => p.id === property.id)) {
        combinedProps.push(property);
      }
    });
    
    return combinedProps;
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
            onClick={() => router.refresh()}
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
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Zonas</h1>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setShowZoneForm(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Añadir zona
            </button>
          </div>
        </div>
        <div className="mt-4">
          <form onSubmit={handleSearchSubmit} className="relative rounded-md shadow-sm max-w-md" ref={searchRef}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="block w-full rounded-md border-gray-300 pl-4 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Buscar zonas, propiedades o direcciones..."
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isSearchingAddress ? (
                <div className="animate-spin h-5 w-5 text-gray-400">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <button type="submit" className="text-gray-400 hover:text-gray-500">
                  <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                {searchSuggestions.map((suggestion) => (
                  <div
                    key={`${suggestion.type}-${suggestion.id}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{suggestion.name}</div>
                      {suggestion.description && (
                        <div className="text-sm text-gray-500">{suggestion.description}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {suggestion.type === 'zone' ? 'Zona' : 
                       suggestion.type === 'property' ? 'Propiedad' : 'Dirección'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        <div className="h-[60vh] w-full rounded-2xl overflow-hidden shadow-xl mx-4 mt-2 relative z-0">
          <ZonesMap
            ref={mapRef}
            center={mapCenter}
            zoom={mapZoom}
            properties={filteredProperties}
            zones={filteredZones}
            newZoneColor={newZoneColor}
            zoneCoordinates={zoneCoordinates}
            onZoneCreated={handleZoneCreated}
            onPropertyClick={onPropertyClick}
            onZoneClick={handleZoneClick}
            selectedPropertyId={selectedPropertyId}
            onEditZone={handleEditZone}
            onDeleteZone={handleDeleteZone}
            setSelectedPropertyId={setSelectedPropertyId}
            handleZoneClick={handleZoneClick}
            onMarkerRefsUpdate={setMarkerRefs}
            selectedLocation={selectedLocation}
          />
        </div>

        <div className="flex-1 mx-4 mt-4 mb-4 bg-white rounded-2xl shadow-xl p-6 overflow-hidden relative z-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Zonas</h1>
            <div className="text-sm text-gray-500">
              Dibuja un polígono en el mapa para crear una nueva zona
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(40vh-8rem)] overflow-y-auto pr-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2">
                  {filteredZones.length}
                </span>
                Lista de Zonas
              </h2>
              {filteredZones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No se encontraron zonas que coincidan con la búsqueda.' : 'No hay zonas creadas. Dibuja un polígono en el mapa para crear una.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredZones.map((zone) => (
                    <div 
                      key={zone.id} 
                      className={`flex items-center justify-between p-5 rounded-xl transition-colors duration-200 border shadow-sm cursor-pointer ${
                        selectedZoneId === zone.id 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleZoneClick(zone)}
                    >
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-6 h-6 rounded-full shadow-sm" 
                          style={{ backgroundColor: zone.color }}
                        />
                        <div>
                          <h3 className="font-medium text-lg">{zone.name}</h3>
                          {zone.description && (
                            <p className="text-sm text-gray-600 mt-1">{zone.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {zoneNews.filter(news => news.property.zoneId === zone.id).length} noticias
                        </span>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditZone(zone);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteZone(zone);
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors duration-200 font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2">
                  {selectedZoneId ? getPropertiesInSelectedZone().length : filteredProperties.length}
                </span>
                {selectedZoneId 
                  ? `Propiedades en ${zones.find(z => z.id === selectedZoneId)?.name || 'Zona Seleccionada'}`
                  : 'Todas las Propiedades'}
                {selectedZoneId && (
                  <button
                    onClick={() => setSelectedZoneId(null)}
                    className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                  >
                    Ver todas
                  </button>
                )}
              </h2>
              {selectedZoneId && getPropertiesInSelectedZone().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay propiedades dentro de esta zona.
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No se encontraron propiedades que coincidan con la búsqueda.' : 'No hay propiedades asignadas a zonas.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedZoneId ? getPropertiesInSelectedZone() : filteredProperties).map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 border border-gray-200 shadow-sm">
                      <div>
                        <h3 className="font-medium text-lg">{property.address}</h3>
                        <p className="text-sm text-gray-600 mt-1">{property.population}</p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => onPropertyClick(property)}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                        >
                          Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showZoneForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {editingZone ? 'Editar Zona' : 'Nueva Zona'}
            </h2>
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
      )}

      {selectedZoneId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {zones.find(z => z.id === selectedZoneId)?.name}
              </h2>
              <button
                onClick={() => setSelectedZoneId(null)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Barra de búsqueda para filtrar contenido dentro de la zona */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={zoneSearchTerm}
                  onChange={(e) => setZoneSearchTerm(e.target.value)}
                  placeholder="Buscar propiedades, noticias o encargos en esta zona..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                {zoneSearchTerm && (
                  <button
                    onClick={() => setZoneSearchTerm('')}
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {isLoadingNews ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-800">Propiedades</h3>
                    <p className="text-3xl font-bold text-blue-600">{getPropertiesInSelectedZone().length}</p>
                    <p className="text-sm text-blue-600">Total en esta zona</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-purple-800">Propiedades con noticias</h3>
                    <p className="text-3xl font-bold text-purple-600">{filteredZoneNews.length}</p>
                    <p className="text-sm text-purple-600">Inmuebles con noticias activas</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-orange-800">Encargos</h3>
                    <p className="text-3xl font-bold text-orange-600">{filteredZoneAssignments.length}</p>
                    <p className="text-sm text-orange-600">Total encargos en esta zona</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna izquierda: Propiedades con noticias */}
                  <div className="bg-white border rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-medium mb-4 text-purple-800">Propiedades con noticias</h3>
                    {filteredZoneNews.length === 0 ? (
                      <p className="text-gray-500">No hay propiedades con noticias en esta zona</p>
                    ) : (
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredZoneNews.map(news => {
                          const property = news.property;
                          return (
                            <div 
                              key={news.id} 
                              className="p-4 bg-gray-50 border rounded-lg shadow-sm hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={() => navigateToProperty(property.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{property.address}</h4>
                                  <p className="text-sm text-gray-600">{property.population}</p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                                  {news.type} - {news.action}
                                </span>
                              </div>
                              <div className="mt-2">
                                <div className="text-sm">
                                  <span className="font-medium">Prioridad: </span>
                                  <span className={`${
                                    news.priority === 'HIGH' ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {news.priority === 'HIGH' ? 'Alta' : 'Baja'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(news.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="mt-3 text-right">
                                <span className="text-sm text-blue-600 hover:text-blue-800">
                                  Ver detalles →
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Columna central: Encargos */}
                  <div className="bg-white border rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-medium mb-4 text-orange-800">Encargos en esta zona</h3>
                    {filteredZoneAssignments.length === 0 ? (
                      <p className="text-gray-500">No hay encargos en esta zona</p>
                    ) : (
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredZoneAssignments.map(assignment => (
                          <div 
                            key={assignment.id} 
                            className="p-4 bg-gray-50 border rounded-lg shadow-sm hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => navigateToProperty(assignment.propertyId)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{assignment.property.address}</h4>
                                <p className="text-sm text-gray-600">{assignment.property.population}</p>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                assignment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                                assignment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {assignment.status === 'ACTIVE' ? 'Activo' : 
                                 assignment.status === 'PENDING' ? 'Pendiente' : 
                                 'Completado'}
                              </span>
                            </div>
                            <div className="mt-2">
                              <div className="text-sm">
                                <span className="font-medium">Cliente: </span>
                                <span>{assignment.client.name}</span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Tipo: </span>
                                <span>{assignment.type === 'SALE' ? 'Venta' : 'Alquiler'}</span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Precio: </span>
                                <span>{assignment.price ? `${assignment.price}€` : 'No especificado'}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Creado: {new Date(assignment.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="mt-3 text-right">
                              <span className="text-sm text-blue-600 hover:text-blue-800">
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
      )}
    </div>
  );
} 