'use client';

import { useState, useEffect } from 'react';
import { Property, Activity } from '@/types/property';
import { updateProperty, createActivity, createOrUpdateDPV, getActivitiesByPropertyId } from '../actions';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import ActivityForm from '@/components/ActivityForm';
import DPVForm from '@/components/DPVForm';
import { Dialog } from '@headlessui/react';

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
}

export default function PropertyDetailClient({ 
  propertyId, 
  initialProperty, 
  initialActivities, 
  initialDPV 
}: PropertyDetailClientProps) {
  const [property, setProperty] = useState<Property | null>(initialProperty);
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [isDPVFormOpen, setIsDPVFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
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

  if (!property) return <div className="p-8 text-center">Inmueble no encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* General Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Información General</h2>
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
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Población</label>
              <p className="font-medium">{property.population}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Zona</label>
              <p className="font-medium">{property.zone?.name || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Dirección</label>
              <p className="font-medium">{property.address}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Ocupado por</label>
              <p className="font-medium">{property.occupiedBy || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Último contacto</label>
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
              <label className="text-sm text-gray-500">Nombre propietario</label>
              <p className="font-medium">{property.ownerName}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Teléfono</label>
              <p className="font-medium">{property.ownerPhone}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Responsable</label>
              <p className="font-medium">{property.responsible || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Actividades</h2>
            <button 
              onClick={() => setIsActivityFormOpen(true)}
              className="inline-flex items-center justify-center p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">{activity.date}</p>
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
            <h2 className="text-xl font-semibold">DPV</h2>
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
                <label className="text-sm text-gray-500">Links:</label>
                <ul className="list-disc list-inside text-blue-600">
                  {dpv.links.map((link, index) => (
                    <li key={index}><a href={link} className="hover:underline">{link}</a></li>
                  ))}
                </ul>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Inmobiliaria:</label>
                <p className="font-medium">{dpv.realEstate || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Teléfono:</label>
                <p className="font-medium">{dpv.phone || 'N/A'}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-sm text-gray-500">Precio Actual:</label>
                  <p className="font-medium">{dpv.currentPrice ? `${dpv.currentPrice} €` : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Valoración Estimada:</label>
                  <p className="font-medium">{dpv.estimatedValue ? `${dpv.estimatedValue} €` : 'N/A'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsDPVFormOpen(true)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                Editar
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No hay información DPV registrada</p>
              <button 
                onClick={() => setIsDPVFormOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Agregar DPV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Activity Modal */}
      <Dialog
        open={isActivityFormOpen}
        onClose={() => setIsActivityFormOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium">Nueva Actividad</Dialog.Title>
              <button
                onClick={() => setIsActivityFormOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <ActivityForm
              propertyId={propertyId}
              onSubmit={handleActivitySubmit}
              onCancel={() => setIsActivityFormOpen(false)}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* DPV Modal */}
      <Dialog
        open={isDPVFormOpen}
        onClose={() => setIsDPVFormOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium">
                {dpv ? 'Editar DPV' : 'Nuevo DPV'}
              </Dialog.Title>
              <button
                onClick={() => setIsDPVFormOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
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
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 