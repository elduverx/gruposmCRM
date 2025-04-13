// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createProperty, updateProperty, getProperty } from '../actions';
import dynamic from 'next/dynamic';
import { getAddressFromCoordinates } from '@/utils/geocoding';
import { getZones } from '@/app/dashboard/zones/actions';
import { findZoneForCoordinates } from '@/utils/zoneUtils';
import { Zone } from '@/app/dashboard/zones/actions';
import { PropertyType } from '@/types/property';
import { toast } from 'react-hot-toast';

// Definir OperationType para uso en el cliente
const OperationType = {
  SALE: 'SALE',
  RENT: 'RENT'
};

// Importar el mapa dinámicamente para evitar errores de SSR
const PropertyMap = dynamic(() => import('@/components/map/PropertyMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-gray-100 animate-pulse" />
});

// Coordenadas de Camí Real 87, Catarroja
const CATARROJA_COORDS = {
  lat: 39.4035,
  lng: -0.4027
};

export default function PropertyFormPage({ params }: { params: { id?: string } }) {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [formData, setFormData] = useState({
    address: '',
    population: '',
    type: '',
    status: '',
    price: '',
    description: '',
    habitaciones: null,
    banos: null,
    metrosCuadrados: null,
    parking: false,
    ascensor: false,
    piscina: false,
    yearBuilt: '',
    isFurnished: false,
    latitude: CATARROJA_COORDS.lat,
    longitude: CATARROJA_COORDS.lng,
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    notes: ''
  });
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar las zonas al iniciar el componente
  useEffect(() => {
    const loadZones = async () => {
      try {
        const zonesData = await getZones();
        setZones(zonesData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading zones:', error);
      }
    };
    loadZones();
  }, []);

  // Cargar datos de la propiedad si estamos editando
  useEffect(() => {
    const fetchProperty = async () => {
      if (!params.id) return;

      try {
        const propertyData = await getProperty(params.id);
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
            status: propertyData.status || 'AVAILABLE',
            action: propertyData.action || 'SALE',
            captureDate: propertyData.captureDate || new Date().toISOString(),
            responsibleId: propertyData.responsibleId || null,
            hasSimpleNote: propertyData.hasSimpleNote || false,
            isOccupied: propertyData.isOccupied || false,
            clientId: propertyData.clientId || null,
            occupiedBy: propertyData.occupiedBy || null,
            isLocated: propertyData.isLocated || false,
            responsible: propertyData.responsible || null,
            habitaciones: propertyData.habitaciones || null,
            banos: propertyData.banos || null,
            metrosCuadrados: propertyData.metrosCuadrados || null,
            parking: propertyData.parking || false,
            ascensor: propertyData.ascensor || false,
            piscina: propertyData.piscina || false
          });

          if (propertyData.latitude && propertyData.longitude) {
            setSelectedLocation({
              lat: propertyData.latitude,
              lng: propertyData.longitude
            });
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          // Handle error appropriately
        }
      }
    };

    fetchProperty();
  }, [params.id]);

  // Cargar ubicación seleccionada desde localStorage o URL
  useEffect(() => {
    const loadSelectedLocation = () => {
      // Intentar obtener datos de la URL
      // Eliminar la variable no utilizada
      // const urlParams = new URLSearchParams(window.location.search);
      
      // Si no hay datos en la URL, intentar obtenerlos del localStorage
      try {
        const storedLocation = localStorage.getItem('selectedLocation');
        if (storedLocation) {
          const locationData = JSON.parse(storedLocation) as { address?: string; lat?: number; lng?: number };
          
          if (locationData.address && locationData.lat && locationData.lng) {
            setFormData(prev => ({
              ...prev,
              address: locationData.address,
              latitude: locationData.lat,
              longitude: locationData.lng
            }));
            
            setSelectedLocation({
              lat: locationData.lat,
              lng: locationData.lng
            });
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading location from localStorage:', error);
      }
    };
    loadSelectedLocation();
  }, []);

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

      if (params.id) {
        await updateProperty(params.id, submitData);
        toast.success('Propiedad actualizada correctamente');
      } else {
        await createProperty(submitData);
        toast.success('Propiedad creada correctamente');
      }

      router.push('/dashboard/properties');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error al guardar la propiedad: ${error.message}`);
      } else {
        toast.error('Error al guardar la propiedad');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressSearch = async (address: string) => {
    if (!address) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json() as Array<{ lat: string; lon: string }>;

      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        setSelectedLocation({ lat, lng });
        
        // Solo llamar a assignZoneToCoordinates si zones es un array válido
        if (zones && Array.isArray(zones) && zones.length > 0) {
          assignZoneToCoordinates(lat, lng);
        }
      } else {
        toast.error('No se encontró la dirección');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting address from coordinates:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    
    try {
      const addressData = await getAddressFromCoordinates(lat, lng);
      let zoneId = null;
      
      // Buscar la zona correspondiente a las coordenadas
      if (zones && Array.isArray(zones) && zones.length > 0) {
        const zone = findZoneForCoordinates({ lat, lng }, zones);
        if (zone) {
          zoneId = zone.id;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        address: addressData?.address ? String(addressData.address) : prev.address,
        population: addressData?.population ? String(addressData.population) : prev.population,
        zoneId: zoneId || prev.zoneId
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting address from coordinates:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Envolver la función en useCallback para evitar recreaciones en cada render
  const assignZoneToCoordinates = useCallback((lat: number, lng: number) => {
    if (!zones || !Array.isArray(zones) || zones.length === 0) {
      return;
    }
    
    const zone = findZoneForCoordinates({ lat, lng }, zones);
    if (zone) {
      setFormData(prev => ({
        ...prev,
        zoneId: zone.id
      }));
    }
  }, [zones]);

  // Asignar zona a las coordenadas seleccionadas
  useEffect(() => {
    if (selectedLocation && zones.length > 0) {
      assignZoneToCoordinates(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation, zones, assignZoneToCoordinates]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {params.id ? 'Editar Propiedad' : 'Nueva Propiedad'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Sección de Ubicación */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Dirección
                    </label>
                    <div className="mt-1 flex">
                      <input
                        type="text"
                        id="address"
                        value={formData.address || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value as string }))}
                        className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddressSearch(formData.address || '')}
                        className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Buscar
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="population" className="block text-sm font-medium text-gray-700">
                      Población
                    </label>
                    <input
                      type="text"
                      id="population"
                      value={formData.population || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, population: e.target.value as string }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                 
                </div>
                <div className="mt-6">
                  <PropertyMap
                    selectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect}
                    defaultLocation={CATARROJA_COORDS}
                  />
                </div>
              </div>

              {/* Sección de Detalles */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Propiedad</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Tipo de Propiedad
                    </label>
                    <select
                      id="type"
                      value={formData.type || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as string }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      <option value={PropertyType.PISO}>Piso</option>
                      <option value={PropertyType.CASA}>Casa</option>
                      <option value={PropertyType.CHALET}>Chalet</option>
                      <option value={PropertyType.APARTAMENTO}>Apartamento</option>
                      <option value={PropertyType.ATICO}>Ático</option>
                      <option value={PropertyType.DUPLEX}>Dúplex</option>
                      <option value={PropertyType.TERRENO}>Terreno</option>
                      <option value={PropertyType.LOCAL_COMERCIAL}>Local Comercial</option>
                      <option value={PropertyType.OFICINA}>Oficina</option>
                      <option value={PropertyType.GARAJE}>Garaje</option>
                      <option value={PropertyType.TRASTERO}>Trastero</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      id="status"
                      value={formData.status || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as string }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      <option value={OperationType.SALE}>Venta</option>
                      <option value={OperationType.RENT}>Alquiler</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Precio
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="price"
                        value={formData.price || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: String(e.target.value) }))}
                        className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">€</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="habitaciones" className="block text-sm font-medium text-gray-700">
                      Habitaciones
                    </label>
                    <input
                      type="number"
                      id="habitaciones"
                      value={formData.habitaciones || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, habitaciones: e.target.value ? parseInt(e.target.value) : null }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="banos" className="block text-sm font-medium text-gray-700">
                      Baños
                    </label>
                    <input
                      type="number"
                      id="banos"
                      value={formData.banos || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, banos: e.target.value ? parseInt(e.target.value) : null }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="metrosCuadrados" className="block text-sm font-medium text-gray-700">
                      Metros Cuadrados
                    </label>
                    <input
                      type="number"
                      id="metrosCuadrados"
                      value={formData.metrosCuadrados || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, metrosCuadrados: e.target.value ? parseInt(e.target.value) : null }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700">
                      Año de Construcción
                    </label>
                    <input
                      type="number"
                      id="yearBuilt"
                      value={formData.yearBuilt || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, yearBuilt: String(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="parking" className="block text-sm font-medium text-gray-700">
                      Parking
                    </label>
                    <input
                      type="checkbox"
                      id="parking"
                      checked={formData.parking || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, parking: e.target.checked }))}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="ascensor" className="block text-sm font-medium text-gray-700">
                      Ascensor
                    </label>
                    <input
                      type="checkbox"
                      id="ascensor"
                      checked={formData.ascensor || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, ascensor: e.target.checked }))}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="piscina" className="block text-sm font-medium text-gray-700">
                      Piscina
                    </label>
                    <input
                      type="checkbox"
                      id="piscina"
                      checked={formData.piscina || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, piscina: e.target.checked }))}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value as string }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Sección del Propietario */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Propietario</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="ownerName"
                      value={formData.ownerName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value as string }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="ownerPhone"
                      value={formData.ownerPhone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerPhone: e.target.value as string }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="ownerEmail"
                      value={formData.ownerEmail || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value as string }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sección del Inquilino */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Inquilino</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="tenantName"
                      value={formData.tenantName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tenantName: e.target.value as string }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="tenantPhone" className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="tenantPhone"
                      value={formData.tenantPhone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tenantPhone: e.target.value as string }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="tenantEmail" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="tenantEmail"
                      value={formData.tenantEmail || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tenantEmail: e.target.value as string }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                
                 
                 
                </div>
              </div>

              {/* Notas */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notas Adicionales
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value as string }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/properties')}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Guardando...' : params.id ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 