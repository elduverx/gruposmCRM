'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/types/client';
import { getClients, createClient, updateClient, deleteClient } from './actions';
import ClientForm from './components/ClientForm';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import SearchBar from './components/SearchBar';
import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    // Filtrar clientes cuando cambia el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await getClients();
      if (data) {
        setClients(data);
        setFilteredClients(data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.error('Error deleting client:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header modernizado */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">👥</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Gestión de Clientes
                </h1>
                <p className="text-gray-600 mt-1">Administra la información de tus clientes</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setIsFormOpen(true);
                }}
                className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 rounded-xl blur opacity-60 group-hover:opacity-80 transition-opacity"></span>
                <span className="relative flex items-center">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nuevo Cliente
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda modernizada */}
      <div className="mb-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-sm group-focus-within:blur-md transition-all duration-300"></div>
          <div className="relative">
            <SearchBar 
              placeholder="🔍 Buscar clientes por nombre, email, teléfono o dirección..." 
              onSearch={setSearchTerm}
            />
          </div>
        </div>
        {searchTerm && (
          <div className="mt-3 px-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              📊 {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Cargando...</span>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Cargando clientes...</p>
          </div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-3xl blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-12 text-center">
            <div className="flex flex-col items-center">
              <span className="text-6xl mb-4">📭</span>
              <p className="text-gray-500 text-lg font-medium">No se encontraron clientes.</p>
              {searchTerm && (
                <p className="text-gray-400 text-sm mt-2">Intenta con otros términos de búsqueda</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50">
                <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="mr-2">👤</span>
                        Nombre
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="mr-2">📧</span>
                        Email
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="mr-2">📱</span>
                        Teléfono
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="mr-2">📍</span>
                        Dirección
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center justify-end">
                        <span className="mr-2">⚙️</span>
                        Acciones
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/50">
                  {filteredClients.map((client, index) => (
                    <tr key={client.id} className="group hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link 
                          href={`/dashboard/clients/${client.id}`} 
                          className="group flex items-center space-x-3 text-purple-600 hover:text-purple-900 transition-colors duration-200"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                            <span className="text-white font-bold text-sm">{client.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="font-medium">{client.name}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">📧</span>
                          {client.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">📱</span>
                          {client.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">📍</span>
                          <span className="truncate max-w-xs">{client.address || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="group relative p-2 rounded-lg text-purple-600 hover:text-white transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-600 hover:shadow-lg"
                            title="Editar cliente"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="group relative p-2 rounded-lg text-red-600 hover:text-white transition-all duration-200 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:shadow-lg"
                            title="Eliminar cliente"
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
          </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-sm"></div>
            <Dialog.Panel className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {selectedClient ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
                </Dialog.Title>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setSelectedClient(null);
                  }}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
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
        </div>
      </Dialog>
    </div>
  );
} 