'use client';

import { useState, useEffect } from 'react';
import { Assignment } from '@/types/property';
import { ClipboardDocumentListIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { AssignmentForm } from '../properties/AssignmentForm';
import Link from 'next/link';
import { deleteAssignment } from '../properties/actions';
import { Property } from '@/types/property';
import { getProperties } from '../properties/actions';
import SearchBar from '@/components/common/SearchBar';

interface AssignmentsClientProps {
  initialAssignments: Assignment[];
}

export default function AssignmentsClient({ initialAssignments }: AssignmentsClientProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>(initialAssignments);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isPropertySelectorOpen, setIsPropertySelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const propertiesData = await getProperties();
        setProperties(propertiesData);
      } catch (error) {
        console.error('Error loading properties:', error);
      }
    };
    loadProperties();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este encargo?')) {
      const success = await deleteAssignment(id);
      if (success) {
        setAssignments(assignments.filter(a => a.id !== id));
      }
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSelectedPropertyId(assignment.propertyId);
    setIsAssignmentFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsAssignmentFormOpen(false);
    setSelectedAssignment(null);
    setSelectedPropertyId('');
    // Recargar la página para obtener los datos actualizados
    window.location.reload();
  };

  const handleNewAssignment = async () => {
    setIsLoading(true);
    try {
      const propertiesData = await getProperties();
      setProperties(propertiesData);
      setIsPropertySelectorOpen(true);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setIsPropertySelectorOpen(false);
    setIsAssignmentFormOpen(true);
  };

  // Filtrar encargos cuando cambia el término de búsqueda
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredAssignments(assignments);
    } else {
      const filtered = assignments.filter(assignment => {
        const property = properties.find(p => p.id === assignment.propertyId);
        return (
          property?.address.toLowerCase().includes(term.toLowerCase()) ||
          property?.population.toLowerCase().includes(term.toLowerCase()) ||
          assignment.type.toLowerCase().includes(term.toLowerCase()) ||
          assignment.origin?.toLowerCase().includes(term.toLowerCase())
        );
      });
      setFilteredAssignments(filtered);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Encargos</h1>
        <button
          onClick={handleNewAssignment}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center"
        >
          <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
          Nuevo Encargo
        </button>
      </div>

      <div className="mb-6">
        <SearchBar 
          placeholder="Buscar encargos por título, dirección, estado o notas..." 
          onSearch={handleSearch}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Cargando...</span>
          </div>
          <p className="mt-2 text-gray-600">Cargando encargos...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No se encontraron encargos.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propiedad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de inicio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de fin
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => {
                const property = properties.find(p => p.id === assignment.propertyId);
                return (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link href={`/dashboard/properties/${assignment.propertyId}`} className="text-primary-600 hover:text-primary-900">
                        {property?.address || 'Propiedad no encontrada'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        assignment.type === 'SALE' ? 'bg-blue-100 text-blue-800' :
                        assignment.type === 'RENT' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.type === 'SALE' ? 'Venta' :
                         assignment.type === 'RENT' ? 'Alquiler' :
                         assignment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.exclusiveUntil ? new Date(assignment.exclusiveUntil).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(assignment)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Encargos */}
      <Dialog
        open={isAssignmentFormOpen}
        onClose={() => {
          setIsAssignmentFormOpen(false);
          setSelectedAssignment(null);
          setSelectedPropertyId('');
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <Dialog.Title className="text-lg font-medium">
                {selectedAssignment ? 'Editar Encargo' : 'Nuevo Encargo'}
              </Dialog.Title>
              <button
                onClick={() => {
                  setIsAssignmentFormOpen(false);
                  setSelectedAssignment(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <AssignmentForm 
                propertyId={selectedPropertyId || selectedAssignment?.propertyId || ''}
                initialData={selectedAssignment}
                onSuccess={handleFormSuccess}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de Selección de Propiedad */}
      <Dialog
        open={isPropertySelectorOpen}
        onClose={() => setIsPropertySelectorOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <Dialog.Title className="text-lg font-medium">
                Seleccionar Propiedad
              </Dialog.Title>
              <button
                onClick={() => setIsPropertySelectorOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {properties.length === 0 ? (
                <p className="text-center text-gray-500">No hay propiedades disponibles</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {properties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => handlePropertySelect(property.id)}
                      className="text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="font-medium">{property.address}</h3>
                      <p className="text-sm text-gray-500">{property.population}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 