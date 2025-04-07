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

interface PageProps {
  params: Promise<{ id?: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PropertyFormPage({ params }: PageProps) {
  const resolvedParams = await params;
  const propertyId = resolvedParams.id;
  return <PropertyFormClient propertyId={propertyId} />;
}

// Componente cliente que maneja el estado y la lógica
function PropertyFormClient({ propertyId }: { propertyId?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    address: '',
    population: '',
    status: 'IN_PROCESS' as PropertyStatus,
    action: 'NEWS' as PropertyAction,
    type: 'HOUSE' as PropertyType,
    ownerName: '',
    ownerPhone: '',
    isOccupied: false,
    occupiedBy: '',
    clientId: '',
    tenantName: '',
    isLocated: false,
    zoneId: '',
  });
  // Coordenadas por defecto de Catarroja
  const defaultLocation = { lat: 39.4025, lng: -0.4022 };

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
              status: propertyData.status,
              action: propertyData.action,
              type: propertyData.type,
              ownerName: propertyData.ownerName,
              ownerPhone: propertyData.ownerPhone,
              isOccupied: propertyData.isOccupied,
              occupiedBy: propertyData.occupiedBy || '',
              clientId: propertyData.clientId || '',
              tenantName: '',
              isLocated: propertyData.isLocated,
              zoneId: propertyData.zoneId || '',
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
    } else {
      // Si no es edición, establecer la ubicación por defecto en Catarroja
      setSelectedLocation(defaultLocation);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleOccupiedByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      occupiedBy: value,
      // Si se selecciona "PROPIETARIO", buscar el cliente correspondiente
      clientId: value === 'PROPIETARIO' ? prev.clientId : '',
      // Si se selecciona "INQUILINO", limpiar el clientId
      tenantName: value === 'INQUILINO' ? prev.tenantName : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        latitude: selectedLocation?.lat || undefined,
        longitude: selectedLocation?.lng || undefined,
        occupiedBy: formData.isOccupied 
          ? (formData.occupiedBy === 'INQUILINO' 
              ? formData.tenantName 
              : formData.occupiedBy === 'PROPIETARIO' && formData.clientId
                ? clients.find(c => c.id === formData.clientId)?.name || undefined
                : undefined)
          : undefined,
        // Solo incluir clientId si está ocupado por propietario
        clientId: formData.isOccupied && formData.occupiedBy === 'PROPIETARIO' && formData.clientId ? formData.clientId : undefined,
        zoneId: formData.zoneId || undefined,
      };

      if (isEditing && propertyId) {
        await updateProperty(propertyId, data);
      } else {
        await createProperty(data);
      }
      
      router.push('/dashboard/properties');
      router.refresh();
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Error al guardar el inmueble');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {isEditing ? 'Editar inmueble' : 'Nuevo inmueble'}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Ingresa la información básica del inmueble. Puedes completar más detalles más adelante.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Dirección
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="address"
                        id="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-md sm:text-sm border-gray-300"
                        placeholder="Calle, número, piso, puerta"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleAddressSearch}
                        disabled={isSearching}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {isSearching ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="population" className="block text-sm font-medium text-gray-700">
                      Población
                    </label>
                    <input
                      type="text"
                      name="population"
                      id="population"
                      value={formData.population}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700">
                      Zona
                    </label>
                    <div className="mt-1 relative">
                      <select
                        id="zoneId"
                        name="zoneId"
                        value={formData.zoneId}
                        onChange={handleInputChange}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Seleccionar zona</option>
                        {zones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                      {formData.zoneId && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {formData.zoneId && (
                      <p className="mt-1 text-sm text-green-600 flex items-center">
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Zona asignada automáticamente según la ubicación
                      </p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                      Propietario
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="ownerPhone"
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="isOccupied" className="block text-sm font-medium text-gray-700">
                      Estado de ocupación
                    </label>
                    <div className="mt-1">
                      <select
                        id="isOccupied"
                        name="isOccupied"
                        value={formData.isOccupied.toString()}
                        onChange={(e) => setFormData(prev => ({ ...prev, isOccupied: e.target.value === 'true' }))}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="false">Desocupado</option>
                        <option value="true">Ocupado</option>
                      </select>
                    </div>
                  </div>

                  {formData.isOccupied && (
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="occupiedBy" className="block text-sm font-medium text-gray-700">
                        Ocupado por
                      </label>
                      <select
                        id="occupiedBy"
                        name="occupiedBy"
                        value={formData.occupiedBy}
                        onChange={handleOccupiedByChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Seleccionar</option>
                        <option value="PROPIETARIO">Propietario</option>
                        <option value="INQUILINO">Inquilino</option>
                      </select>
                    </div>
                  )}

                  {formData.isOccupied && formData.occupiedBy === 'PROPIETARIO' && (
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                        Cliente propietario
                      </label>
                      <select
                        id="clientId"
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Seleccionar cliente</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.isOccupied && formData.occupiedBy === 'INQUILINO' && (
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">
                        Nombre del inquilino
                      </label>
                      <input
                        type="text"
                        name="tenantName"
                        id="tenantName"
                        value={formData.tenantName}
                        onChange={handleInputChange}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  )}

                  <div className="col-span-6">
                    <div className="flex items-center">
                      <input
                        id="isLocated"
                        name="isLocated"
                        type="checkbox"
                        checked={formData.isLocated}
                        onChange={(e) => setFormData(prev => ({ ...prev, isLocated: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isLocated" className="ml-2 block text-sm text-gray-900">
                        Inmueble localizado en el mapa
                      </label>
                    </div>
                  </div>
                </div>

                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación en el mapa
                  </label>
                  <div className="h-96 w-full rounded-md border border-gray-300 overflow-hidden shadow-sm">
                    <MapContainer
                      center={[defaultLocation.lat, defaultLocation.lng]}
                      zoom={14}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker onLocationSelect={handleLocationSelect} />
                      {selectedLocation && (
                        <>
                          <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={icon} />
                          <MapController coordinates={selectedLocation} />
                        </>
                      )}
                    </MapContainer>
                  </div>
                  <div className="mt-2 flex items-center">
                    <svg className="h-5 w-5 text-blue-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      Haz clic en el mapa para seleccionar la ubicación del inmueble. La zona se asignará automáticamente si está dentro de una zona existente.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 