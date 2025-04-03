'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getAddressFromCoordinates, getCoordinatesFromAddress } from '@/utils/geocoding';
import { createProperty, updateProperty, getPropertyById } from '../actions';
import { PropertyStatus, PropertyAction, PropertyType } from '@prisma/client';
import { Property } from '@/types/property';

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
  
  if (coordinates) {
    map.setView([coordinates.lat, coordinates.lng], 16);
  }
  
  return null;
}

export default function PropertyFormPage({ params }: { params?: { id?: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    address: '',
    population: '',
    status: 'PENDING' as PropertyStatus,
    action: 'SALE' as PropertyAction,
    type: 'HOUSE' as PropertyType,
    ownerName: '',
    ownerPhone: '',
    isOccupied: false,
    occupiedBy: '',
    price: '',
    rooms: '',
    bathrooms: '',
    area: '',
    description: '',
    features: '',
    yearBuilt: '',
    parking: false,
    furnished: false,
    pets: false,
    children: false,
    notes: ''
  });

  useEffect(() => {
    if (params?.id) {
      setIsEditing(true);
      const fetchProperty = async () => {
        try {
          const propertyData = await getPropertyById(params.id!);
          if (propertyData) {
            setProperty(propertyData);
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
              price: propertyData.price || '',
              rooms: propertyData.rooms || '',
              bathrooms: propertyData.bathrooms || '',
              area: propertyData.area || '',
              description: propertyData.description || '',
              features: propertyData.features || '',
              yearBuilt: propertyData.yearBuilt || '',
              parking: propertyData.parking || false,
              furnished: propertyData.furnished || false,
              pets: propertyData.pets || false,
              children: propertyData.children || false,
              notes: propertyData.notes || ''
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
  }, [params?.id]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    
    // Obtener dirección desde las coordenadas
    const addressData = await getAddressFromCoordinates(lat, lng);
    if (addressData) {
      setFormData(prev => ({
        ...prev,
        address: addressData.address,
        population: addressData.population
      }));
    }
  };

  const handleAddressSearch = async () => {
    if (formData.address) {
      setIsSearching(true);
      try {
        const coordinates = await getCoordinatesFromAddress(formData.address);
        if (coordinates) {
          setSelectedLocation({ lat: coordinates.lat, lng: coordinates.lng });
          
          // Actualizar población si está disponible
          const addressData = await getAddressFromCoordinates(coordinates.lat, coordinates.lng);
          if (addressData?.population) {
            setFormData(prev => ({
              ...prev,
              population: addressData.population
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        latitude: selectedLocation?.lat || null,
        longitude: selectedLocation?.lng || null,
        occupiedBy: formData.occupiedBy || null,
        price: formData.price || null,
        rooms: formData.rooms || null,
        bathrooms: formData.bathrooms || null,
        area: formData.area || null,
        description: formData.description || null,
        features: formData.features || null,
        yearBuilt: formData.yearBuilt || null,
        parking: formData.parking || false,
        furnished: formData.furnished || false,
        pets: formData.pets || false,
        children: formData.children || false,
        notes: formData.notes || null
      };

      if (isEditing && params?.id) {
        await updateProperty(params.id, data);
      } else {
        await createProperty(data);
      }
      
      router.push('/dashboard/properties');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar el inmueble');
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
              {isEditing ? 'Editar Inmueble' : 'Nuevo Inmueble'}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {isEditing 
                ? 'Modifica la información del inmueble y su ubicación en el mapa.' 
                : 'Ingresa la información del inmueble y selecciona su ubicación en el mapa.'}
            </p>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  {/* Información básica */}
                  <div className="col-span-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Información Básica</h4>
                    <div className="flex space-x-4">
                      <div className="flex-grow">
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
                            required
                            className="flex-grow focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-l-md"
                          />
                          <button
                            type="button"
                            onClick={handleAddressSearch}
                            disabled={isSearching}
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 shadow-sm text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {isSearching ? 'Buscando...' : 'Buscar'}
                          </button>
                        </div>
                      </div>
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
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="IN_PROCESS">En proceso</option>
                      <option value="AVAILABLE">Disponible</option>
                      <option value="SOLD">Vendido</option>
                      <option value="RENTED">Alquilado</option>
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="action" className="block text-sm font-medium text-gray-700">
                      Acción
                    </label>
                    <select
                      id="action"
                      name="action"
                      value={formData.action}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="SALE">Venta</option>
                      <option value="RENT">Alquiler</option>
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Tipo
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="HOUSE">Casa</option>
                      <option value="APARTMENT">Apartamento</option>
                      <option value="COMMERCIAL">Local Comercial</option>
                      <option value="LAND">Terreno</option>
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Precio (€)
                    </label>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Características */}
                  <div className="col-span-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Características</h4>
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label htmlFor="rooms" className="block text-sm font-medium text-gray-700">
                      Habitaciones
                    </label>
                    <input
                      type="number"
                      name="rooms"
                      id="rooms"
                      value={formData.rooms}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
                      Baños
                    </label>
                    <input
                      type="number"
                      name="bathrooms"
                      id="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                      Área (m²)
                    </label>
                    <input
                      type="number"
                      name="area"
                      id="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700">
                      Año de construcción
                    </label>
                    <input
                      type="number"
                      name="yearBuilt"
                      id="yearBuilt"
                      value={formData.yearBuilt}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="features" className="block text-sm font-medium text-gray-700">
                      Características destacadas
                    </label>
                    <textarea
                      name="features"
                      id="features"
                      rows={2}
                      value={formData.features}
                      onChange={handleInputChange}
                      placeholder="Ej: Aire acondicionado, Calefacción, Terraza..."
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <input
                          id="parking"
                          name="parking"
                          type="checkbox"
                          checked={formData.parking}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="parking" className="ml-2 block text-sm text-gray-900">
                          Parking
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="furnished"
                          name="furnished"
                          type="checkbox"
                          checked={formData.furnished}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="furnished" className="ml-2 block text-sm text-gray-900">
                          Amueblado
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="pets"
                          name="pets"
                          type="checkbox"
                          checked={formData.pets}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="pets" className="ml-2 block text-sm text-gray-900">
                          Admite mascotas
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="children"
                          name="children"
                          type="checkbox"
                          checked={formData.children}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="children" className="ml-2 block text-sm text-gray-900">
                          Admite niños
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Información del propietario */}
                  <div className="col-span-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Información del Propietario</h4>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                      Nombre del Propietario
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
                      Teléfono del Propietario
                    </label>
                    <input
                      type="tel"
                      name="ownerPhone"
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleInputChange}
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6">
                    <div className="flex items-center">
                      <input
                        id="isOccupied"
                        name="isOccupied"
                        type="checkbox"
                        checked={formData.isOccupied}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isOccupied" className="ml-2 block text-sm text-gray-900">
                        Está ocupado
                      </label>
                    </div>
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="occupiedBy" className="block text-sm font-medium text-gray-700">
                      Ocupado por
                    </label>
                    <input
                      type="text"
                      name="occupiedBy"
                      id="occupiedBy"
                      value={formData.occupiedBy}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Ubicación */}
                  <div className="col-span-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Ubicación</h4>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación en el mapa
                    </label>
                    <div className="h-64 w-full rounded-md border border-gray-300">
                      <MapContainer
                        center={[40.4168, -3.7038]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationMarker onLocationSelect={handleLocationSelect} />
                        <MapController coordinates={selectedLocation} />
                        {selectedLocation && (
                          <Marker
                            position={[selectedLocation.lat, selectedLocation.lng]}
                            icon={icon}
                          />
                        )}
                      </MapContainer>
                    </div>
                    {selectedLocation && (
                      <p className="mt-2 text-sm text-gray-500">
                        Coordenadas seleccionadas: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    )}
                  </div>

                  {/* Notas adicionales */}
                  <div className="col-span-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Notas Adicionales</h4>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notas
                    </label>
                    <textarea
                      name="notes"
                      id="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedLocation}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 