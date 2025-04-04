'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getAddressFromCoordinates, getCoordinatesFromAddress } from '@/utils/geocoding';
import { createProperty, updateProperty, getPropertyById } from '../actions';
import { PropertyStatus, PropertyAction, PropertyType } from '@prisma/client';
import { getZones, Zone } from '../../zones/actions';
import { getClients } from '../../clients/actions';
import { Client } from '@/types/client';
import { toast } from 'sonner';
import { PropertyCreateInput } from '@/types/property';

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
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<PropertyCreateInput>({
    address: '',
    population: '',
    status: 'SIN_EMPEZAR' as PropertyStatus,
    action: 'IR_A_DIRECCION' as PropertyAction,
    type: 'CASA' as PropertyType,
    ownerName: '',
    ownerPhone: '',
    captureDate: new Date(),
    hasSimpleNote: false,
    isOccupied: false,
    isLocated: false,
    occupiedBy: '',
    responsible: '',
    zoneId: null,
    clientId: null,
    latitude: null,
    longitude: null,
    responsibleId: undefined
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
        console.error('Error fetching zones:', error);
      }
    };

    // Cargar los clientes al iniciar el componente
    const fetchClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchZones();
    fetchClients();
  }, []);

  useEffect(() => {
    if (propertyId) {
      setIsEditing(true);
      const fetchProperty = async () => {
        try {
          const propertyData = await getPropertyById(propertyId);
          if (propertyData) {
            setFormData({
              address: propertyData.address,
              population: propertyData.population,
              status: propertyData.status as PropertyStatus,
              action: propertyData.action as PropertyAction,
              type: propertyData.type as PropertyType,
              ownerName: propertyData.ownerName,
              ownerPhone: propertyData.ownerPhone,
              captureDate: new Date(propertyData.captureDate),
              responsibleId: propertyData.responsibleId,
              hasSimpleNote: propertyData.hasSimpleNote,
              isOccupied: propertyData.isOccupied,
              clientId: propertyData.clientId || null,
              zoneId: propertyData.zoneId || null,
              latitude: propertyData.latitude || null,
              longitude: propertyData.longitude || null,
              occupiedBy: propertyData.occupiedBy || '',
              isLocated: propertyData.isLocated,
              responsible: propertyData.responsible || ''
            });
            
            if (propertyData.latitude && propertyData.longitude) {
              setSelectedLocation({
                lat: propertyData.latitude,
                lng: propertyData.longitude
              });
            }
          }
        } catch (error) {
          console.error('Error fetching property:', error);
          alert('Error al cargar el inmueble');
        }
      };
      
      fetchProperty();
    }
  }, [propertyId]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    const location = { lat, lng };
    setSelectedLocation(location);
    
    // Obtener dirección desde las coordenadas
    const addressData = await getAddressFromCoordinates(lat, lng);
    if (addressData) {
      // Encontrar la zona a la que pertenece la ubicación
      const zoneId = findZoneForLocation(location);
      
      setFormData(prev => ({
        ...prev,
        address: addressData.address,
        population: addressData.population,
        isLocated: true,
        zoneId: zoneId || prev.zoneId // Mantener la zona anterior si no se encuentra una nueva
      }));
    }
  };

  const handleAddressSearch = async () => {
    if (formData.address) {
      setIsSearching(true);
      try {
        const coordinates = await getCoordinatesFromAddress(formData.address);
        if (coordinates) {
          const location = { lat: coordinates.lat, lng: coordinates.lng };
          setSelectedLocation(location);
          
          // Encontrar la zona a la que pertenece la ubicación
          const zoneId = findZoneForLocation(location);
          
          // Actualizar población si está disponible
          const addressData = await getAddressFromCoordinates(coordinates.lat, coordinates.lng);
          if (addressData?.population) {
            setFormData(prev => ({
              ...prev,
              population: addressData.population,
              isLocated: true,
              zoneId: zoneId || prev.zoneId // Mantener la zona anterior si no se encuentra una nueva
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              isLocated: true,
              zoneId: zoneId || prev.zoneId // Mantener la zona anterior si no se encuentra una nueva
            }));
          }
        } else {
          alert('No se encontró la dirección. Por favor, intenta con una dirección más específica.');
        }
      } catch (error) {
        console.error('Error searching address:', error);
        alert('Error al buscar la dirección');
      } finally {
        setIsSearching(false);
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
    } else if (name === 'status') {
      setFormData(prev => ({
        ...prev,
        [name]: value as PropertyStatus
      }));
    } else if (name === 'action') {
      setFormData(prev => ({
        ...prev,
        [name]: value as PropertyAction
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
        captureDate: formData.captureDate || new Date(),
        responsibleId: formData.responsibleId || undefined,
        clientId: formData.clientId || undefined,
        zoneId: formData.zoneId || undefined,
        latitude: selectedLocation?.lat || null,
        longitude: selectedLocation?.lng || null,
        occupiedBy: formData.isOccupied ? formData.occupiedBy : '',
        isLocated: formData.isLocated || false,
        responsible: formData.responsible || '',
      };

      if (propertyId) {
        await updateProperty(propertyId, {
          ...submitData,
          captureDate: submitData.captureDate.toISOString(),
          latitude: submitData.latitude || undefined,
          longitude: submitData.longitude || undefined,
        });
        toast.success('Propiedad actualizada correctamente');
      } else {
        await createProperty(submitData);
        toast.success('Propiedad creada correctamente');
      }

      router.push('/dashboard/properties');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al guardar la propiedad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-xl font-bold text-white">
              {propertyId ? 'Editar inmueble' : 'Nuevo inmueble'}
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              Completa la información del inmueble
            </p>
          </div>

          <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
            {/* Información básica */}
            <div className="px-6 py-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información básica
              </h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="population" className="block text-sm font-medium text-gray-700">
                    Población
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="population"
                      id="population"
                      value={formData.population}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Estado y tipo */}
            <div className="px-6 py-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Estado y tipo
              </h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <div className="mt-1">
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    >
                      <option value="SIN_EMPEZAR">Sin empezar</option>
                      <option value="EMPEZADA">Empezada</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="action" className="block text-sm font-medium text-gray-700">
                    Acción
                  </label>
                  <div className="mt-1">
                    <select
                      id="action"
                      name="action"
                      value={formData.action}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    >
                      <option value="IR_A_DIRECCION">Ir a dirección</option>
                      <option value="REPETIR">Repetir</option>
                      <option value="LOCALIZAR_VERIFICADO">Localizar verificado</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <div className="mt-1">
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    >
                      <option value="PISO">Piso</option>
                      <option value="CASA">Casa</option>
                      <option value="LOCAL_COMERCIAL">Local</option>
                      <option value="TERRENO">Terreno</option>
                      <option value="CHALET">Chalet</option>
                      <option value="APARTAMENTO">Apartamento</option>
                      <option value="ATICO">Ático</option>
                      <option value="DUPLEX">Dúplex</option>
                      <option value="OFICINA">Oficina</option>
                      <option value="GARAJE">Garaje</option>
                      <option value="TRASTERO">Trastero</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Ocupación */}
            <div className="px-6 py-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Estado de ocupación
              </h3>
              <div className="space-y-4">
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="isOccupied"
                      name="isOccupied"
                      type="checkbox"
                      checked={formData.isOccupied}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="isOccupied" className="font-medium text-gray-700">
                      Ocupado
                    </label>
                    <p className="text-gray-500">Marca esta opción si el inmueble está ocupado</p>
                  </div>
                </div>

                {formData.isOccupied && (
                  <div className="sm:col-span-4 mt-4 ml-7">
                    <label htmlFor="occupiedBy" className="block text-sm font-medium text-gray-700">
                      Ocupado por
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="occupiedBy"
                        id="occupiedBy"
                        value={formData.occupiedBy || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : propertyId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 