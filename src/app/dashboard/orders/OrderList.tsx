'use client';

import { useState, useEffect } from 'react';
import { Order, OrderCreateInput } from '@/types/order';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatNumber, formatDate } from '@/lib/utils';
import { Dialog } from '@headlessui/react';
import { toast } from 'sonner';
import { deleteOrder, createOrder, updateOrder } from './actions';
import OrderForm from '@/components/orders/OrderForm';
import { Client } from '@/types/client';
import { Property } from '@/types/property';
import SearchBar from '@/components/common/SearchBar';

interface OrderListProps {
  orders: Order[];
  clients: Client[];
  properties: Property[];
}

export default function OrderList({ orders = [], clients = [], properties = [] }: OrderListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Filtrar pedidos cuando cambia el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStatusText(order.status).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getOperationTypeText(order.operationType).toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatNumber(order.minPrice).includes(searchTerm) ||
        formatNumber(order.maxPrice).includes(searchTerm)
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsFormOpen(true);
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
            placeholder="Buscar pedidos por cliente, estado, operación o rango de precio..." 
            onSearch={setSearchTerm}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rango de Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.client.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.operationType === 'SALE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {getOperationTypeText(order.operationType)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(order.minPrice)} - {formatNumber(order.maxPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isDeleting}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
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
              clients={clients}
              properties={properties}
              onSubmit={handleFormSubmit} 
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedOrder(null);
              }}
            />
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 