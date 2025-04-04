'use client';

import { useState, useEffect } from 'react';
import { Property, Activity } from '@/types/property';
import { updateProperty, createActivity, createOrUpdateDPV, getActivitiesByPropertyId, createPropertyNews, getPropertyNews } from '../actions';
import { PlusIcon, XMarkIcon, NewspaperIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import ActivityForm from '@/components/ActivityForm';
import DPVForm from '@/components/DPVForm';
import { Dialog } from '@headlessui/react';
import { PropertyNewsForm } from '../PropertyNewsForm';

interface DPV {
  links: string[];
  realEstate: string;
  phone: string;
  currentPrice: number;
  estimatedValue: number;
  propertyId: string;
}

interface PropertyDetailClientProps {
  propertyId: string;
  initialProperty: Property | null;
  initialActivities: Activity[];
  initialDPV: any | null;
  initialNews: any[];
}

export default function PropertyDetailClient({ 
  propertyId, 
  initialProperty, 
  initialActivities, 
  initialDPV,
  initialNews 
}: PropertyDetailClientProps) {
  const [property, setProperty] = useState<Property | null>(initialProperty);
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [isDPVFormOpen, setIsDPVFormOpen] = useState(false);
  const [isNewsFormOpen, setIsNewsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [news, setNews] = useState<any[]>(initialNews);
  const [dpv, setDPV] = useState<DPV | null>(initialDPV ? {
    links: initialDPV.links as string[],
    realEstate: initialDPV.realEstate || '',
    phone: initialDPV.phone || '',
    currentPrice: initialDPV.currentPrice || 0,
    estimatedValue: initialDPV.estimatedValue || 0,
    propertyId: propertyId
  } : null);

  const handleToggleLocated = async () => {
    if (!property || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const updatedProperty = await updateProperty(property.id, {
        isLocated: !property.isLocated
      });
      if (updatedProperty) {
        setProperty(prev => ({
          ...prev!,
          isLocated: !prev!.isLocated
        }));
      }
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivitySubmit = async (newActivity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createActivity({
        propertyId: propertyId,
        type: newActivity.type,
        status: newActivity.status,
        date: newActivity.date,
        client: newActivity.client,
        notes: newActivity.notes
      });
      
      // Reload activities
      const activitiesData = await getActivitiesByPropertyId(propertyId);
      if (activitiesData) {
        setActivities(activitiesData);
      }
      
      setIsActivityFormOpen(false);
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  const handleDPVSubmit = async (data: DPV) => {
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
        setDPV({
          links: result.links as string[],
          realEstate: result.realEstate || '',
          phone: result.phone || '',
          currentPrice: result.currentPrice || 0,
          estimatedValue: result.estimatedValue || 0,
          propertyId: propertyId
        });
      }
      
      setIsDPVFormOpen(false);
    } catch (error) {
      console.error('Error updating DPV:', error);
    }
  };

  const handleNewsSubmit = async (data: any) => {
    try {
      const result = await createPropertyNews({
        ...data,
        propertyId,
        value: data.type === 'DPV' ? dpv?.currentPrice : null
      });
      
      if (result) {
        setNews(prev => [result, ...prev]);
        setIsNewsFormOpen(false);
      }
    } catch (error) {
      console.error('Error creating news:', error);
    }
  };

  if (!property) return <div className="p-8 text-center">Inmueble no encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Información General */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-600">Información General</h2>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-700">Población</label>
            <p className="font-medium">{property.population}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-700">Zona</label>
            <p className="font-medium">{property.zone?.name || 'N/A'}</p>
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
                  {new Date(activities[0].date).toLocaleDateString('es-ES')}
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
                        <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString('es-ES')}</p>
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
                    {dpv.links.map((link, index) => (
                      <li key={index} className="mb-1">
                        <a href={link} className="hover:underline break-all" target="_blank" rel="noopener noreferrer">
                          {link}
                        </a>
                      </li>
                    ))}
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
                    <p className="font-medium">{dpv.currentPrice ? `${dpv.currentPrice.toLocaleString()} €` : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Valoración Estimada:</label>
                    <p className="font-medium">{dpv.estimatedValue ? `${dpv.estimatedValue.toLocaleString()} €` : 'N/A'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No hay información de DPV</p>
            )}
          </div>

          {/* Noticias */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-600">Noticias</h2>
              <button 
                onClick={() => setIsNewsFormOpen(true)}
                className="inline-flex items-center justify-center p-2 rounded-full bg-green-600 text-white hover:bg-green-700"
                title="Crear noticia"
              >
                <NewspaperIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {news.length > 0 ? (
                news.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString('es-ES')}</p>
                        <p className="font-medium">Tipo: {item.type}</p>
                        <p className="text-sm">Acción: {item.action === 'SALE' ? 'Venta' : 'Alquiler'}</p>
                        <p className="text-sm">Valoración: {item.valuation === 'PRECIOSM' ? 'PrecioSM' : 'Precio Cliente'}</p>
                        <p className="text-sm">Responsable: {item.responsible}</p>
                        {item.value && <p className="text-sm">Valor: {item.value.toLocaleString()} €</p>}
                      </div>
                      <span className={`px-2 py-1 text-sm rounded-full ${
                        item.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.priority === 'HIGH' ? 'Alta' : 'Baja'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No hay noticias registradas</p>
              )}
            </div>
          </div>
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
                <XMarkIcon className="h-6 w-6" />
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
                <XMarkIcon className="h-6 w-6" />
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
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <PropertyNewsForm 
                propertyId={propertyId}
                dpvValue={dpv?.currentPrice}
                onSuccess={() => {
                  setIsNewsFormOpen(false);
                  getPropertyNews(propertyId).then(newsData => {
                    setNews(newsData);
                  });
                }}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 