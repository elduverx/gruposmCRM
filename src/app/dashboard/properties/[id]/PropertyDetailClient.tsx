'use client';

import { useState, useEffect } from 'react';
import { Property, Activity, DPV, PropertyNews, Assignment } from '@/types/property';
import { updateProperty, createActivity, createOrUpdateDPV, getActivitiesByPropertyId, getAssignmentsByPropertyId, getPropertyNews, deleteAssignment } from '../actions';
import { PlusIcon, CheckIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import ActivityForm from '@/components/ActivityForm';
import DPVForm from '@/components/DPVForm';
import { Dialog } from '@headlessui/react';
import PropertyNewsForm from './PropertyNewsForm';
import { AssignmentForm } from '../AssignmentForm';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import PropertyForm from '@/components/PropertyForm';
import { getZones } from '@/app/dashboard/zones/actions';
import type { Zone } from '@/app/dashboard/zones/actions';

interface PropertyDetailClientProps {
  propertyId: string;
  initialProperty: Property;
  initialActivities: Activity[];
  initialDPV: DPV | null;
  initialNews: PropertyNews[];
  initialAssignments: Assignment[];
}

export default function PropertyDetailClient({ 
  propertyId, 
  initialProperty, 
  initialActivities, 
  initialDPV,
  initialNews,
  initialAssignments 
}: PropertyDetailClientProps) {
  const [property, setProperty] = useState<Property | null>(initialProperty);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [dpv, setDPV] = useState<DPV | null>(initialDPV);
  const [news, setNews] = useState<PropertyNews[]>(initialNews || []);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [isDPVFormOpen, setIsDPVFormOpen] = useState(false);
  const [isNewsFormOpen, setIsNewsFormOpen] = useState(false);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);

  // Cargar noticias al abrir la página
  useEffect(() => {
    const loadNews = async () => {
      try {
        const newsData = await getPropertyNews(propertyId);
        setNews(newsData as unknown as PropertyNews[]);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading news:', error);
        toast.error('Error al cargar las noticias');
      }
    };

    loadNews();
  }, [propertyId]);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const zonesData = await getZones();
        setZones(zonesData);
      } catch (error) {
        console.error('Error loading zones:', error);
      }
    };
    loadZones();
  }, []);

  const handleToggleLocated = async () => {
    if (!property || isUpdating) return;
    
    setIsUpdating(true);
    try {
      // eslint-disable-next-line no-console
      console.log('Toggling located status');
      const updatedProperty = await updateProperty(property.id, {
        isLocated: !property.isLocated
      });
      if (updatedProperty) {
        setProperty(prev => ({
          ...prev!,
          isLocated: !prev!.isLocated
        }));
        toast.success(`Propiedad marcada como ${property.isLocated ? 'no localizada' : 'localizada'}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error toggling located status:', error);
      toast.error('Error al cambiar el estado de localización');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivitySubmit = async (newActivity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await createActivity({
        propertyId: propertyId,
        type: newActivity.type,
        status: newActivity.status,
        date: newActivity.date,
        client: newActivity.client,
        notes: newActivity.notes
      });
      
      if (result) {
        const activitiesData = await getActivitiesByPropertyId(propertyId);
        if (activitiesData) {
          setActivities(activitiesData);
          toast.success('Actividad creada correctamente');
        }
      }
      setIsActivityFormOpen(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating activity:', error);
      toast.error('Error al crear la actividad');
    }
  };

  const handleDPVSubmit = async (data: Omit<DPV, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await createOrUpdateDPV(propertyId, {
        links: data.links,
        realEstate: data.realEstate,
        phone: data.phone,
        currentPrice: data.currentPrice,
        estimatedValue: data.estimatedValue,
        propertyId: propertyId
      });
      
      if (result) {
        setDPV(result);
        toast.success('DPV actualizado correctamente');
      }
      setIsDPVFormOpen(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating DPV:', error);
      toast.error('Error al actualizar el DPV');
    }
  };

  const handleNewsSubmit = (): void => {
    setIsNewsFormOpen(false);
    // Recargar la página para mostrar los cambios
    window.location.reload();
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setIsEditingAssignment(true);
    setIsAssignmentFormOpen(true);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('¿Está seguro de eliminar este encargo? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setIsUpdating(true);
      const success = await deleteAssignment(assignmentId);
      
      if (success) {
        toast.success('Encargo eliminado correctamente');
        // Actualizar la lista de asignaciones
        const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
        setAssignments(updatedAssignments);
      } else {
        toast.error('No se pudo eliminar el encargo');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting assignment:', error);
      toast.error('Error al eliminar la asignación');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePropertyUpdate = async (data: any) => {
    try {
      setIsUpdating(true);
      const updatedProperty = await updateProperty(propertyId, data);
      if (updatedProperty) {
        setProperty(updatedProperty);
        toast.success('Propiedad actualizada correctamente');
        setIsEditFormOpen(false);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating property:', error);
      toast.error('Error al actualizar la propiedad');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!property) return <div className="p-8 text-center">Inmueble no encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Información General */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-600">Información General</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditFormOpen(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Editar
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Localizado:</span>
              <button 
                onClick={handleToggleLocated}
                disabled={isUpdating}
                className="relative w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Marcar como localizado"
              >
                {property.isLocated && (
                  <CheckIcon 
                    className={`absolute inset-0 m-auto h-4 w-4 ${
                      isUpdating ? 'text-gray-400' : 'text-green-600'
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-700">Población</label>
            <p className="font-medium">{property.population}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-700">Tipo de Propiedad</label>
            <p className="font-medium">{property.type || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-700">Zona</label>
            <p className="font-medium">
              {property.zoneId && property.zone ? property.zone.name : 'N/A'}
            </p>
          </div>
          
          <div>
            <label className="text-sm text-gray-700">Dirección</label>
            <p className="font-medium">{property.address}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-700">Ocupado por</label>
            <p className="font-medium">{property.occupiedBy || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-700">Último contacto</label>
            {activities.length > 0 ? (
              <div>
                <p className="font-medium">
                  {activities[0].date}
                </p>
                <p className="text-sm text-gray-600">
                  Tipo: {activities[0].type}
                </p>
              </div>
            ) : (
              <p className="font-medium">N/A</p>
            )}
          </div>
          
          <div>
            <label className="text-sm text-gray-700">Nombre propietario</label>
            <p className="font-medium">{property.ownerName}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-700">Teléfono</label>
            <p className="font-medium">{property.ownerPhone}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-700">Responsable</label>
            <p className="font-medium">{property.responsible || 'N/A'}</p>
          </div>
        </div>

        {/* Detalles de la Propiedad */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Detalles de la Propiedad</h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              {showDetails ? 'Ocultar detalles' : 'Ver más detalles'}
              <svg
                className={`ml-1 h-4 w-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {showDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-700">Habitaciones</label>
                <p className="font-medium">{property.habitaciones || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-700">Baños</label>
                <p className="font-medium">{property.banos || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-700">Metros Cuadrados</label>
                <p className="font-medium">{property.metrosCuadrados ? `${property.metrosCuadrados}m²` : 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-700">Parking</label>
                <p className="font-medium">{property.parking ? 'Sí' : 'No'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-700">Ascensor</label>
                <p className="font-medium">{property.ascensor ? 'Sí' : 'No'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-700">Piscina</label>
                <p className="font-medium">{property.piscina ? 'Sí' : 'No'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenedor principal con layout vertical */}
      <div className="flex flex-col gap-4">
        {/* Actividades y DPV en columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Activities */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-600">Actividades</h2>
              <button 
                onClick={() => setIsActivityFormOpen(true)}
                className="inline-flex items-center justify-center p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">
                          {activity.date}
                        </p>
                        <p className="font-medium">Tipo: {activity.type}</p>
                        {activity.client && <p className="text-sm">Cliente: {activity.client}</p>}
                        {activity.notes && <p className="text-sm mt-1">{activity.notes}</p>}
                      </div>
                      <span className={`px-2 py-1 text-sm rounded-full ${
                        activity.status === 'Realizada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No hay actividades registradas</p>
              )}
            </div>
          </div>

          {/* DPV */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-600">DPV</h2>
              <button 
                onClick={() => setIsDPVFormOpen(true)}
                className="inline-flex items-center justify-center p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            
            {dpv ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-700">Links:</label>
                  <ul className="list-disc list-inside text-blue-600 mt-1">
                    {dpv.links && dpv.links.length > 0 ? (
                      dpv.links.map((link, index) => (
                        <li key={index} className="mb-1">
                          <a href={link} className="hover:underline break-all" target="_blank" rel="noopener noreferrer">
                            {link}
                          </a>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">No hay links disponibles</li>
                    )}
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-700">Inmobiliaria:</label>
                    <p className="font-medium">{dpv.realEstate || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-700">Teléfono:</label>
                    <p className="font-medium">{dpv.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-700">Precio Actual:</label>
                    <p className="font-medium">{dpv.currentPrice ? `${formatNumber(dpv.currentPrice)} €` : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Valoración Estimada:</label>
                    <p className="font-medium">{dpv.estimatedValue ? `${formatNumber(dpv.estimatedValue)} €` : 'N/A'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No hay información de DPV</p>
            )}
          </div>
        </div>

        {/* Noticias y Encargos en columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Noticias */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-600">Noticias</h2>
              <button 
                onClick={() => setIsNewsFormOpen(true)}
                className="inline-flex items-center justify-center p-2 rounded-full bg-green-600 text-white hover:bg-green-700"
                title="Crear noticia"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {news.length > 0 ? (
                news.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{item.type}</h3>
                        <p className="text-sm text-gray-500">{item.action}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.priority === 'HIGH' ? 'Alta' : 'Baja'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Responsable:</span> {item.responsible || 'No asignado'}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Valoración:</span>{' '}
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.valuation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.valuation ? 'Sí' : 'No'}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Precio:</span>{' '}
                        {item.valuation === 'true' ? (
                          <>
                            <span className="font-medium">SM:</span> {formatNumber(item.precioSM || 0)}€{' '}
                            <span className="font-medium">Cliente:</span> {formatNumber(item.precioCliente || 0)}€
                          </>
                        ) : (
                          `${formatNumber(item.value || 0)}€`
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No hay noticias para esta propiedad</p>
              )}
            </div>
          </div>

          {/* Encargos - Solo mostrar si hay noticias */}
          {news.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-600">Encargos</h2>
                <button 
                  onClick={() => setIsAssignmentFormOpen(true)}
                  className="inline-flex items-center justify-center p-2 rounded-full bg-green-600 text-white hover:bg-green-700"
                  title="Crear encargo"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {assignment.type === 'SALE' ? 'Venta' : 'Alquiler'}  {formatNumber(assignment.price)}€
                          </h3>
                          <p className="text-sm text-gray-500">
                            Cliente: {assignment.client?.name || 'Sin cliente'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Fecha límite: {assignment.exclusiveUntil}
                          </p>
                          <p className="text-sm text-gray-500">
                            Origen: {assignment.origin}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500">Comisión vendedor:</p>
                              <p className="text-sm">
                                {assignment.sellerFeeType === 'PERCENTAGE' 
                                  ? `${formatNumber(assignment.sellerFeeValue)}€ (3%)` 
                                  : `${formatNumber(assignment.sellerFeeValue)}€ (fijo)`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Comisión comprador:</p>
                              <p className="text-sm">
                                {assignment.buyerFeeType === 'PERCENTAGE' 
                                  ? `${formatNumber(assignment.buyerFeeValue)}€ (3%)` 
                                  : `${formatNumber(assignment.buyerFeeValue)}€ (fijo)`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditAssignment(assignment)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No hay encargos para esta propiedad</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {/* Modal de Actividades */}
      <Dialog
        open={isActivityFormOpen}
        onClose={() => setIsActivityFormOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <Dialog.Title className="text-lg font-medium">Nueva Actividad</Dialog.Title>
              <button
                onClick={() => setIsActivityFormOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <ActivityForm 
                propertyId={propertyId}
                onSubmit={handleActivitySubmit}
                onCancel={() => setIsActivityFormOpen(false)}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de DPV */}
      <Dialog
        open={isDPVFormOpen}
        onClose={() => setIsDPVFormOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <Dialog.Title className="text-lg font-medium">DPV</Dialog.Title>
              <button
                onClick={() => setIsDPVFormOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <DPVForm 
                initialData={dpv || {
                  links: [],
                  realEstate: '',
                  phone: '',
                  currentPrice: 0,
                  estimatedValue: 0,
                  propertyId: propertyId
                }}
                onSubmit={handleDPVSubmit}
                onCancel={() => setIsDPVFormOpen(false)}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de Noticias */}
      <Dialog
        open={isNewsFormOpen}
        onClose={() => setIsNewsFormOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <Dialog.Title className="text-lg font-medium">Nueva Noticia</Dialog.Title>
              <button
                onClick={() => setIsNewsFormOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <PropertyNewsForm 
                propertyId={propertyId}
                onSuccess={handleNewsSubmit}
                onCancel={() => setIsNewsFormOpen(false)}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de Encargos */}
      <Dialog
        open={isAssignmentFormOpen}
        onClose={() => {
          setIsAssignmentFormOpen(false);
          setIsEditingAssignment(false);
          setCurrentAssignment(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <Dialog.Title className="text-lg font-medium">
                {isEditingAssignment ? 'Editar Encargo' : 'Nuevo Encargo'}
              </Dialog.Title>
              <button
                onClick={() => {
                  setIsAssignmentFormOpen(false);
                  setIsEditingAssignment(false);
                  setCurrentAssignment(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <AssignmentForm 
                propertyId={propertyId}
                initialData={isEditingAssignment ? currentAssignment : undefined}
                onSuccess={(): void => {
                  setIsAssignmentFormOpen(false);
                  setIsEditingAssignment(false);
                  setCurrentAssignment(null);
                  getAssignmentsByPropertyId(propertyId).then(assignmentsData => {
                    setAssignments(assignmentsData);
                  });
                }}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de Edición de Propiedad */}
      <Dialog
        open={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <Dialog.Title className="text-lg font-medium">Editar Propiedad</Dialog.Title>
              <button
                onClick={() => setIsEditFormOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <PropertyForm 
                initialData={{
                  address: property.address,
                  population: property.population,
                  type: property.type,
                  ownerName: property.ownerName,
                  ownerPhone: property.ownerPhone,
                  latitude: property.latitude,
                  longitude: property.longitude,
                  zoneId: property.zoneId,
                  status: property.status,
                  action: property.action,
                  captureDate: property.captureDate ? new Date(property.captureDate) : null,
                  responsibleId: property.responsibleId,
                  hasSimpleNote: property.hasSimpleNote,
                  isOccupied: property.isOccupied,
                  clientId: property.clientId,
                  occupiedBy: property.occupiedBy,
                  isLocated: property.isLocated,
                  responsible: property.responsible,
                  habitaciones: property.habitaciones,
                  banos: property.banos,
                  metrosCuadrados: property.metrosCuadrados,
                  parking: property.parking,
                  ascensor: property.ascensor,
                  piscina: property.piscina,
                  zone: property.zone
                }}
                onSubmit={handlePropertyUpdate}
                onCancel={() => setIsEditFormOpen(false)}
                zones={zones}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 