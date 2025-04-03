'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/types/client';
import { getClients, createClient, updateClient, deleteClient } from './actions';
import ClientForm from '@/components/ClientForm';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await getClients();
      if (data) {
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'properties'> & { relatedProperties: string[] }) => {
    try {
      if (selectedClient) {
        await updateClient(selectedClient.id, formData);
      } else {
        await createClient(formData);
      }
      await fetchClients();
      setIsFormOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;
    
    setIsDeleting(true);
    try {
      await deleteClient(clientId);
      await fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
        <button
          onClick={() => {
            setSelectedClient(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : clients.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {clients.map((client) => (
              <li key={client.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {client.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Email: {client.email}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Teléfono: {client.phone || 'N/A'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Dirección: {client.address || 'N/A'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Inmuebles relacionados: {client.properties.length}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Estado del pedido: {client.hasRequest ? 'Tiene pedido' : 'Sin pedido'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleEdit(client)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay clientes registrados
        </div>
      )}

      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedClient(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              {selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </Dialog.Title>
            
            <ClientForm
              initialData={selectedClient ? {
                ...selectedClient,
                properties: selectedClient.properties.map(p => p.id)
              } : undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedClient(null);
              }}
            />
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 