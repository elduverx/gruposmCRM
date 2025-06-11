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
  const [isPropertySelectorOpen, setIsPropertySelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este encargo?')) {
      const success = await deleteAssignment(id);
      if (success) {
        const updatedAssignments = assignments.filter(a => a.id !== id);
        setAssignments(updatedAssignments);
        setFilteredAssignments(updatedAssignments);
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
      setProperties(propertiesData.properties);
      setIsPropertySelectorOpen(true);
    } catch (error) {
      // eslint-disable-next-line no-console
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
    if (term.trim() === '') {
      setFilteredAssignments(assignments);
    } else {
      const filtered = assignments.filter(assignment => {
        return (
          (assignment.property?.address || '').toLowerCase().includes(term.toLowerCase()) ||
          (assignment.property?.population || '').toLowerCase().includes(term.toLowerCase()) ||
          assignment.type.toLowerCase().includes(term.toLowerCase()) ||
          (assignment.origin || '').toLowerCase().includes(term.toLowerCase())
        );
      });
      setFilteredAssignments(filtered);
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl shadow-lg">
            <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
              📋 Gestión de Encargos
            </h2>
            <p className="text-slate-600">
              {filteredAssignments.length} encargo{filteredAssignments.length !== 1 ? 's' : ''} 
              {filteredAssignments.length !== assignments.length && ` de ${assignments.length} total`}
            </p>
          </div>
        </div>
        <button
          onClick={handleNewAssignment}
          disabled={isLoading}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
        >
          <ClipboardDocumentListIcon className="h-5 w-5" />
          <span>{isLoading ? 'Cargando...' : '🆕 Nuevo Encargo'}</span>
        </button>
      </div>

      {/* Enhanced Search Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <SearchBar 
              placeholder="🔍 Buscar encargos por propiedad, cliente, tipo o origen..." 
              onSearch={handleSearch}
            />
          </div>
          {filteredAssignments.length !== assignments.length && (
            <div className="bg-blue-100 px-4 py-2 rounded-xl border border-blue-200">
              <span className="text-blue-700 font-medium text-sm">
                📊 {filteredAssignments.length} resultados encontrados
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-red-500 opacity-20 animate-pulse"></div>
            </div>
            <p className="text-slate-700 text-lg font-medium">📋 Cargando encargos...</p>
            <p className="text-slate-500 text-sm mt-2">Obteniendo información de propiedades</p>
          </div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="text-6xl mb-6">📋</div>
          <h3 className="text-xl font-bold text-slate-700 mb-3">
            {assignments.length === 0 ? 'No hay encargos disponibles' : 'No se encontraron encargos'}
          </h3>
          <p className="text-slate-500 mb-6">
            {assignments.length === 0 
              ? 'Comienza creando tu primer encargo de propiedad' 
              : 'Prueba con otros términos de búsqueda'}
          </p>
          {assignments.length === 0 && (
            <button
              onClick={handleNewAssignment}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
            >
              🆕 Crear primer encargo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <div 
              key={assignment.id} 
              className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b border-orange-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link 
                      href={`/dashboard/properties/${assignment.propertyId}`}
                      className="group/link"
                    >
                      <h3 className="font-bold text-lg text-slate-800 font-audiowide group-hover/link:text-orange-700 transition-colors line-clamp-2">
                        🏠 {assignment.property?.address || 'Dirección no disponible'}
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">
                        📍 {assignment.property?.population || 'Ubicación no especificada'}
                      </p>
                    </Link>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleEdit(assignment)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 hover:text-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      title="Editar encargo"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:text-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      title="Eliminar encargo"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                {/* Client Information */}
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">👤 Cliente</p>
                    <p className="font-semibold text-slate-800">
                      {assignment.client?.name || 'Cliente no encontrado'}
                    </p>
                  </div>
                </div>

                {/* Type and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-2">🏷️ Tipo</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                      assignment.type === 'SALE' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                        : assignment.type === 'RENT'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                    }`}>
                      {assignment.type === 'SALE' ? '💰 Venta' :
                       assignment.type === 'RENT' ? '🏠 Alquiler' :
                       assignment.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-2">💶 Precio</p>
                    <p className="font-bold text-slate-800">
                      {new Intl.NumberFormat('es-ES', { 
                        style: 'currency', 
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(assignment.price)}
                    </p>
                  </div>
                </div>

                {/* Origin and Dates */}
                <div className="space-y-3">
                  {assignment.origin && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">📞 Origen</p>
                      <p className="text-slate-800">{assignment.origin}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">📅 Fecha inicio:</span>
                      <span className="font-medium text-slate-800">
                        {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString('es-ES') : '-'}
                      </span>
                    </div>
                    {assignment.exclusiveUntil && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">🔒 Exclusividad:</span>
                        <span className="font-medium text-slate-800">
                          {new Date(assignment.exclusiveUntil).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Commission Information */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-medium mb-3">💼 Comisiones</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">🏪 Vendedor:</span>
                      <p className="font-semibold text-slate-800">
                        {assignment.sellerFeeValue 
                          ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(assignment.sellerFeeValue)
                          : 'No definido'
                        }
                      </p>
                      {assignment.sellerFeeValue && assignment.sellerFeeType === 'PERCENTAGE' && assignment.price > 0 && (
                        <p className="text-xs text-slate-500">({((assignment.sellerFeeValue / assignment.price) * 100).toFixed(1)}%)</p>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-600">👤 Comprador:</span>
                      <p className="font-semibold text-slate-800">
                        {assignment.buyerFeeValue 
                          ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(assignment.buyerFeeValue)
                          : 'No definido'
                        }
                      </p>
                      {assignment.buyerFeeValue && assignment.buyerFeeType === 'PERCENTAGE' && assignment.price > 0 && (
                        <p className="text-xs text-slate-500">({((assignment.buyerFeeValue / assignment.price) * 100).toFixed(1)}%)</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-gradient-to-r from-slate-50 to-orange-50 px-6 py-4 border-t border-slate-200">
                <Link 
                  href={`/dashboard/properties/${assignment.propertyId}`}
                  className="text-orange-600 hover:text-orange-800 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Ver detalles de la propiedad</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Assignment Modal */}
      <Dialog
        open={isAssignmentFormOpen}
        onClose={() => {
          setIsAssignmentFormOpen(false);
          setSelectedAssignment(null);
          setSelectedPropertyId('');
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-[90%] bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-xl shadow-lg">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
                </div>
                <Dialog.Title className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                  {selectedAssignment ? '✏️ Editar Encargo' : '🆕 Nuevo Encargo'}
                </Dialog.Title>
              </div>
              <button
                onClick={() => {
                  setIsAssignmentFormOpen(false);
                  setSelectedAssignment(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
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

      {/* Enhanced Property Selector Modal */}
      <Dialog
        open={isPropertySelectorOpen}
        onClose={() => setIsPropertySelectorOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <Dialog.Title className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                  🏠 Seleccionar Propiedad
                </Dialog.Title>
              </div>
              <button
                onClick={() => setIsPropertySelectorOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {properties.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl">
                  <div className="text-6xl mb-4">🏠</div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay propiedades disponibles</h3>
                  <p className="text-slate-500">Agrega propiedades al sistema para crear encargos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => handlePropertySelect(property.id)}
                      className="group text-left p-4 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-800 font-audiowide group-hover:text-blue-800 transition-colors">
                            {property.address}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">📍 {property.population}</p>
                          {property.type && (
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {property.type}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
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