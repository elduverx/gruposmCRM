'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getProperties, deleteProperty } from './actions';
import { Property } from '@/types/property';
import { CheckIcon } from '@heroicons/react/24/solid';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getProperties();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleDeleteProperty = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este inmueble?')) {
      setIsDeleting(id);
      try {
        await deleteProperty(id);
        setProperties(properties.filter(property => property.id !== id));
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Error al eliminar el inmueble');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROCESS':
        return 'bg-blue-100 text-blue-800';
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'SOLD':
        return 'bg-red-100 text-red-800';
      case 'RENTED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'SALE':
        return 'bg-indigo-100 text-indigo-800';
      case 'RENT':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'HOUSE':
        return 'bg-teal-100 text-teal-800';
      case 'APARTMENT':
        return 'bg-cyan-100 text-cyan-800';
      case 'COMMERCIAL':
        return 'bg-orange-100 text-orange-800';
      case 'LAND':
        return 'bg-lime-100 text-lime-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: string | null) => {
    if (!price) return 'No especificado';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(price));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Cargando...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Inmuebles</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Añadir inmueble
          </Link>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Población</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Zona</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dirección</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ocupado por</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Último contacto</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Localizado</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Propietario</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Teléfono</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Responsable</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Editar</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {properties.map((property) => (
                    <tr key={property.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.population}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.zone?.name || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.address}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.occupiedBy || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {property.lastContact ? (
                          <span title={`Último contacto: ${new Date(property.lastContact).toLocaleDateString()}`}>
                            {new Date(property.lastContact).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        {property.isLocated ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                            <CheckIcon className="h-4 w-4 text-green-600" />
                          </span>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300">
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.ownerName}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.ownerPhone}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{property.responsible || '-'}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/dashboard/properties/${property.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                          <span className="sr-only">Editar {property.address}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 