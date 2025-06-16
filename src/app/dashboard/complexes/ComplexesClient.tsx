'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Building, MapPin, Edit, Trash2, Home, ChevronDown, ChevronUp, X, Eye, Building2, Users } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { toast } from 'sonner';
import { Complex, ComplexCreateInput } from '@/types/complex';
import { Building as BuildingType } from '@/types/building';
import ComplexForm from '@/components/ComplexForm';
import { getComplexes, createComplex, updateComplex, deleteComplex, assignBuildingToComplex } from './actions';
import { getBuildings } from '../buildings/actions';

export default function ComplexesClient() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [availableBuildings, setAvailableBuildings] = useState<BuildingType[]>([]);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [buildingSearchTerm, setBuildingSearchTerm] = useState('');
  const [isAssigningBuildings, setIsAssigningBuildings] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingComplex, setEditingComplex] = useState<Complex | null>(null);
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [isAssignBuildingsOpen, setIsAssignBuildingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedComplexes, setExpandedComplexes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [complexesData, buildingsData] = await Promise.all([
        getComplexes(),
        getBuildings()
      ]);
      setComplexes(complexesData);
      setBuildings(buildingsData);
    } catch (error) {
      toast.error('Error al cargar los datos');
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: ComplexCreateInput) => {
    try {
      const newComplex = await createComplex(data);
      setComplexes(prev => [newComplex, ...prev]);
      setIsCreateDialogOpen(false);
      toast.success('Complejo creado exitosamente');
    } catch (error) {
      toast.error('Error al crear el complejo');
      console.error('Error creating complex:', error);
    }
  };

  const handleEdit = async (data: ComplexCreateInput) => {
    if (!editingComplex) return;
    
    try {
      const updatedComplex = await updateComplex(editingComplex.id, data);
      setComplexes(prev => prev.map(complex => 
        complex.id === editingComplex.id ? updatedComplex : complex
      ));
      setEditingComplex(null);
      toast.success('Complejo actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar el complejo');
      console.error('Error updating complex:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este complejo?')) {
      return;
    }

    try {
      await deleteComplex(id);
      setComplexes(prev => prev.filter(complex => complex.id !== id));
      toast.success('Complejo eliminado exitosamente');
    } catch (error) {
      toast.error('Error al eliminar el complejo');
      console.error('Error deleting complex:', error);
    }
  };

  const toggleComplexExpansion = (complexId: string) => {
    setExpandedComplexes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(complexId)) {
        newSet.delete(complexId);
      } else {
        newSet.add(complexId);
      }
      return newSet;
    });
  };

  const loadAvailableBuildings = async () => {
    try {
      const buildingsData = await getBuildings();
      // Filtrar edificios que no tienen complexId asignado
      const unassignedBuildings = buildingsData.filter(building => !building.complexId);
      setAvailableBuildings(unassignedBuildings);
    } catch (error) {
      toast.error('Error al cargar edificios disponibles');
      console.error('Error loading available buildings:', error);
    }
  };

  const handleAssignBuildings = async () => {
    if (!selectedComplex || selectedBuildings.length === 0) return;

    try {
      setIsAssigningBuildings(true);
      
      // Asignar cada edificio seleccionado al complejo
      await Promise.all(
        selectedBuildings.map(buildingId => 
          assignBuildingToComplex(buildingId, selectedComplex.id)
        )
      );

      // Recargar datos
      await loadData();
      setIsAssignBuildingsOpen(false);
      setSelectedBuildings([]);
      toast.success(`${selectedBuildings.length} edificio(s) asignado(s) al complejo exitosamente`);
    } catch (error) {
      toast.error('Error al asignar edificios');
      console.error('Error assigning buildings:', error);
    } finally {
      setIsAssigningBuildings(false);
    }
  };

  const openAssignBuildings = (complex: Complex) => {
    setSelectedComplex(complex);
    loadAvailableBuildings();
    setIsAssignBuildingsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Complejos</h1>
            <p className="text-muted-foreground">
              Gestiona los complejos inmobiliarios de tu sistema
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header mejorado */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building className="text-white text-2xl h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Gestión de Complejos
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Administra y organiza los complejos inmobiliarios de tu sistema</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 py-4 text-lg"
            >
              <Plus className="mr-3 h-6 w-6" />
              Nuevo Complejo
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {complexes.length === 0 ? (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-purple-100 rounded-3xl blur-3xl opacity-50"></div>
          <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
                <Building className="relative h-20 w-20 text-gray-400 mb-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No hay complejos registrados
              </h3>
              <p className="text-gray-600 text-center mb-8 max-w-md text-lg leading-relaxed">
                Comienza creando tu primer complejo para organizar y gestionar tus edificios de manera eficiente
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 py-4"
              >
                <Plus className="mr-3 h-6 w-6" />
                Crear Primer Complejo
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {complexes.map((complex) => (
            <Card 
              key={complex.id} 
              className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden hover:-translate-y-3 hover:scale-[1.03] hover:rotate-1"
              onClick={() => setSelectedComplex(complex)}
            >
              {/* Header de la tarjeta */}
              <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-800 text-white p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <Building className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold leading-tight group-hover:scale-105 transition-transform duration-300">
                          {complex.name}
                        </CardTitle>
                        <p className="text-purple-100 text-sm mt-1">{complex.population}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingComplex(complex)}
                        className="text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(complex.id)}
                        className="text-white hover:bg-red-500/20 transition-all duration-200 p-2 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {complex.description && (
                    <p className="text-purple-100 text-sm leading-relaxed line-clamp-2">
                      {complex.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Contenido de la tarjeta */}
              <CardContent className="p-6 space-y-4">
                {/* Dirección */}
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <MapPin className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{complex.address}</span>
                </div>

                {/* Estadísticas en grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold text-purple-800">
                          {complex.totalBuildings || '-'}
                        </div>
                        <div className="text-xs text-purple-600 font-medium">Edificios</div>
                      </div>
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl border border-pink-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold text-pink-800">
                          {complex.buildings?.length || 0}
                        </div>
                        <div className="text-xs text-pink-600 font-medium">Registrados</div>
                      </div>
                      <Building className="h-5 w-5 text-pink-600" />
                    </div>
                  </div>
                </div>

                {/* Estado de edificios */}
                {complex.buildings && complex.buildings.length > 0 ? (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Building className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <span className="font-bold text-emerald-800 text-lg">{complex.buildings.length}</span>
                          <span className="text-emerald-600 text-sm ml-1">
                            {complex.buildings.length === 1 ? 'edificio' : 'edificios'}
                          </span>
                        </div>
                      </div>
                      <Eye className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-200 rounded-lg">
                        <Building className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="text-gray-600 text-sm font-medium">Sin edificios asignados</span>
                    </div>
                  </div>
                )}

                {/* Footer con fecha */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Creado: {new Date(complex.createdAt).toLocaleDateString('es-ES')}</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Activo</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear complejo */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" aria-hidden="true" />
        <div className="fixed inset-0 lg:left-64 flex items-center justify-center p-2 lg:p-4 z-50">
          <Dialog.Panel className="mx-auto max-w-4xl bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-h-[90vh] overflow-y-auto">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
              <div className="relative flex items-center justify-between">
                <Dialog.Title className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  🏢 Crear Nuevo Complejo
                </Dialog.Title>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>
            <ComplexForm 
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog para editar complejo */}
      <Dialog open={!!editingComplex} onClose={() => setEditingComplex(null)}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" aria-hidden="true" />
        <div className="fixed inset-0 lg:left-64 flex items-center justify-center p-2 lg:p-4 z-50">
          <Dialog.Panel className="mx-auto max-w-4xl bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-h-[90vh] overflow-y-auto">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
              <div className="relative flex items-center justify-between">
                <Dialog.Title className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ✏️ Editar Complejo
                </Dialog.Title>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingComplex(null)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>
            {editingComplex && (
              <ComplexForm 
                initialData={editingComplex}
                onSubmit={handleEdit}
                onCancel={() => setEditingComplex(null)}
              />
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog para detalles del complejo */}
      <Dialog open={!!selectedComplex} onClose={() => setSelectedComplex(null)}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" aria-hidden="true" />
        <div className="fixed inset-0 lg:left-64 flex items-center justify-center p-2 lg:p-4 z-50">
          <Dialog.Panel className="mx-auto max-w-6xl bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-h-[90vh] overflow-y-auto">
            {selectedComplex && (
              <div className="space-y-8">
                {/* Header del modal */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Building className="text-white h-8 w-8" />
                      </div>
                      <div>
                        <Dialog.Title className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {selectedComplex.name}
                        </Dialog.Title>
                        <p className="text-gray-600 text-lg">{selectedComplex.population}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedComplex(null)}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {/* Información del complejo */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Información básica */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/20 rounded-2xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-purple-800">📍 Información del Complejo</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl">
                          <MapPin className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-800">Dirección</p>
                            <p className="text-gray-600">{selectedComplex.address}</p>
                          </div>
                        </div>
                        {selectedComplex.description && (
                          <div className="p-4 bg-purple-50 rounded-xl">
                            <p className="font-medium text-gray-800 mb-2">Descripción</p>
                            <p className="text-gray-600 leading-relaxed">{selectedComplex.description}</p>
                          </div>
                        )}
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <div>
                            <p className="font-medium text-gray-800">Estado</p>
                            <p className="text-green-600">Activo</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Lista de edificios */}
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/20 rounded-2xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-purple-800 flex items-center justify-between">
                          🏢 Edificios del Complejo
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {selectedComplex.buildings?.length || 0} edificios
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedComplex.buildings && selectedComplex.buildings.length > 0 ? (
                          <div className="space-y-3">
                            {selectedComplex.buildings.map((building: BuildingType) => (
                              <div key={building.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                    <Building className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">{building.name}</p>
                                    <p className="text-sm text-gray-600">{building.address}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-purple-600">{building.properties?.length || 0} propiedades</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">No hay edificios asignados</p>
                            <p className="text-gray-400 text-sm mt-2">Los edificios se pueden asignar al complejo desde la gestión de edificios</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Estadísticas */}
                  <div className="space-y-6">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/20 rounded-2xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-purple-800">📊 Estadísticas</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-purple-800">
                                {selectedComplex.buildings?.length || 0}
                              </div>
                              <div className="text-purple-600 font-medium">Edificios</div>
                            </div>
                            <Building2 className="h-8 w-8 text-purple-600" />
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-pink-800">
                                {selectedComplex.buildings?.reduce((total, building) => total + (building.properties?.length || 0), 0) || 0}
                              </div>
                              <div className="text-pink-600 font-medium">Propiedades</div>
                            </div>
                            <Home className="h-8 w-8 text-pink-600" />
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-emerald-800">
                                {new Date(selectedComplex.createdAt).getFullYear()}
                              </div>
                              <div className="text-emerald-600 font-medium">Año creación</div>
                            </div>
                            <Users className="h-8 w-8 text-emerald-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Acciones */}
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/20 rounded-2xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-purple-800">⚡ Acciones</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          onClick={() => openAssignBuildings(selectedComplex)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          Asignar Edificios
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedComplex(null);
                            setEditingComplex(selectedComplex);
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar Complejo
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedComplex(null);
                            handleDelete(selectedComplex.id);
                          }}
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300 rounded-xl"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Complejo
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog para asignar edificios */}
      <Dialog open={isAssignBuildingsOpen} onClose={() => setIsAssignBuildingsOpen(false)}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" aria-hidden="true" />
        <div className="fixed inset-0 lg:left-64 flex items-center justify-center p-2 lg:p-4 z-50">
          <Dialog.Panel className="mx-auto max-w-4xl bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-h-[90vh] overflow-y-auto">
            {selectedComplex && (
              <div className="space-y-6">
                {/* Header del modal */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Building2 className="text-white h-6 w-6" />
                      </div>
                      <div>
                        <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          🏢 Asignar Edificios
                        </Dialog.Title>
                        <p className="text-gray-600">Complejo: {selectedComplex.name}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAssignBuildingsOpen(false)}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {/* Buscador */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="🔍 Buscar edificios por nombre, dirección o población..."
                    value={buildingSearchTerm}
                    onChange={(e) => setBuildingSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent shadow-sm transition-all duration-300"
                  />
                </div>

                {/* Lista de edificios disponibles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      📋 Edificios Disponibles
                    </h3>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {availableBuildings.filter(building =>
                        building.name.toLowerCase().includes(buildingSearchTerm.toLowerCase()) ||
                        building.address.toLowerCase().includes(buildingSearchTerm.toLowerCase()) ||
                        building.population.toLowerCase().includes(buildingSearchTerm.toLowerCase())
                      ).length} edificios
                    </Badge>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3 bg-white/50 rounded-xl p-4 border border-purple-100">
                    {availableBuildings.length === 0 ? (
                      <div className="text-center py-12">
                        <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No hay edificios disponibles</p>
                        <p className="text-gray-400 text-sm mt-2">Todos los edificios ya están asignados a complejos</p>
                      </div>
                    ) : (
                      availableBuildings
                        .filter(building =>
                          building.name.toLowerCase().includes(buildingSearchTerm.toLowerCase()) ||
                          building.address.toLowerCase().includes(buildingSearchTerm.toLowerCase()) ||
                          building.population.toLowerCase().includes(buildingSearchTerm.toLowerCase())
                        )
                        .map(building => (
                          <div
                            key={building.id}
                            className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                              selectedBuildings.includes(building.id)
                                ? 'bg-purple-50 border-purple-300 shadow-md'
                                : 'bg-white border-gray-200 hover:bg-purple-50/50 hover:border-purple-200'
                            }`}
                            onClick={() => {
                              setSelectedBuildings(prev => 
                                prev.includes(building.id)
                                  ? prev.filter(id => id !== building.id)
                                  : [...prev, building.id]
                              );
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={selectedBuildings.includes(building.id)}
                                    onChange={() => {}}
                                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                  <Building className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-lg font-semibold text-gray-900 truncate">
                                    {building.name}
                                  </p>
                                  <p className="text-sm text-gray-600 truncate">
                                    📍 {building.address}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {building.population}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-purple-600">
                                  {building.properties?.length || 0} propiedades
                                </p>
                                {building.totalFloors && (
                                  <p className="text-xs text-gray-500">
                                    {building.totalFloors} plantas
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Resumen de selección */}
                {selectedBuildings.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {selectedBuildings.length} edificio(s) seleccionado(s)
                          </p>
                          <p className="text-sm text-gray-600">
                            Se asignarán al complejo &ldquo;{selectedComplex.name}&rdquo;
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setSelectedBuildings([])}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setIsAssignBuildingsOpen(false)}
                    className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAssignBuildings}
                    disabled={selectedBuildings.length === 0 || isAssigningBuildings}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAssigningBuildings ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Asignando...
                      </>
                    ) : (
                      <>
                        <Building2 className="mr-2 h-4 w-4" />
                        Asignar {selectedBuildings.length} Edificio(s)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}