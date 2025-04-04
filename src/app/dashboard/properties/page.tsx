'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { PencilIcon, TrashIcon, MapIcon } from '@heroicons/react/24/outline';
import { getProperties, deleteProperty, getActivitiesByPropertyId, updateProperty, getDPVByPropertyId, createActivity } from './actions';
import { Property, Activity, DPV } from '@/types/property';
import { CheckIcon } from '@heroicons/react/24/solid';
import { getZones, updateZone, Zone } from '../zones/actions';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { PropertyStatus, PropertyAction, PropertyType } from '@prisma/client';
import ActivityForm from '@/components/ActivityForm';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activitiesMap, setActivitiesMap] = useState<Record<string, Activity[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDescription, setNewZoneDescription] = useState('');
  const [newZoneColor, setNewZoneColor] = useState('#FF0000');
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Property>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<Property | null>(null);
  const [selectedPropertyActivities, setSelectedPropertyActivities] = useState<Activity[]>([]);
  const [selectedPropertyDPV, setSelectedPropertyDPV] = useState<DPV | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [selectedPropertyForActivity, setSelectedPropertyForActivity] = useState<Property | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [propertiesData, zonesData] = await Promise.all([
          getProperties(),
          getZones()
        ]);
        
        setProperties(propertiesData);
        setZones(zonesData);
        
        // Obtener las actividades para cada propiedad
        const activitiesPromises = propertiesData.map(property => 
          getActivitiesByPropertyId(property.id)
        );
        
        const activitiesResults = await Promise.all(activitiesPromises);
        
        // Crear un mapa de actividades por propiedad
        const activitiesMap: Record<string, Activity[]> = {};
        propertiesData.forEach((property, index) => {
          activitiesMap[property.id] = activitiesResults[index];
        });
        
        setActivitiesMap(activitiesMap);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteProperty = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este inmueble?')) {
      setIsDeleting(id);
      try {
        await deleteProperty(id);
        setProperties(properties.filter(property => property.id !== id));
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Error al eliminar el inmueble');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleEditZone = (zone: Zone) => {
    setSelectedZone(zone);
    setNewZoneName(zone.name);
    setNewZoneDescription(zone.description || '');
    setNewZoneColor(zone.color);
    setShowZoneModal(true);
  };

  const handleZoneCreated = () => {
    // Implementation needed if required
  };

  const handleSaveZone = async () => {
    if (!selectedZone) return;
    
    try {
      const updatedZone = await updateZone(selectedZone.id, {
        name: newZoneName,
        description: newZoneDescription,
        color: newZoneColor,
        coordinates: [] // Empty array as we're not handling coordinates anymore
      });
      
      setZones(zones.map(zone => zone.id === updatedZone.id ? updatedZone : zone));
      setShowZoneModal(false);
      alert('Zona actualizada correctamente');
    } catch (error) {
      console.error('Error updating zone:', error);
      alert('Error al actualizar la zona');
    }
  };

  const handleCancelZoneEdit = () => {
    setShowZoneModal(false);
    setSelectedZone(null);
  };

  // Funciones para editar propiedades
  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setEditFormData({
      address: property.address,
      population: property.population,
      status: property.status,
      action: property.action,
      type: property.type,
      ownerName: property.ownerName,
      ownerPhone: property.ownerPhone,
      captureDate: property.captureDate,
      responsibleId: property.responsibleId,
      hasSimpleNote: property.hasSimpleNote,
      isOccupied: property.isOccupied,
      clientId: property.clientId,
      zoneId: property.zoneId,
      latitude: property.latitude,
      longitude: property.longitude,
      occupiedBy: property.occupiedBy,
      isLocated: property.isLocated,
      responsible: property.responsible
    });
    setShowPropertyModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setEditFormData({
        ...editFormData,
        [name]: checkbox.checked
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };

  const handleSaveProperty = async () => {
    if (!selectedProperty) return;
    
    try {
      setIsSaving(true);
      
      // Convertir la fecha de captura a formato ISO string si es necesario
      const formData = {
        ...editFormData,
        captureDate: editFormData.captureDate ? new Date(editFormData.captureDate).toISOString() : undefined
      };
      
      const updatedProperty = await updateProperty(selectedProperty.id, formData);
      
      if (updatedProperty) {
        // Actualizar la lista de propiedades
        setProperties(properties.map(property => 
          property.id === updatedProperty.id ? updatedProperty : property
        ));
        
        // Cerrar el modal
        setShowPropertyModal(false);
        
        // Mostrar mensaje de éxito
        alert('Propiedad actualizada correctamente');
      }
    } catch (error) {
      console.error('Error updating property:', error);
      alert('Error al actualizar la propiedad');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPropertyEdit = () => {
    setShowPropertyModal(false);
    setSelectedProperty(null);
    setEditFormData({});
  };

  const handlePropertyClick = async (property: Property) => {
    setIsLoadingDetails(true);
    setSelectedPropertyDetails(property);
    setShowDetailsModal(true);
    
    try {
      const [activities, dpv] = await Promise.all([
        getActivitiesByPropertyId(property.id),
        getDPVByPropertyId(property.id)
      ]);
      
      setSelectedPropertyActivities(activities);
      setSelectedPropertyDPV(dpv);
    } catch (error) {
      console.error('Error loading property details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleActivitySubmit = async (activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newActivity = await createActivity(activityData);
      if (newActivity) {
        // Actualizar las actividades en el estado
        const updatedActivities = [...selectedPropertyActivities, newActivity];
        setSelectedPropertyActivities(updatedActivities);
        
        // Actualizar el mapa de actividades
        setActivitiesMap(prev => ({
          ...prev,
          [activityData.propertyId]: updatedActivities
        }));
        
        setIsActivityFormOpen(false);
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Error al crear la actividad');
    }
  };

  const handleToggleLocated = async (property: Property) => {
    try {
      setIsUpdating(true);
      const updatedProperty = await updateProperty(property.id, {
        isLocated: !property.isLocated
      });
      if (updatedProperty) {
        setProperties(properties.map(p => p.id === property.id ? updatedProperty : p));
        if (selectedPropertyDetails?.id === property.id) {
          setSelectedPropertyDetails(updatedProperty);
        }
      }
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Inmuebles</h1>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/dashboard/properties/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Añadir inmueble
            </Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Población</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Zona</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dirección</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ocupado por</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Último contacto</th>
                      <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Localizado</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Propietario</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Teléfono</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Responsable</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {properties.map((property) => {
                      const propertyActivities = activitiesMap[property.id] || [];
                      const lastActivity = propertyActivities.length > 0 ? propertyActivities[0] : null;
                      const propertyZone = property.zoneId ? zones.find(zone => zone.id === property.zoneId) : null;
                      
                      return (
                        <tr key={property.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.population}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            {propertyZone ? (
                              <div className="flex items-center">
                                <span 
                                  className="inline-block w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: propertyZone.color }}
                                ></span>
                                {propertyZone.name}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            <button
                              onClick={() => handlePropertyClick(property)}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              {property.address}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.occupiedBy || '-'}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            {lastActivity ? (
                              <span title={`Último contacto: ${lastActivity.date}`}>
                                {lastActivity.date}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                            {property.isLocated ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                                <CheckIcon className="h-4 w-4 text-green-600" />
                              </span>
                            ) : (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300">
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.ownerName}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.ownerPhone}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.responsible || '-'}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditProperty(property)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <PencilIcon className="h-5 w-5" />
                                <span className="sr-only">Editar {property.address}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProperty(property.id)}
                                disabled={isDeleting === property.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                <TrashIcon className="h-5 w-5" />
                                <span className="sr-only">Eliminar {property.address}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Modal */}
      {showZoneModal && selectedZone && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Editar Zona: {selectedZone.name}</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="space-y-4">
                <div>
                  <label htmlFor="zoneName" className="block text-sm font-medium text-gray-700">
                    Nombre de la Zona
                  </label>
                  <input
                    type="text"
                    id="zoneName"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="zoneDescription" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    id="zoneDescription"
                    value={newZoneDescription}
                    onChange={(e) => setNewZoneDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="zoneColor" className="block text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <input
                    type="color"
                    id="zoneColor"
                    value={newZoneColor}
                    onChange={(e) => setNewZoneColor(e.target.value)}
                    className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelZoneEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveZone}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar propiedad */}
      {showPropertyModal && selectedProperty && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Editar Propiedad: {selectedProperty.address}</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Información General</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Dirección
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={editFormData.address || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                        value={editFormData.population || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Estado
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={editFormData.status || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        {Object.values(PropertyStatus).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="action" className="block text-sm font-medium text-gray-700">
                        Acción
                      </label>
                      <select
                        id="action"
                        name="action"
                        value={editFormData.action || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        {Object.values(PropertyAction).map((action) => (
                          <option key={action} value={action}>
                            {action}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Tipo
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={editFormData.type || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        {Object.values(PropertyType).map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="captureDate" className="block text-sm font-medium text-gray-700">
                        Fecha de Captura
                      </label>
                      <input
                        type="date"
                        id="captureDate"
                        name="captureDate"
                        value={editFormData.captureDate ? new Date(editFormData.captureDate).toISOString().split('T')[0] : ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700">
                        Zona
                      </label>
                      <select
                        id="zoneId"
                        name="zoneId"
                        value={editFormData.zoneId || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Sin zona</option>
                        {zones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                      {editFormData.zoneId && (
                        <div className="mt-2 flex items-center">
                          <span 
                            className="inline-block w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: zones.find(z => z.id === editFormData.zoneId)?.color || '#FF0000' }}
                          ></span>
                          <span className="text-xs text-gray-500">
                            {zones.find(z => z.id === editFormData.zoneId)?.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Información del Propietario</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                        Nombre del Propietario
                      </label>
                      <input
                        type="text"
                        id="ownerName"
                        name="ownerName"
                        value={editFormData.ownerName || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
                        Teléfono del Propietario
                      </label>
                      <input
                        type="text"
                        id="ownerPhone"
                        name="ownerPhone"
                        value={editFormData.ownerPhone || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="occupiedBy" className="block text-sm font-medium text-gray-700">
                        Ocupado por
                      </label>
                      <input
                        type="text"
                        id="occupiedBy"
                        name="occupiedBy"
                        value={editFormData.occupiedBy || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="responsible" className="block text-sm font-medium text-gray-700">
                        Responsable
                      </label>
                      <input
                        type="text"
                        id="responsible"
                        name="responsible"
                        value={editFormData.responsible || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isOccupied"
                        name="isOccupied"
                        checked={editFormData.isOccupied || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isOccupied" className="ml-2 block text-sm text-gray-900">
                        Está ocupado
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isLocated"
                        name="isLocated"
                        checked={editFormData.isLocated || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isLocated" className="ml-2 block text-sm text-gray-900">
                        Está localizado
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="hasSimpleNote"
                        name="hasSimpleNote"
                        checked={editFormData.hasSimpleNote || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="hasSimpleNote" className="ml-2 block text-sm text-gray-900">
                        Tiene nota simple
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelPropertyEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProperty}
                disabled={isSaving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      <Dialog
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-6xl w-full rounded-xl bg-white">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <Dialog.Title className="text-xl font-medium text-gray-900">
                Detalles del Inmueble
              </Dialog.Title>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedPropertyDetails ? (
              <div className="grid grid-cols-3 gap-6 p-6 h-[calc(100vh-12rem)] overflow-hidden">
                {/* Columna 1: Información General */}
                <div className="bg-white rounded-lg overflow-hidden flex flex-col h-full border border-gray-200">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900">Información General</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Localizado:</span>
                      <button 
                        onClick={() => selectedPropertyDetails && handleToggleLocated(selectedPropertyDetails)}
                        disabled={isUpdating}
                        className="relative w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Marcar como localizado"
                      >
                        {selectedPropertyDetails?.isLocated && (
                          <CheckIcon 
                            className={`absolute inset-0 m-auto h-4 w-4 ${
                              isUpdating ? 'text-gray-400' : 'text-green-600'
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1">
                    <dl className="space-y-6">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedPropertyDetails.address}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Población</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedPropertyDetails.population}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Estado</dt>
                        <dd className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {selectedPropertyDetails.status}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Acción</dt>
                        <dd className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {selectedPropertyDetails.action}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                        <dd className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {selectedPropertyDetails.type}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Propietario</dt>
                        <dd className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-gray-900">{selectedPropertyDetails.ownerName}</span>
                          {selectedPropertyDetails.ownerName && (
                            <button className="text-blue-600 hover:text-blue-800">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedPropertyDetails.ownerPhone}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Columna 2: Actividades */}
                <div className="bg-white rounded-lg overflow-hidden flex flex-col h-full border border-gray-200">
                  <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Actividades</h3>
                    <button 
                      onClick={() => {
                        setSelectedPropertyForActivity(selectedPropertyDetails);
                        setIsActivityFormOpen(true);
                      }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-4">
                      {selectedPropertyActivities.length > 0 ? (
                        selectedPropertyActivities.map((activity, index) => (
                          <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <time className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString('es-ES', { 
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</time>
                                  <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                                </div>
                                {activity.client && (
                                  <p className="text-sm text-gray-600">Cliente: {activity.client}</p>
                                )}
                                {activity.notes && (
                                  <p className="text-sm text-gray-600">{activity.notes}</p>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                activity.status === 'Realizada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {activity.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">No hay actividades registradas</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Columna 3: DPV */}
                <div className="bg-white rounded-lg overflow-hidden flex flex-col h-full border border-gray-200">
                  <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">DPV</h3>
                    <button 
                      onClick={() => {
                        setShowDetailsModal(false);
                        router.push(`/dashboard/properties/${selectedPropertyDetails.id}/dpv/edit`);
                      }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                    {selectedPropertyDPV ? (
                      <dl className="space-y-6">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Links</dt>
                          <dd className="mt-2">
                            <ul className="space-y-1">
                              {selectedPropertyDPV.links.map((link: string, index: number) => (
                                <li key={index}>
                                  <a 
                                    href={link} 
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    {link}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Inmobiliaria</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedPropertyDPV.realEstate || 'N/A'}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedPropertyDPV.phone || 'N/A'}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Precio Actual</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {selectedPropertyDPV.currentPrice ? `${selectedPropertyDPV.currentPrice.toLocaleString()} €` : 'N/A'}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Valoración Estimada</dt>
                          <dd className="mt-1 flex items-center gap-2">
                            <span className="text-sm text-gray-900">
                              {selectedPropertyDPV.estimatedValue ? `${selectedPropertyDPV.estimatedValue.toLocaleString()} €` : 'N/A'}
                            </span>
                            <button className="text-blue-600 hover:text-blue-800">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No hay información DPV registrada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-600">No se encontró la información del inmueble</p>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Activity Form Modal */}
      <Dialog
        open={isActivityFormOpen}
        onClose={() => setIsActivityFormOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">Nueva Actividad</Dialog.Title>
              <button
                onClick={() => setIsActivityFormOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {selectedPropertyForActivity && (
              <ActivityForm
                propertyId={selectedPropertyForActivity.id}
                onSubmit={handleActivitySubmit}
                onCancel={() => setIsActivityFormOpen(false)}
              />
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 