'use client';

import { useState, useEffect } from 'react';
import { Order, OrderCreateInput } from '@/types/order';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatNumber, formatDate } from '@/lib/utils';
import { Dialog } from '@headlessui/react';
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
        order.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      if (selectedOrder) {
        const result = await updateOrder(selectedOrder.id, formData);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Pedido actualizado correctamente');
        }
      } else {
        const result = await createOrder(formData);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Pedido creado correctamente');
        }
      }
      setIsFormOpen(false);
      setSelectedOrder(null);
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
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Lista de Pedidos</h2>
            <button
              onClick={handleAddOrder}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuevo Pedido
            </button>
          </div>
          <div className="mb-4">
            <SearchBar 
              placeholder="Buscar pedidos por cliente, estado, tipo de propiedad, operación o precio..." 
              onSearch={setSearchTerm}
            />
          </div>
        </div>
        
        <div className="p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'No se encontraron pedidos' : 'No hay pedidos'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Intenta cambiar los términos de búsqueda.' : 'Comienza creando un nuevo pedido.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={handleAddOrder}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuevo Pedido
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Lista de Pedidos</h2>
          <button
            onClick={handleAddOrder}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Pedido
          </button>
        </div>
        <div className="mb-4">
          <SearchBar 
            placeholder="Buscar pedidos por cliente, estado, tipo de propiedad, operación o precio..." 
            onSearch={setSearchTerm}
          />
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              onClick={() => handleViewOrder(order)}
              className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1 cursor-pointer"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="bg-white/20 rounded-full p-1">
                        {getOperationIcon(order.operationType)}
                      </div>
                      <h3 className="text-lg font-bold truncate">
                        {order.client.name}
                      </h3>
                    </div>
                    <p className="text-sm text-blue-100 truncate">
                      {order.client.email}
                    </p>
                    <span
                      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full mt-2 ${
                        order.operationType === 'SALE'
                          ? 'bg-white/20 text-white' 
                          : 'bg-green-500/20 text-green-100'
                      }`}
                    >
                      {getOperationTypeText(order.operationType)}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                {/* Property Details */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-500 rounded-lg p-2">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Características</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Tipo:</span>
                          <p className="font-medium text-gray-800">{getPropertyTypeText(order.propertyType)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Habitaciones:</span>
                          <p className="font-medium text-gray-800">{order.bedrooms}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Baños:</span>
                          <p className="font-medium text-gray-800">{order.bathrooms}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Características:</span>
                          <p className="font-medium text-gray-800">{order.features.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Range */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-yellow-500 rounded-lg p-2">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Rango de Precio</h4>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {formatNumber(order.minPrice)}€ - {formatNumber(order.maxPrice)}€
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Presupuesto del cliente
                    </p>
                  </div>
                </div>

                {/* Date and Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    <p>Fecha: {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewOrder(order);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                      title="Ver detalles del pedido"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditOrder(order);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                      title="Editar pedido"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrder(order.id);
                      }}
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                      disabled={isDeleting}
                      title="Eliminar pedido"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Order Details Modal */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setOrderDetails(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl rounded-lg bg-white p-6 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Detalles del Pedido
              </Dialog.Title>
              <button
                onClick={() => {
                  setIsDetailsOpen(false);
                  setOrderDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {orderDetails && (
              <div className="space-y-6">
                {/* Client Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-6 w-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    Información del Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nombre</label>
                      <p className="text-lg text-gray-900">{orderDetails.client.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-lg text-gray-900">{orderDetails.client.email}</p>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-6 w-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    Información del Pedido
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Estado</label>
                      <span
                        className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full mt-1 ${
                          orderDetails.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : orderDetails.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {getStatusText(orderDetails.status)}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tipo de Operación</label>
                      <p className="text-lg text-gray-900">{getOperationTypeText(orderDetails.operationType)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Fecha de Creación</label>
                      <p className="text-lg text-gray-900">{formatDate(orderDetails.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Property Requirements */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-6 w-6 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                    </svg>
                    Requisitos de la Propiedad
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tipo de Propiedad</label>
                      <p className="text-lg text-gray-900">{getPropertyTypeText(orderDetails.propertyType)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Habitaciones</label>
                      <p className="text-lg text-gray-900">{orderDetails.bedrooms}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Baños</label>
                      <p className="text-lg text-gray-900">{orderDetails.bathrooms}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Presupuesto</label>
                      <p className="text-lg text-gray-900">
                        {formatNumber(orderDetails.minPrice)}€ - {formatNumber(orderDetails.maxPrice)}€
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {orderDetails.features.length > 0 && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="h-6 w-6 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                      Características Deseadas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {orderDetails.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleEditOrder(orderDetails);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Editar Pedido
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Order Form Modal */}
      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedOrder(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl rounded bg-white p-6 w-full">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {selectedOrder ? 'Editar Pedido' : 'Nuevo Pedido'}
            </Dialog.Title>
            
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
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 