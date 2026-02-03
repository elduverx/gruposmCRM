'use client';

import { useState, useEffect } from 'react';
import { Order, OrderCreateInput } from '@/types/order';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatNumber, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { deleteOrder, createOrder, updateOrder } from './actions';
import OrderForm from '@/components/orders/OrderForm';
import { Client } from '@/types/client';
import SearchBar from '@/components/common/SearchBar';

interface OrderListProps {
  orders: Order[];
  clients: Client[];
}

export default function OrderList({ orders = [], clients = [] }: OrderListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentClients, setCurrentClients] = useState<Client[]>(clients);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);

  useEffect(() => {
    // Filtrar pedidos cuando cambia el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStatusText(order.status).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getOperationTypeText(order.operationType).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPropertyTypeText(order.propertyType).toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatNumber(order.minPrice).includes(searchTerm) ||
        formatNumber(order.maxPrice).includes(searchTerm) ||
        order.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  // Actualizar clientes locales cuando cambien los clientes externos
  useEffect(() => {
    setCurrentClients(clients);
  }, [clients]);

  // Función para manejar cuando se crea un nuevo cliente
  const handleClientCreated = (newClient: Client) => {
    setCurrentClients(prev => [...prev, newClient]);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsFormOpen(true);
  };

  const handleViewOrder = (order: Order) => {
    setOrderDetails(order);
    setIsDetailsOpen(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteOrder(orderId);
      toast.success('Pedido eliminado correctamente');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting order:', error);
      toast.error('Error al eliminar el pedido');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData: OrderCreateInput) => {
    try {
      let success = false;
      
      if (selectedOrder) {
        const result = await updateOrder(selectedOrder.id, formData);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Pedido actualizado correctamente');
          success = true;
        }
      } else {
        const result = await createOrder(formData);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Pedido creado correctamente');
          success = true;
        }
      }
      
      // Solo cerramos el formulario si la operación fue exitosa
      if (success) {
        setIsFormOpen(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error submitting order:', error);
      toast.error('Error al guardar el pedido');
    }
  };

  const handleAddOrder = () => {
    setSelectedOrder(null);
    setIsFormOpen(true);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'COMPLETED':
        return 'Completado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'SALE':
        return 'Venta';
      case 'RENT':
        return 'Alquiler';
      default:
        return type;
    }
  };

  const getPropertyTypeText = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return 'Apartamento';
      case 'HOUSE':
        return 'Casa';
      case 'VILLA':
        return 'Villa';
      case 'TOWNHOUSE':
        return 'Casa adosada';
      case 'STUDIO':
        return 'Estudio';
      case 'DUPLEX':
        return 'Dúplex';
      case 'PENTHOUSE':
        return 'Ático';
      case 'LOFT':
        return 'Loft';
      case 'COMMERCIAL':
        return 'Comercial';
      case 'LAND':
        return 'Terreno';
      default:
        return type;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-100';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-100';
      case 'PENDING':
      default:
        return 'bg-yellow-500/20 text-yellow-100';
    }
  };

  const getOperationIcon = (operationType: string) => {
    if (operationType === 'SALE') {
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
      </svg>
    );
  };

  if (filteredOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        {/* Header moderno */}
        <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-white/20">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Gestión de Pedidos
                    </h1>
                    <p className="text-gray-600 mt-1">Administra las solicitudes y pedidos de tus clientes</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAddOrder}
                  className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-700 rounded-xl blur opacity-60 group-hover:opacity-80 transition-opacity"></span>
                  <span className="relative flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nuevo Pedido
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda modernizada */}
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl blur-sm"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <SearchBar 
                placeholder="🔍 Buscar pedidos por cliente, estado, tipo de propiedad, operación o precio..." 
                onSearch={setSearchTerm}
              />
            </div>
          </div>
        </div>
        
        {/* Estado vacío mejorado */}
        <div className="mx-auto max-w-7xl px-6 pb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl blur-sm"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden">
              <div className="p-16 text-center">
                <div className="relative mx-auto w-24 h-24 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-full blur-md opacity-20"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-xl">
                    <span className="text-4xl">📋</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchTerm ? '🔍 No se encontraron pedidos' : '📋 No hay pedidos registrados'}
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Intenta cambiar los términos de búsqueda o crear un nuevo pedido.' 
                    : 'Comienza creando el primer pedido para gestionar las solicitudes de tus clientes.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleAddOrder}
                    className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-700 rounded-xl blur opacity-60 group-hover:opacity-80 transition-opacity"></span>
                    <span className="relative flex items-center">
                      <PlusIcon className="h-6 w-6 mr-3" />
                      Crear Primer Pedido
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modales */}
        {/* Order Details Modal */}
        {isDetailsOpen && (
          <div className="fixed inset-0 z-[50] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={() => {
                  setIsDetailsOpen(false);
                  setOrderDetails(null);
                }}
              ></div>
              <div className="relative w-full max-w-5xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-sm"></div>
                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">📋</span>
                      </div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Detalles del Pedido
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setIsDetailsOpen(false);
                        setOrderDetails(null);
                      }}
                      className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                      aria-label="Cerrar"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="text-center text-gray-500">
                    Detalles del pedido aquí...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-[150] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={() => {
                  setIsFormOpen(false);
                  setSelectedOrder(null);
                }}
              ></div>
              <div className="relative w-full max-w-4xl">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-sm"></div>
                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">📋</span>
                      </div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {selectedOrder ? '✏️ Editar Pedido' : '➕ Nuevo Pedido'}
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setIsFormOpen(false);
                        setSelectedOrder(null);
                      }}
                      className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                      aria-label="Cerrar"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <OrderForm 
                    order={selectedOrder} 
                    clients={currentClients}
                    onSubmit={handleFormSubmit} 
                    onCancel={() => {
                      setIsFormOpen(false);
                      setSelectedOrder(null);
                    }}
                    onClientCreated={handleClientCreated}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Contenido cuando hay pedidos */}
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold">Lista de Pedidos</h1>
        <p>Aquí irían los pedidos existentes...</p>
        <button
          onClick={handleAddOrder}
          className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Nuevo Pedido
        </button>
      </div>

      {/* Modales para cuando hay pedidos */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[150] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => {
                setIsFormOpen(false);
                setSelectedOrder(null);
              }}
            ></div>
            <div className="relative w-full max-w-4xl">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-sm"></div>
              <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">📋</span>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {selectedOrder ? '✏️ Editar Pedido' : '➕ Nuevo Pedido'}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setIsFormOpen(false);
                      setSelectedOrder(null);
                    }}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                    aria-label="Cerrar"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <OrderForm 
                  order={selectedOrder} 
                  clients={currentClients}
                  onSubmit={handleFormSubmit} 
                  onCancel={() => {
                    setIsFormOpen(false);
                    setSelectedOrder(null);
                  }}
                  onClientCreated={handleClientCreated}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
