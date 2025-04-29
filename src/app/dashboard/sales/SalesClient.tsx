'use client';

import { useState, useEffect } from 'react';
import { Assignment } from '@/types/property';
import { getAssignments } from '../properties/actions';
import { markPropertyAsSold, getSoldProperties, revertPropertySale } from './actions';
import { toast } from 'sonner';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  CheckIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  BuildingOfficeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { Spinner } from '@/components/ui/Spinner';

type TabType = 'pending' | 'completed';

// Definir una interfaz para las propiedades vendidas que coincida con la de actions.ts
interface SoldProperty {
  id: string;
  address: string;
  population: string;
  updatedAt: string;
  isSold: boolean;
  assignment_id?: string;
  clientId?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  assignments: Array<{
    id: string;
    clientId?: string;
    client?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  }>;
}

export default function SalesClient() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [soldProperties, setSoldProperties] = useState<SoldProperty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingAssignment, setProcessingAssignment] = useState<string | null>(null);
  const [processingPropertyRevert, setProcessingPropertyRevert] = useState<string | null>(null);
  const [confirmSaleDialogOpen, setConfirmSaleDialogOpen] = useState(false);
  const [confirmRevertDialogOpen, setConfirmRevertDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<SoldProperty | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingAssignments();
    } else {
      fetchSoldProperties();
    }
  }, [activeTab]);

  const fetchPendingAssignments = async () => {
    setLoading(true);
    try {
      // Obtener todas las asignaciones
      const assignmentsData = await getAssignments();
      
      // Filtrar asignaciones con clientes que tienen pedidos y propiedades no vendidas
      const filtered = assignmentsData.filter(assignment => {
        const clientHasRequest = assignment.client && 'hasRequest' in assignment.client && assignment.client.hasRequest;
        const propertyNotSold = assignment.property && assignment.property.status !== 'SOLD';
        return clientHasRequest && propertyNotSold;
      });
      
      setAssignments(filtered);
      setFilteredAssignments(filtered);
    } catch (error) {
      toast.error('Error al cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchSoldProperties = async () => {
    setLoading(true);
    try {
      const sold = await getSoldProperties();
      setSoldProperties(sold || []);
    } catch (error) {
      toast.error('Error al cargar las propiedades vendidas');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar la lista filtrada cuando cambia el término de búsqueda
  useEffect(() => {
    if (activeTab === 'pending') {
      if (searchTerm.trim() === '') {
        setFilteredAssignments(assignments);
      } else {
        const term = searchTerm.toLowerCase();
        const filtered = assignments.filter(assignment => {
          const propertyMatch = assignment.property?.address.toLowerCase().includes(term) || false;
          const clientMatch = assignment.client?.name.toLowerCase().includes(term) || false;
          return propertyMatch || clientMatch;
        });
        
        setFilteredAssignments(filtered);
      }
    }
  }, [searchTerm, assignments, activeTab]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleConfirmSale = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setConfirmSaleDialogOpen(true);
  };

  const handleConfirmRevert = (property: SoldProperty) => {
    setSelectedProperty(property);
    setConfirmRevertDialogOpen(true);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchTerm('');
  };

  const processSale = async () => {
    if (!selectedAssignment || !selectedAssignment.clientId || !selectedAssignment.propertyId) return;
    
    setIsSaving(true);
    setProcessingAssignment(selectedAssignment.id);
    
    try {
      // Usar la acción específica para marcar como vendida
      const success = await markPropertyAsSold(
        selectedAssignment.propertyId,
        selectedAssignment.clientId
      );
      
      if (success) {
        // Actualizar la lista local
        const updatedAssignments = assignments.filter(
          a => a.id !== selectedAssignment.id
        );
        
        setAssignments(updatedAssignments);
        setFilteredAssignments(updatedAssignments);
        
        // Mostrar mensaje de éxito
        setSuccessMessage(`¡Venta finalizada con éxito! La propiedad ha sido marcada como vendida.`);
        
        // Cerrar el diálogo
        setConfirmSaleDialogOpen(false);
        
        // Recargar la página después de un breve retraso
        setTimeout(() => {
          setSuccessMessage(null);
          // Cambiar a la pestaña de ventas completadas
          setActiveTab('completed');
          fetchSoldProperties();
        }, 3000);
      } else {
        throw new Error('No se pudo completar la venta');
      }
      
    } catch (error) {
      toast.error('Error al procesar la venta. Por favor, inténtelo de nuevo.');
    } finally {
      setIsSaving(false);
      setProcessingAssignment(null);
    }
  };

  const processRevert = async () => {
    if (!selectedProperty || !selectedProperty.id) return;
    
    setIsSaving(true);
    setProcessingPropertyRevert(selectedProperty.id);
    
    try {
      // Usar la acción específica para revertir la venta
      const success = await revertPropertySale(selectedProperty.id);
      
      if (success) {
        // Actualizar la lista local
        const updatedProperties = soldProperties.filter(
          p => p.id !== selectedProperty.id
        );
        
        setSoldProperties(updatedProperties);
        
        // Mostrar mensaje de éxito
        setSuccessMessage(`¡Venta revertida con éxito! La propiedad ha sido marcada como no vendida.`);
        
        // Cerrar el diálogo
        setConfirmRevertDialogOpen(false);
        
        // Recargar la página después de un breve retraso
        setTimeout(() => {
          setSuccessMessage(null);
          // Refrescar las listas
          fetchSoldProperties();
          fetchPendingAssignments();
        }, 3000);
      } else {
        throw new Error('No se pudo revertir la venta');
      }
      
    } catch (error) {
      toast.error('Error al revertir la venta. Por favor, inténtelo de nuevo.');
    } finally {
      setIsSaving(false);
      setProcessingPropertyRevert(null);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckIcon className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('pending')}
            className={`${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Ventas Pendientes
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className={`${
              activeTab === 'completed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Ventas Completadas
          </button>
        </nav>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'pending' && (
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Buscar por cliente o propiedad..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : activeTab === 'pending' ? (
          // Ventas Pendientes
          filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos pendientes</h3>
              <p className="mt-1 text-sm text-gray-500">
                No hay asignaciones de propiedades a clientes con pedidos pendientes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-primary-50 px-4 py-3 border-b">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-primary-900 truncate">
                        {assignment.client?.name || 'Cliente'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        assignment.type === 'SALE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {assignment.type === 'SALE' ? 'Venta' : 'Alquiler'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Propiedad</h4>
                          <p className="text-sm text-gray-500">{assignment.property?.address || 'Dirección no disponible'}</p>
                          {assignment.property?.population && (
                            <p className="text-sm text-gray-500">{assignment.property.population}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start">
                        <User className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Cliente</h4>
                          <p className="text-sm text-gray-500">{assignment.client?.email || 'Email no disponible'}</p>
                          {assignment.client?.phone && (
                            <p className="text-sm text-gray-500">{assignment.client.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-900">Detalles del encargo</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Precio:</span>
                          <p className="font-medium">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(assignment.price)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Origen:</span>
                          <p className="font-medium">{assignment.origin}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Comisión vendedor:</span>
                          <p className="font-medium">{assignment.sellerFeeValue}{assignment.sellerFeeType === 'percentage' ? '%' : '€'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Comisión comprador:</span>
                          <p className="font-medium">{assignment.buyerFeeValue}{assignment.buyerFeeType === 'percentage' ? '%' : '€'}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Exclusividad hasta:</span>
                          <p className="font-medium">{new Date(assignment.exclusiveUntil).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <button
                        onClick={() => handleConfirmSale(assignment)}
                        disabled={processingAssignment === assignment.id}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {processingAssignment === assignment.id ? (
                          <span className="flex items-center justify-center">
                            <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                            Procesando...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Finalizar venta
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Ventas Completadas
          soldProperties.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas completadas</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se han encontrado propiedades marcadas como vendidas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {soldProperties.map((property) => (
                <div 
                  key={property.id} 
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-green-50 px-4 py-3 border-b">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-green-900 truncate">
                        {property.address}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Vendida
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Propiedad</h4>
                          <p className="text-sm text-gray-500">{property.population || 'Población no disponible'}</p>
                        </div>
                      </div>
                    </div>

                    {property.assignments && property.assignments.length > 0 && property.assignments[0].client && (
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <User className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Cliente</h4>
                            <p className="text-sm text-gray-500">{property.assignments[0].client.name || 'Nombre no disponible'}</p>
                            <p className="text-sm text-gray-500">{property.assignments[0].client.email || 'Email no disponible'}</p>
                            {property.assignments[0].client.phone && (
                              <p className="text-sm text-gray-500">{property.assignments[0].client.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 mt-2 border-t text-xs text-gray-500">
                      <p>Fecha de venta: {new Date(property.updatedAt).toLocaleDateString('es-ES')}</p>
                    </div>

                    <div className="pt-3 border-t">
                      <button
                        onClick={() => handleConfirmRevert(property)}
                        disabled={processingPropertyRevert === property.id}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {processingPropertyRevert === property.id ? (
                          <span className="flex items-center justify-center">
                            <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                            Procesando...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <XMarkIcon className="h-4 w-4 mr-2" />
                            Revertir venta
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal de confirmación de venta */}
      <Dialog
        open={confirmSaleDialogOpen}
        onClose={() => setConfirmSaleDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-lg p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Confirmar finalización de venta
            </Dialog.Title>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Está a punto de finalizar la venta de la propiedad:
              </p>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-900">{selectedAssignment?.property?.address}</p>
                <p className="text-sm text-gray-500">Cliente: {selectedAssignment?.client?.name}</p>
              </div>
              
              <p className="text-sm text-gray-500">
                Esto marcará la propiedad como vendida y completará el pedido del cliente.
                ¿Está seguro de que desea continuar?
              </p>
              
              <div className="mt-4 bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Detalles del encargo:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Precio:</span>
                    <p className="font-medium">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(selectedAssignment?.price || 0)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Origen:</span>
                    <p className="font-medium">{selectedAssignment?.origin}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Comisión vendedor:</span>
                    <p className="font-medium">{selectedAssignment?.sellerFeeValue}{selectedAssignment?.sellerFeeType === 'percentage' ? '%' : '€'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Comisión comprador:</span>
                    <p className="font-medium">{selectedAssignment?.buyerFeeValue}{selectedAssignment?.buyerFeeType === 'percentage' ? '%' : '€'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Exclusividad hasta:</span>
                    <p className="font-medium">{selectedAssignment?.exclusiveUntil ? new Date(selectedAssignment.exclusiveUntil).toLocaleDateString('es-ES') : 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Tipo de encargo:</span>
                    <p className="font-medium">{selectedAssignment?.type === 'SALE' ? 'Venta' : 'Alquiler'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setConfirmSaleDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={processSale}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Procesando...
                  </span>
                ) : (
                  'Confirmar venta'
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de confirmación de reversión de venta */}
      <Dialog
        open={confirmRevertDialogOpen}
        onClose={() => setConfirmRevertDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-lg p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Confirmar reversión de venta
            </Dialog.Title>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Está a punto de revertir la venta de la propiedad:
              </p>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-900">{selectedProperty?.address}</p>
                {selectedProperty?.assignments && selectedProperty.assignments[0]?.client && (
                  <p className="text-sm text-gray-500">Cliente: {selectedProperty.assignments[0].client.name}</p>
                )}
              </div>
              
              <p className="text-sm text-gray-500">
                Esto marcará la propiedad como no vendida y volverá a estar disponible.
                ¿Está seguro de que desea continuar?
              </p>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setConfirmRevertDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={processRevert}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Procesando...
                  </span>
                ) : (
                  'Revertir venta'
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 