// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getAddressFromCoordinates } from '@/utils/geocoding';
import { createProperty, updateProperty, getProperty } from '../actions';
import { PropertyType } from '@/types/property';
import { getZones, Zone } from '../../zones/actions';
import { toast } from 'sonner';
import { PropertyCreateInput } from '@/types/property';

// Coordenadas de Catarroja, Valencia
const CATARROJA_COORDS = {
  lat: 39.4015,
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

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ coordinates }: { coordinates: { lat: number; lng: number } | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates) {
      map.setView([coordinates.lat, coordinates.lng], 15);
    }
  }, [coordinates, map]);
  
  return null;
}

interface PropertyFormPageProps {
  propertyId?: string;
}

export function PropertyFormPage({ propertyId }: PropertyFormPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(CATARROJA_COORDS);
  const [isEditing, setIsEditing] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [formData, setFormData] = useState<PropertyCreateInput>({
    address: '',
    population: 'Catarroja',
    type: 'CASA' as PropertyType,
    ownerName: '',
    ownerPhone: '',
    latitude: CATARROJA_COORDS.lat,
    longitude: CATARROJA_COORDS.lng,
    zoneId: null,
  });

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
        if (error instanceof Error) {
          // Handle error appropriately
        }
      }
    };

    fetchZones();
  }, []);

  useEffect(() => {
    if (propertyId) {
      setIsEditing(true);
      const fetchProperty = async () => {
        try {
          const propertyData = await getProperty(propertyId);
          if (propertyData) {
            setFormData({
              address: propertyData.address,
              population: propertyData.population,
              type: propertyData.type as PropertyType,
              ownerName: propertyData.ownerName,
              ownerPhone: propertyData.ownerPhone,
              latitude: propertyData.latitude || null,
              longitude: propertyData.longitude || null,
              zoneId: propertyData.zoneId || null,
            });
            
            if (propertyData.latitude && propertyData.longitude) {
              setSelectedLocation({
                lat: propertyData.latitude,
                lng: propertyData.longitude
              });
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error fetching property:', error);
          alert('Error al cargar el inmueble');
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
      
      setFormData(prev => ({
        ...prev,
        address: addressData?.address || prev.address,
        population: addressData?.population || prev.population,
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
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        [name]: value as PropertyType
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        latitude: selectedLocation?.lat || null,
        longitude: selectedLocation?.lng || null,
        zoneId: formData.zoneId || undefined,
      };

      if (propertyId) {
        await updateProperty(propertyId, submitData);
        toast.success('Propiedad actualizada correctamente');
      } else {
        await createProperty(submitData);
        toast.success('Propiedad creada correctamente');
      }

      router.push('/dashboard/properties');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error submitting form:', error);
      toast.error('Error al guardar la propiedad');
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="h-[600px]">
              <MapContainer
                center={[CATARROJA_COORDS.lat, CATARROJA_COORDS.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker onLocationSelect={handleLocationSelect} />
                {selectedLocation && (
                  <Marker
                    position={[selectedLocation.lat, selectedLocation.lng]}
                    icon={icon}
                  />
                )}
                <MapController coordinates={selectedLocation} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 