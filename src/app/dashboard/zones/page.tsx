/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

'use client';

import { useEffect, useState } from 'react';
import { getProperties } from '../properties/actions';
import { getZones, createZone, Zone, updateZone, deleteZone } from './actions';
import { Property } from '@/types/property';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

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
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [propertiesData, zonesData] = await Promise.all([
          getProperties(),
          getZones()
        ]);
        
        if (!propertiesData || propertiesData.length === 0) {
          setError('No se encontraron inmuebles');
          return;
        }

        const validProperties = filterValidProperties(propertiesData);
        setProperties(validProperties);
        setZones(zonesData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
    if (!selectedZoneId) return properties;
    
    const selectedZone = zones.find(zone => zone.id === selectedZoneId);
    if (!selectedZone) return properties;
    
    return properties.filter(property => isPropertyInZone(property, selectedZone.coordinates));
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
    <div className="flex flex-col h-screen w-full">
      <div className="h-[60vh] w-full rounded-2xl overflow-hidden shadow-xl mx-4 mt-4 relative z-0">
        <ZonesMap
          center={[39.4015, -0.4027]}
          zoom={15}
          properties={properties}
          zones={zones}
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
          handlePolygonEdited={handlePolygonEdited}
          handlePolygonDeleted={handlePolygonDeleted}
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
                {zones.length}
              </span>
              Lista de Zonas
            </h2>
            {zones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay zonas creadas. Dibuja un polígono en el mapa para crear una.
              </div>
            ) : (
              <div className="space-y-3">
                {zones.map((zone) => (
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
                {selectedZoneId ? getPropertiesInSelectedZone().length : properties.length}
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
            ) : properties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay propiedades asignadas a zonas.
              </div>
            ) : (
              <div className="space-y-3">
                {(selectedZoneId ? getPropertiesInSelectedZone() : properties).map((property) => (
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
    </div>
  );
} 