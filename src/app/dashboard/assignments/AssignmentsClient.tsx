'use client';

import { useState } from 'react';
import { Assignment } from '@/types/property';
import { ClipboardDocumentListIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { AssignmentForm } from '../properties/AssignmentForm';
import Link from 'next/link';
import { deleteAssignment } from '../properties/actions';

interface AssignmentsClientProps {
  initialAssignments: Assignment[];
}

export default function AssignmentsClient({ initialAssignments }: AssignmentsClientProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

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
    setIsAssignmentFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsAssignmentFormOpen(false);
    setSelectedAssignment(null);
    // Recargar la página para obtener los datos actualizados
    window.location.reload();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Encargos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de todos los encargos y tareas pendientes.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedAssignment(null);
              setIsAssignmentFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Agregar Encargo
          </button>
        </div>
      </div>
      
      {assignments.length === 0 ? (
        <div className="text-center mt-16">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay encargos</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza agregando un nuevo encargo al sistema.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                        Propiedad
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Cliente
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Tipo
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Precio
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Fecha límite
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          <Link href={`/dashboard/properties/${assignment.propertyId}`} className="hover:text-indigo-600">
                            {assignment.property?.address || 'Sin dirección'}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {assignment.client?.name || 'Sin cliente'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {assignment.type === 'SALE' ? 'Venta' : 'Alquiler'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {assignment.price.toLocaleString()} €
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(assignment.exclusiveUntil).toLocaleDateString('es-ES')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(assignment)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(assignment.id)}
                              className="text-red-600 hover:text-red-900"
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
        </div>
      )}

      {/* Modal de Encargos */}
      <Dialog
        open={isAssignmentFormOpen}
        onClose={() => {
          setIsAssignmentFormOpen(false);
          setSelectedAssignment(null);
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
                propertyId={selectedAssignment?.propertyId || ''}
                initialData={selectedAssignment}
                onSuccess={handleFormSuccess}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 