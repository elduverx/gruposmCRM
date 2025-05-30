'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getAddressFromCoordinates } from '@/utils/geocoding';
import { createProperty, updateProperty, getProperty, getProperties } from '../actions';
import { PropertyType, PropertyCreateInput, Property } from '@/types/property';
import { getZones, Zone } from '../../zones/actions';
import { getUsersForSelect } from '../../users/actions';
import { toast } from 'sonner';
import { findZoneForCoordinates } from '@/utils/zoneUtils';
import debounce from 'lodash/debounce';

// Coordenadas de Camí Real 87, Catarroja
const CATARROJA_COORDS = {
  lat: 39.4035,
  lng: -0.4027
};

// Fix for default marker icons in Next.js
const icon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Dynamically import React Leaflet components
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

// LocationMarker component to avoid conditional hook calls
const LocationMarkerComponent = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  const [reactLeafletLoaded, setReactLeafletLoaded] = useState(false);
  
  // Define un tipo más específico para el hook useMapEvents
  type UseMapEventsType = (handlers: {
    click: (e: { latlng: { lat: number, lng: number } }) => void;
  }) => void;
  
  const callbackRef = useRef<UseMapEventsType | null>(null);
  
  useEffect(() => {
    // Only load once
    if (reactLeafletLoaded) return;
    
    // Only import in useEffect on client
    import('react-leaflet').then((module) => {
      // Store the module in the ref instead of state
      callbackRef.current = module.useMapEvents;
      setReactLeafletLoaded(true);
    });
  }, [reactLeafletLoaded]);
  
  // Don't render anything until loaded
  if (!reactLeafletLoaded || !callbackRef.current) {
    return null;
  }
  
  // This never changes once loaded
  const useMapEvents = callbackRef.current;
  
  const LocationMarker = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    useMapEvents({
      click(e: { latlng: { lat: number, lng: number } }) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };
  
  return <LocationMarker />;
};

// MapController component to avoid conditional hook calls
const MapControllerComponent = ({ coordinates }: { coordinates: { lat: number; lng: number } | null }) => {
  const [reactLeafletLoaded, setReactLeafletLoaded] = useState(false);
  
  // Define un tipo más específico para el hook useMap
  type UseMapType = () => {
    setView: (center: [number, number], zoom: number) => void;
  };
  
  const callbackRef = useRef<UseMapType | null>(null);
  
  useEffect(() => {
    // Only load once
    if (reactLeafletLoaded) return;
    
    // Only import in useEffect on client
    import('react-leaflet').then((module) => {
      // Store the module in the ref instead of state
      callbackRef.current = module.useMap;
      setReactLeafletLoaded(true);
    });
  }, [reactLeafletLoaded]);
  
  // Don't render anything until loaded
  if (!reactLeafletLoaded || !callbackRef.current) {
    return null;
  }
  
  // This never changes once loaded
  const useMap = callbackRef.current;
  
  const MapController = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const map = useMap();
    
    // Extract coordinates to local variables to address the exhaustive deps warning
    const lat = coordinates?.lat;
    const lng = coordinates?.lng;
    
    useEffect(() => {
      if (coordinates && lat !== undefined && lng !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        map.setView([lat, lng], 14);
      } else {
        // Si no hay coordenadas seleccionadas, centrar en Catarroja
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        map.setView([CATARROJA_COORDS.lat, CATARROJA_COORDS.lng], 14);
      }
    }, [map, lat, lng]);
    
    return null;
  };
  
  return <MapController />;
};

interface PropertyFormPageProps {
  propertyId?: string;
}

export function PropertyFormPage({ propertyId }: PropertyFormPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [users, setUsers] = useState<{id: string; name: string}[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState<PropertyCreateInput>({
    address: '',
    population: 'Catarroja',
    type: 'CASA' as PropertyType,
    ownerName: '',
    ownerPhone: '',
    latitude: CATARROJA_COORDS.lat,
    longitude: CATARROJA_COORDS.lng,
    zoneId: null,
    responsibleId: null
  });
  const [zoneSearchTerm, setZoneSearchTerm] = useState('');
  const [zoneSearchResults, setZoneSearchResults] = useState<Property[]>([]);
  const [showZoneResults, setShowZoneResults] = useState(false);
  const zoneSearchRef = useRef<HTMLDivElement>(null);

  // Efecto para cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (zoneSearchRef.current && !zoneSearchRef.current.contains(event.target as Node)) {
        setShowZoneResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para determinar si un punto está dentro de un polígono
  const isPointInPolygon = (point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean => {
    const { lat, lng } = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const { lat: lati, lng: lngi } = polygon[i];
      const { lat: latj, lng: lngj } = polygon[j];
      
      const intersect = ((lati > lat) !== (latj > lat)) &&
        (lng < (lngj - lngi) * (lat - lati) / (latj - lati) + lngi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  // Función para encontrar la zona a la que pertenece un punto
  const findZoneForLocation = (location: { lat: number; lng: number }): string | null => {
    for (const zone of zones) {
      if (isPointInPolygon(location, zone.coordinates)) {
        return zone.id;
      }
    }
    return null;
  };

  useEffect(() => {
    // Cargar las zonas al iniciar el componente
    const fetchZones = async () => {
      try {
        const zonesData = await getZones();
        setZones(zonesData);
      } catch (error) {
        toast.error('Error al cargar las zonas');
      }
    };
    
    // Cargar los usuarios para el selector de responsables
    const fetchUsers = async () => {
      try {
        const usersData = await getUsersForSelect();
        setUsers(usersData);
      } catch (error) {
        toast.error('Error al cargar los usuarios');
      }
    };
    
    setIsClient(true);
    fetchZones();
    fetchUsers();
    
    // Si hay un ID de propiedad, estamos editando
    if (propertyId) {
      setIsEditing(true);
    }
  }, [propertyId]);

  // Cargar datos de la propiedad si estamos editando
  useEffect(() => {
    if (propertyId) {
      const fetchProperty = async () => {
        try {
          const propertyData = await getProperty(propertyId);
          if (propertyData) {
            setFormData({
              address: propertyData.address,
              population: propertyData.population,
              type: propertyData.type,
              ownerName: propertyData.ownerName || '',
              ownerPhone: propertyData.ownerPhone || '',
              latitude: propertyData.latitude || null,
              longitude: propertyData.longitude || null,
              zoneId: propertyData.zoneId || null,
              responsibleId: propertyData.responsibleId || null
            });

            if (propertyData.latitude && propertyData.longitude) {
              setSelectedLocation({
                lat: propertyData.latitude,
                lng: propertyData.longitude
              });
            }
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            toast.error(`Error al cargar la propiedad: ${error.message}`);
          } else {
            toast.error('Error desconocido al cargar la propiedad');
          }
        }
      };
      
      fetchProperty();
    }
  }, [propertyId]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    
    // Buscar la dirección correspondiente a las coordenadas
    try {
      const addressData = await getAddressFromCoordinates(lat, lng);
      const zoneId = findZoneForLocation({ lat, lng });
      
      setFormData((prev: PropertyCreateInput) => ({
        ...prev,
        address: addressData?.address ? String(addressData.address) : prev.address,
        population: addressData?.population ? String(addressData.population) : prev.population,
        zoneId: zoneId || prev.zoneId // Mantener la zona anterior si no se encuentra una nueva
      }));
    } catch (error) {
      if (error instanceof Error) {
        // Handle error appropriately
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData((prev: PropertyCreateInput) => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (name === 'type') {
      setFormData((prev: PropertyCreateInput) => ({
        ...prev,
        [name]: value as PropertyType
      }));
    } else {
      setFormData((prev: PropertyCreateInput) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const propertyData = {
        ...formData,
        captureDate: formData.captureDate ? new Date(formData.captureDate) : null,
        latitude: selectedLocation?.lat ?? null,
        longitude: selectedLocation?.lng ?? null,
        zoneId: formData.zoneId || null
      };

      if (propertyId) {
        await updateProperty(propertyId, {
          ...propertyData,
          captureDate: propertyData.captureDate?.toISOString()
        });
        toast.success('Propiedad actualizada correctamente');
      } else {
        await createProperty(propertyData);
        toast.success('Propiedad creada correctamente');
      }

      router.push('/dashboard/properties');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error submitting property:', error);
      toast.error('Error al guardar la propiedad');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para buscar propiedades por zona con debounce
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setZoneSearchResults([]);
        setShowZoneResults(false);
        return;
      }

      try {
        const { properties } = await getProperties(1, 10, searchTerm);
        setZoneSearchResults(properties);
        setShowZoneResults(true);
      } catch (error) {
        console.error('Error searching properties:', error);
        toast.error('Error al buscar propiedades');
      }
    }, 300),
    []
  );

  // Manejar cambios en la búsqueda de zona
  const handleZoneSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setZoneSearchTerm(value);
    debouncedSearch(value);
  };

  // Limpiar el debounce al desmontar
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Seleccionar una propiedad de los resultados
  const handlePropertySelect = (property: Property) => {
    setFormData(prev => ({
      ...prev,
      address: property.address,
      population: property.population,
      latitude: property.latitude,
      longitude: property.longitude,
      zoneId: property.zoneId
    }));
    setShowZoneResults(false);
    setZoneSearchTerm('');
  };

  // renderizar la sección del mapa solo en el cliente
  const renderMap = () => {
    if (!isClient) {
      return <div className="bg-gray-100 animate-pulse h-[600px] w-full"></div>;
    }
    
    return (
      <div className="h-[600px] w-full">
        <MapContainer
          center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [CATARROJA_COORDS.lat, CATARROJA_COORDS.lng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarkerComponent onLocationSelect={handleLocationSelect} />
          {selectedLocation && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={icon}
            />
          )}
          <MapControllerComponent coordinates={selectedLocation} />
        </MapContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Editar Inmueble' : 'Nuevo Inmueble'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isEditing ? 'Modifica los datos del inmueble' : 'Ingresa los datos del nuevo inmueble'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="bg-white rounded-lg shadow">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Dirección y Población */}
              <div className="space-y-4">
                {/* Búsqueda por zona */}
                <div ref={zoneSearchRef}>
                  <label htmlFor="zoneSearch" className="block text-sm font-medium text-gray-700">
                    Buscar por zona
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      id="zoneSearch"
                      placeholder="Buscar propiedades por zona..."
                      value={zoneSearchTerm}
                      onChange={handleZoneSearchChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {showZoneResults && zoneSearchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                        {zoneSearchResults.map((property) => (
                          <div
                            key={property.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handlePropertySelect(property)}
                          >
                            <div className="font-medium">{property.address}</div>
                            <div className="text-sm text-gray-500">{property.population}</div>
                            {property.zone && (
                              <div className="text-sm text-blue-600">Zona: {property.zone.name}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="population" className="block text-sm font-medium text-gray-700">
                    Población
                  </label>
                  <input
                    type="text"
                    id="population"
                    name="population"
                    value={formData.population}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              {/* Datos del propietario */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                    Nombre del propietario
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
                    Teléfono del propietario
                  </label>
                  <input
                    type="tel"
                    id="ownerPhone"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Tipo de propiedad */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Tipo de propiedad
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  {Object.entries(PropertyType).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsable */}
              <div>
                <label htmlFor="responsibleId" className="block text-sm font-medium text-gray-700">
                  Responsable
                </label>
                <select
                  id="responsibleId"
                  name="responsibleId"
                  value={formData.responsibleId || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Sin responsable asignado</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/properties')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>

          {/* Mapa */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Ubicación del Inmueble</h2>
            <p className="text-sm text-gray-600 mb-4">Haz clic en el mapa para seleccionar la ubicación del inmueble.</p>
            
            {renderMap()}
          </div>
        </div>
      </div>
    </div>
  );
} 