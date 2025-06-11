'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Assignment } from '@/types/property';
import { getAssignments } from '../properties/actions';
import { markPropertyAsSold, getSoldProperties, revertPropertySale } from './actions';
import { toast } from 'sonner';

import { 
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
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
  ArrowTopRightOnSquareIcon
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
      id?: string;
      name?: string;
      email?: string;
      phone?: string;
    };
  }>;
}

export default function SalesClientCompact() {
  const router = useRouter();
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
      const assignmentsData = await getAssignments();
      
      // Filtrar asignaciones con propiedades no vendidas
      const filtered = assignmentsData.filter(assignment => {
        const propertyNotSold = !assignment.property?.isSold;
        return propertyNotSold && assignment.client && assignment.property;
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

  const navigateToProperty = (propertyId: string) => {
    try {
      if (propertyId) {
        router.push(`/dashboard/properties/${propertyId}`);
      } else {
        toast.error('ID de propiedad no válido');
      }
    } catch (error) {
      toast.error('Error al navegar a la propiedad');
      console.error('Navigation error:', error);
    }
  };

  const navigateToClient = (clientId: string) => {
    try {
      if (clientId) {
        router.push(`/dashboard/clients/${clientId}`);
      } else {
        toast.error('ID de cliente no válido');
      }
    } catch (error) {
      toast.error('Error al navegar al cliente');
      console.error('Navigation error:', error);
    }
  };

  const processSale = async () => {
    if (!selectedAssignment || !selectedAssignment.clientId || !selectedAssignment.propertyId) return;
    
    setIsSaving(true);
    setProcessingAssignment(selectedAssignment.id);
    
    try {
      const success = await markPropertyAsSold(
        selectedAssignment.propertyId,
        selectedAssignment.clientId
      );
      
      if (success) {
        const updatedAssignments = assignments.filter(
          a => a.id !== selectedAssignment.id
        );
        
        setAssignments(updatedAssignments);
        setFilteredAssignments(updatedAssignments);
        
        setSuccessMessage(`¡Venta finalizada con éxito! La propiedad ha sido marcada como vendida.`);
        setConfirmSaleDialogOpen(false);
        
        setTimeout(() => {
          setSuccessMessage(null);
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
      const success = await revertPropertySale(selectedProperty.id);
      
      if (success) {
        const updatedProperties = soldProperties.filter(
          p => p.id !== selectedProperty.id
        );
        
        setSoldProperties(updatedProperties);
        setSuccessMessage(`¡Venta revertida con éxito! La propiedad ha sido marcada como no vendida.`);
        setConfirmRevertDialogOpen(false);
        
        setTimeout(() => {
          setSuccessMessage(null);
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
      {/* Success Message with Enhanced Design */}
      {successMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-green-500 rounded-full p-2">
                <CheckIcon className="h-5 w-5 text-white" />
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <nav className="flex">
            <button
              onClick={() => handleTabChange('pending')}
              className={`${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              } flex-1 py-3 px-4 text-center font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
            >
              <Clock className="h-4 w-4" />
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
              } flex-1 py-3 px-4 text-center font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
            >
              <CheckIcon className="h-4 w-4" />
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
        <div className="p-6">
          {activeTab === 'pending' && (
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  placeholder="🔍 Buscar por cliente, propiedad o precio..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-20 animate-pulse"></div>
              </div>
              <p className="text-gray-600 text-base font-medium mt-3">Cargando ventas...</p>
            </div>
          ) : activeTab === 'pending' ? (
            // Compact Pending Sales
            filteredAssignments.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                  <BuildingOfficeIcon className="h-10 w-10 text-white mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No hay ventas pendientes</h3>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  No hay encargos de propiedades listos para finalizar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAssignments.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:border-blue-300"
                  >
                    {/* Compact Card Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <UserIcon className="h-4 w-4 flex-shrink-0" />
                          <h3 className="text-sm font-bold truncate">
                            {assignment.client?.name || 'Cliente'}
                          </h3>
                        </div>
                        <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                          {assignment.type === 'SALE' ? '💰' : '🏠'}
                        </span>
                      </div>
                    </div>

                    {/* Compact Card Content */}
                    <div className="p-4 space-y-3">
                      {/* Property Information - Clickable */}
                      <div 
                        className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-blue-100 transition-colors group/property"
                        onClick={() => assignment.propertyId && navigateToProperty(assignment.propertyId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 min-w-0 flex-1">
                            <HomeIcon className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-600 mb-1">Propiedad</p>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {assignment.property?.address || 'Dirección no disponible'}
                              </p>
                              {assignment.property?.population && (
                                <div className="flex items-center mt-1 text-xs text-gray-600">
                                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{assignment.property.population}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-blue-500 opacity-0 group-hover/property:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </div>

                      {/* Client Information - Clickable */}
                      <div 
                        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors group/client"
                        onClick={() => assignment.clientId && navigateToClient(assignment.clientId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 min-w-0 flex-1">
                            <User className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-600 mb-1">Cliente</p>
                              
                              {/* Nombre del Cliente - Prominente */}
                              <div className="bg-white rounded p-2 border border-green-300 mb-2">
                                <p className="font-bold text-gray-900 text-sm truncate">
                                  {assignment.client?.name || 'Nombre no disponible'}
                                </p>
                              </div>

                              {/* Información de contacto compacta */}
                              <div className="space-y-1">
                                {assignment.client?.email && (
                                  <div className="flex items-center text-xs text-gray-600">
                                    <Mail className="h-3 w-3 mr-1 text-green-500 flex-shrink-0" />
                                    <span className="font-medium truncate">{assignment.client.email}</span>
                                  </div>
                                )}
                                {assignment.client?.phone && (
                                  <div className="flex items-center text-xs text-gray-600">
                                    <Phone className="h-3 w-3 mr-1 text-green-500 flex-shrink-0" />
                                    <span className="font-medium">{assignment.client.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-green-500 opacity-0 group-hover/client:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </div>

                      {/* Financial Details - Compact */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <CurrencyEuroIcon className="h-4 w-4 text-yellow-600" />
                          <span className="text-xs font-medium text-gray-700">Precio</span>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(assignment.price)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Origen: {assignment.origin || 'N/A'}</p>
                      </div>

                      {/* Action Button - Compact */}
                      <button
                        onClick={() => handleConfirmSale(assignment)}
                        disabled={processingAssignment === assignment.id}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2.5 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2 text-sm"
                      >
                        {processingAssignment === assignment.id ? (
                          <div className="flex items-center space-x-2">
                            <ArrowPathIcon className="animate-spin h-4 w-4" />
                            <span>Procesando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <CheckIcon className="h-4 w-4" />
                            <span>Finalizar Venta</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Compact Completed Sales
            soldProperties.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-green-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                  <CheckIcon className="h-10 w-10 text-white mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No hay ventas completadas</h3>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  No se han encontrado propiedades marcadas como vendidas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {soldProperties.map((property) => (
                  <div 
                    key={property.id} 
                    className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-green-200"
                  >
                    {/* Compact Card Header */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-white">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <HomeIcon className="h-4 w-4 flex-shrink-0" />
                          <h3 className="text-sm font-bold truncate">
                            {property.address}
                          </h3>
                        </div>
                        <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-medium">
                          ✅
                        </span>
                      </div>
                    </div>

                    {/* Compact Card Content */}
                    <div className="p-4 space-y-3">
                      {/* Location - Clickable */}
                      <div 
                        className="bg-gradient-to-r from-gray-50 to-green-50 rounded-lg p-3 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors group/property"
                        onClick={() => navigateToProperty(property.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-600">Ubicación</p>
                              <p className="text-sm font-medium text-gray-900 truncate">{property.population}</p>
                            </div>
                          </div>
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-green-500 opacity-0 group-hover/property:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </div>

                      {/* Client - Clickable */}
                      {property.assignments && property.assignments[0]?.client && (
                        <div 
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors group/client"
                          onClick={() => property.assignments[0]?.client?.id && navigateToClient(property.assignments[0].client.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 min-w-0 flex-1">
                              <User className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-600 mb-1">Cliente</p>
                                
                                {/* Nombre del Cliente - Prominente */}
                                <div className="bg-white rounded p-2 border border-blue-300 mb-2">
                                  <p className="font-bold text-gray-900 text-sm truncate">
                                    {property.assignments[0].client.name || 'Nombre no disponible'}
                                  </p>
                                </div>

                                {/* Información de contacto compacta */}
                                <div className="space-y-1">
                                  {property.assignments[0].client.email && (
                                    <div className="flex items-center text-xs text-gray-600">
                                      <Mail className="h-3 w-3 mr-1 text-blue-500 flex-shrink-0" />
                                      <span className="font-medium truncate">{property.assignments[0].client.email}</span>
                                    </div>
                                  )}
                                  {property.assignments[0].client.phone && (
                                    <div className="flex items-center text-xs text-gray-600">
                                      <Phone className="h-3 w-3 mr-1 text-blue-500 flex-shrink-0" />
                                      <span className="font-medium">{property.assignments[0].client.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-blue-500 opacity-0 group-hover/client:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        </div>
                      )}

                      {/* Sale Date */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-yellow-600" />
                          <span className="text-xs font-medium text-gray-700">Fecha de venta</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{new Date(property.updatedAt).toLocaleDateString('es-ES')}</p>
                      </div>

                      {/* Revert Button - Compact */}
                      <button
                        onClick={() => handleConfirmRevert(property)}
                        disabled={processingPropertyRevert === property.id}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2.5 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2 text-sm"
                      >
                        {processingPropertyRevert === property.id ? (
                          <div className="flex items-center space-x-2">
                            <ArrowPathIcon className="animate-spin h-4 w-4" />
                            <span>Procesando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <XMarkIcon className="h-4 w-4" />
                            <span>Revertir Venta</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Enhanced Sale Confirmation Modal */}
      <Dialog
        open={confirmSaleDialogOpen}
        onClose={() => setConfirmSaleDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full p-3">
                <CheckIcon className="h-6 w-6 text-white" />
              </div>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Confirmar Finalización de Venta
              </Dialog.Title>
            </div>
            
            <div className="space-y-6">
              <p className="text-gray-600">
                Está a punto de finalizar la venta de la siguiente propiedad:
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="space-y-4">
                  {/* Propiedad */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <HomeIcon className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Propiedad</h4>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-300">
                      <p className="font-medium text-gray-800">{selectedAssignment?.property?.address}</p>
                    </div>
                  </div>
                  
                  {/* Cliente - Prominente */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <UserIcon className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Cliente Comprador</h4>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-300">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Cliente</span>
                      </div>
                      <p className="font-bold text-gray-900 text-lg">
                        {selectedAssignment?.client?.name || 'Nombre no disponible'}
                      </p>
                      {selectedAssignment?.client?.email && (
                        <p className="text-sm text-gray-600 mt-1 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {selectedAssignment.client.email}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                    <div className="bg-white rounded-lg p-3 border">
                      <span className="text-sm text-gray-500 block mb-1">Precio de Venta:</span>
                      <p className="font-bold text-green-600 text-lg">
                        {selectedAssignment?.price 
                          ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(selectedAssignment.price)
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <span className="text-sm text-gray-500 block mb-1">Tipo de Operación:</span>
                      <p className="font-semibold text-gray-800">{selectedAssignment?.type === 'SALE' ? '💰 Venta' : '🏠 Alquiler'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Esta acción marcará la propiedad como vendida y completará el encargo. 
                  ¿Está seguro de que desea continuar?
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setConfirmSaleDialogOpen(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={processSale}
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border border-transparent rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Confirmar Venta</span>
                  </>
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Enhanced Revert Confirmation Modal */}
      <Dialog
        open={confirmRevertDialogOpen}
        onClose={() => setConfirmRevertDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-full p-3">
                <XMarkIcon className="h-6 w-6 text-white" />
              </div>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Revertir Venta
              </Dialog.Title>
            </div>
            
            <div className="space-y-6">
              <p className="text-gray-600">
                Está a punto de revertir la venta de la siguiente propiedad:
              </p>
              
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <HomeIcon className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-gray-900">Propiedad</h4>
                  </div>
                  <p className="font-medium text-gray-800">{selectedProperty?.address}</p>
                  {selectedProperty?.assignments && selectedProperty.assignments[0]?.client && (
                    <>
                      <div className="flex items-center space-x-2 mt-3">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Cliente</h4>
                      </div>
                      <p className="font-medium text-gray-800">{selectedProperty.assignments[0].client.name}</p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Advertencia:</strong> Esto marcará la propiedad como no vendida y volverá a estar disponible.
                  ¿Está seguro de que desea continuar?
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setConfirmRevertDialogOpen(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={processRevert}
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-transparent rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <XMarkIcon className="h-4 w-4" />
                    <span>Confirmar Reversión</span>
                  </>
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
