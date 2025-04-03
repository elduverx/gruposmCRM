'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getProperties } from '../properties/actions';
import { Property } from '@/types/property';

// Fix para los iconos por defecto de Leaflet
const icon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>([40.4168, -3.7038]); // Madrid por defecto
  const [zoom, setZoom] = useState(13);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        console.log('Fetching properties...');
        const data = await getProperties();
        console.log('Properties fetched:', data);
        
        if (!data || data.length === 0) {
          console.log('No properties found');
          setError('No se encontraron inmuebles');
          return;
        }

        // Filtrar propiedades con coordenadas válidas
        const validProperties = data.filter(prop => 
          prop.latitude !== null && 
          prop.longitude !== null && 
          !isNaN(prop.latitude) && 
          !isNaN(prop.longitude)
        );

        console.log('Valid properties with coordinates:', validProperties);
        
        setProperties(validProperties);
        
        // Si hay propiedades válidas, centrar el mapa en la primera
        if (validProperties.length > 0) {
          const firstProperty = validProperties[0];
          console.log('Centering map on first property:', firstProperty);
          setCenter([firstProperty.latitude!, firstProperty.longitude!]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Error al cargar los inmuebles');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setCenter([property.latitude!, property.longitude!]);
    setZoom(15);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <div className="p-4">
        <h1 className="text-2xl font-semibold text-gray-900">Mapa de Inmuebles</h1>
        <p className="mt-2 text-sm text-gray-700">
          Visualiza la ubicación de todos los inmuebles en el mapa.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {properties.length} inmuebles encontrados
        </p>
      </div>
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Lista de inmuebles */}
        <div className="w-1/3 overflow-y-auto border-r border-gray-200">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Lista de Inmuebles</h2>
            <div className="space-y-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedProperty?.id === property.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => handlePropertyClick(property)}
                >
                  <h3 className="font-semibold">{property.address}</h3>
                  <p className="text-sm text-gray-600">{property.population}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {property.type}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {property.status}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {property.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="w-2/3">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {properties.map((property) => (
              <Marker
                key={property.id}
                position={[property.latitude!, property.longitude!]}
                icon={icon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">{property.address}</h3>
                    <p className="text-sm text-gray-600">{property.population}</p>
                    <p className="text-sm text-gray-600">Estado: {property.status}</p>
                    <p className="text-sm text-gray-600">Propietario: {property.ownerName}</p>
                    <p className="text-sm text-gray-600">Teléfono: {property.ownerPhone}</p>
                    <p className="text-sm text-gray-600">Tipo: {property.type}</p>
                    <p className="text-sm text-gray-600">Acción: {property.action}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
} 