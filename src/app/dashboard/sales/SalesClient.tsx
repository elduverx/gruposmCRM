'use client';

import { useState, useEffect } from 'react';
import { Assignment } from '@/types/property';
import { getAssignments } from '../properties/actions';
import { markPropertyAsSold, getSoldProperties, revertPropertySale } from './actions';
import { toast } from 'sonner';

import { 
  User,
  MapPin,
  Phone,
  Mail,
  Euro,
  Calendar,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';
import { 
  CheckIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  CurrencyEuroIcon,
  UserIcon,
  HomeIcon,
  DocumentTextIcon,
  StarIcon
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
      
      console.log('Total assignments:', assignmentsData.length);
      console.log('Sample assignment:', assignmentsData[0]);
      
      // Filtrar asignaciones con propiedades no vendidas
      // Removemos el filtro restrictivo de hasRequest para mostrar más ventas
      const filtered = assignmentsData.filter(assignment => {
        // Solo verificar que la propiedad no esté vendida
        const propertyNotSold = !assignment.property?.isSold;
        
        console.log(`Assignment ${assignment.id}:`, {
          propertyNotSold,
          propertyStatus: assignment.property?.status,
          propertyIsSold: assignment.property?.isSold,
          clientHasRequest: assignment.client?.hasRequest
        });
        
        return propertyNotSold && assignment.client && assignment.property;
      });
      
      console.log('Filtered assignments:', filtered.length);
      
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
    <div className="space-y-8">
      {/* Success Message with Enhanced Design */}
      {successMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 mb-8 rounded-lg shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-green-500 rounded-full p-2">
                <CheckIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-green-800">¡Operación exitosa!</h3>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <nav className="flex">
            <button
              onClick={() => handleTabChange('pending')}
              className={`${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              } flex-1 py-4 px-6 text-center font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
            >
              <Clock className="h-5 w-5" />
              <span>Ventas Pendientes</span>
              {assignments.length > 0 && (
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full ml-2">
                  {assignments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('completed')}
              className={`${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              } flex-1 py-4 px-6 text-center font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
            >
              <CheckIcon className="h-5 w-5" />
              <span>Ventas Completadas</span>
              {soldProperties.length > 0 && (
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full ml-2">
                  {soldProperties.length}
                </span>
              )}
            </button>
          </nav>
        </div>
        
        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'pending' && (
            <div className="mb-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  placeholder="🔍 Buscar por cliente, propiedad o precio..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-20 animate-pulse"></div>
              </div>
              <p className="text-gray-600 text-lg font-medium mt-4">Cargando ventas...</p>
              <p className="text-gray-500 text-sm mt-2">Obteniendo información actualizada</p>
            </div>
          ) : activeTab === 'pending' ? (
            // Enhanced Pending Sales
            filteredAssignments.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 w-20 h-20 mx-auto mb-6">
                  <BuildingOfficeIcon className="h-12 w-12 text-white mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No hay ventas pendientes</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  No hay encargos de propiedades listos para finalizar. 
                </p>
                <div className="text-sm text-gray-500">
                  <p>• Verifica que existan encargos activos</p>
                  <p>• Asegúrate de que las propiedades no estén ya vendidas</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredAssignments.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <UserIcon className="h-5 w-5" />
                            <h3 className="text-lg font-bold truncate">
                              {assignment.client?.name || 'Cliente'}
                            </h3>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                            assignment.type === 'SALE' 
                              ? 'bg-white/20 text-white' 
                              : 'bg-green-500/20 text-green-100'
                          }`}>
                            {assignment.type === 'SALE' ? '💰 Venta' : '🏠 Alquiler'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-6">
                      {/* Property Information */}
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-500 rounded-lg p-2">
                            <HomeIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Propiedad</h4>
                            <p className="text-sm text-gray-700 font-medium">{assignment.property?.address || 'Dirección no disponible'}</p>
                            {assignment.property?.population && (
                              <div className="flex items-center mt-1 text-xs text-gray-600">
                                <MapPin className="h-3 w-3 mr-1" />
                                {assignment.property.population}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Client Information */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-start space-x-3">
                          <div className="bg-green-500 rounded-lg p-2">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Información del Cliente</h4>
                            {assignment.client?.email && (
                              <div className="flex items-center text-xs text-gray-600 mb-1">
                                <Mail className="h-3 w-3 mr-2" />
                                {assignment.client.email || 'Sin correo'}
                              </div>
                            )}
                            {assignment.client?.phone && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Phone className="h-3 w-3 mr-2" />
                                {assignment.client.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Financial Details */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="bg-yellow-500 rounded-lg p-2">
                            <CurrencyEuroIcon className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900">Detalles Financieros</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-white rounded-lg p-3 border">
                            <span className="text-gray-500 block mb-1">Precio</span>
                            <p className="font-bold text-gray-900 text-sm">
                              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(assignment.price)}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <span className="text-gray-500 block mb-1">Origen</span>
                            <p className="font-medium text-gray-800 text-sm truncate">{assignment.origin || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-yellow-200">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-gray-500 block mb-1">Com. Vendedor</span>
                              <p className="font-medium text-gray-800">
                                {assignment.sellerFeeValue 
                                  ? `${parseFloat(assignment.sellerFeeValue.toString()).toFixed(2)}${assignment.sellerFeeType === 'PERCENTAGE' ? '%' : '€'}`
                                  : 'No definido'
                                }
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">Com. Comprador</span>
                              <p className="font-medium text-gray-800">
                                {assignment.buyerFeeValue 
                                  ? `${parseFloat(assignment.buyerFeeValue.toString()).toFixed(2)}${assignment.buyerFeeType === 'PERCENTAGE' ? '%' : '€'}`
                                  : 'No definido'
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-yellow-200">
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="h-3 w-3 mr-2" />
                            <span>Exclusividad hasta: {new Date(assignment.exclusiveUntil).toLocaleDateString('es-ES')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4">
                        <button
                          onClick={() => handleConfirmSale(assignment)}
                          disabled={processingAssignment === assignment.id}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
                        >
                          {processingAssignment === assignment.id ? (
                            <div className="flex items-center space-x-2">
                              <ArrowPathIcon className="animate-spin h-5 w-5" />
                              <span>Procesando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <CheckIcon className="h-5 w-5" />
                              <span>Finalizar Venta</span>
                              <StarIcon className="h-4 w-4" />
                            </div>
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
          ))}
        </div>
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
                    <p className="font-medium">
                      {selectedAssignment?.sellerFeeValue 
                        ? `${parseFloat(selectedAssignment.sellerFeeValue.toString()).toFixed(2)}${selectedAssignment.sellerFeeType === 'PERCENTAGE' ? '%' : '€'}`
                        : 'No definido'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Comisión comprador:</span>
                    <p className="font-medium">
                      {selectedAssignment?.buyerFeeValue 
                        ? `${parseFloat(selectedAssignment.buyerFeeValue.toString()).toFixed(2)}${selectedAssignment.buyerFeeType === 'PERCENTAGE' ? '%' : '€'}`
                        : 'No definido'
                      }
                    </p>
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
