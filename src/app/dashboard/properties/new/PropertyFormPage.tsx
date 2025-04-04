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

        <div className="grid grid-cols-5 gap-6">
          {/* Formulario - 3 columnas */}
          <div className="col-span-3 bg-white rounded-lg shadow">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Dirección y búsqueda */}
                <div className="col-span-2">
                  <div className="flex gap-4">
                    <div className="flex-1">
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
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddressSearch}
                        disabled={isSearching}
                        className="mb-[1px] inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isSearching ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Población */}
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

                {/* Zona */}
                <div>
                  <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700">
                    Zona
                  </label>
                  <select
                    id="zoneId"
                    name="zoneId"
                    value={formData.zoneId || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Selecciona una zona</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    {Object.entries(PropertyStatus).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Acción */}
                <div>
                  <label htmlFor="action" className="block text-sm font-medium text-gray-700">
                    Acción
                  </label>
                  <select
                    id="action"
                    name="action"
                    value={formData.action}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    {Object.entries(PropertyAction).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Tipo
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

                {/* Propietario */}
                <div>
                  <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                    Propietario
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

                {/* Teléfono */}
                <div>
                  <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    id="ownerPhone"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {/* Cliente */}
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                    Cliente
                  </label>
                  <select
                    id="clientId"
                    name="clientId"
                    value={formData.clientId || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Responsable */}
                <div>
                  <label htmlFor="responsible" className="block text-sm font-medium text-gray-700">
                    Responsable
                  </label>
                  <input
                    type="text"
                    id="responsible"
                    name="responsible"
                    value={formData.responsible}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {/* Checkboxes */}
                <div className="col-span-2 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasSimpleNote"
                      name="hasSimpleNote"
                      checked={formData.hasSimpleNote}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasSimpleNote" className="ml-2 block text-sm text-gray-700">
                      Tiene nota simple
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isOccupied"
                      name="isOccupied"
                      checked={formData.isOccupied}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isOccupied" className="ml-2 block text-sm text-gray-700">
                      Está ocupado
                    </label>
                  </div>

                  {formData.isOccupied && (
                    <div>
                      <label htmlFor="occupiedBy" className="block text-sm font-medium text-gray-700">
                        Ocupado por
                      </label>
                      <input
                        type="text"
                        id="occupiedBy"
                        name="occupiedBy"
                        value={formData.occupiedBy}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear inmueble'}
                </button>
              </div>
            </form>
          </div>

          {/* Mapa - 2 columnas */}
          <div className="col-span-2 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Ubicación</h2>
              <p className="mt-1 text-sm text-gray-500">
                Haz clic en el mapa para seleccionar la ubicación o usa el buscador
              </p>
            </div>
            <div className="h-[calc(100vh-16rem)]">
              <MapContainer
                center={[40.4168, -3.7038]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker onLocationSelect={handleLocationSelect} />
                {selectedLocation && (
                  <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={icon} />
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