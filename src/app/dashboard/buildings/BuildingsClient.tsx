'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Building2, MapPin, Users, Edit, Trash2, Home, Eye, X, Phone, User } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { toast } from 'sonner';
import { Building, BuildingCreateInput } from '@/types/building';
import { Complex } from '@/types/complex';
import { Property, PropertyCreateInput } from '@/types/property';
import BuildingForm from '@/components/BuildingForm';
import { getBuildings, createBuilding, updateBuilding, deleteBuilding } from './actions';
import { getComplexes } from '../complexes/actions';
import { getProperties, updateProperty } from '../properties/actions';
import { getZones } from '../zones/actions';

export default function BuildingsClient() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [propertySearchTerm, setPropertySearchTerm] = useState('');
  const [isAssigningProperties, setIsAssigningProperties] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isAssignPropertiesOpen, setIsAssignPropertiesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [buildingsData, complexesData, zonesData] = await Promise.all([
        getBuildings(),
        getComplexes(),
        getZones()
      ]);
      setBuildings(buildingsData);
      setComplexes(complexesData);
      setZones(zonesData);
    } catch (error) {
      toast.error('Error al cargar los datos');
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableProperties = async () => {
    try {
      const { properties } = await getProperties(1, 1000); // Obtener todas las propiedades
      // Filtrar propiedades que no tienen buildingId asignado
      const unassignedProperties = properties.filter(property => !property.buildingId);
      setAvailableProperties(unassignedProperties);
    } catch (error) {
      toast.error('Error al cargar propiedades disponibles');
      console.error('Error loading available properties:', error);
    }
  };

  const handleCreate = async (data: BuildingCreateInput) => {
    try {
      const newBuilding = await createBuilding(data);
      setBuildings(prev => [newBuilding, ...prev]);
      setIsCreateDialogOpen(false);
      toast.success('Edificio creado exitosamente');
    } catch (error) {
      toast.error('Error al crear el edificio');
      console.error('Error creating building:', error);
    }
  };

  const handleEdit = async (data: BuildingCreateInput) => {
    if (!editingBuilding) return;
    
    try {
      const updatedBuilding = await updateBuilding(editingBuilding.id, data);
      setBuildings(prev => prev.map(building => 
        building.id === editingBuilding.id ? updatedBuilding : building
      ));
      setEditingBuilding(null);
      toast.success('Edificio actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar el edificio');
      console.error('Error updating building:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este edificio?')) {
      return;
    }

    try {
      await deleteBuilding(id);
      setBuildings(prev => prev.filter(building => building.id !== id));
      toast.success('Edificio eliminado exitosamente');
    } catch (error) {
      toast.error('Error al eliminar el edificio');
      console.error('Error deleting building:', error);
    }
  };

  const handleAssignProperties = async () => {
    if (!selectedBuilding || selectedProperties.length === 0) return;
    
    try {
      setIsAssigningProperties(true);
      // Asignar cada propiedad seleccionada al edificio
      await Promise.all(
        selectedProperties.map(propertyId =>
          updateProperty(propertyId, { buildingId: selectedBuilding.id })
        )
      );
      
      // Recargar los datos para mostrar las propiedades asignadas
      await loadData();
      await loadAvailableProperties();
      
      setIsAssignPropertiesOpen(false);
      setSelectedProperties([]);
      setPropertySearchTerm('');
      toast.success(`${selectedProperties.length} propiedad(es) asignada(s) al edificio exitosamente`);
    } catch (error) {
      toast.error('Error al asignar propiedades');
      console.error('Error assigning properties:', error);
    } finally {
      setIsAssigningProperties(false);
    }
  };

  const handleOpenAssignProperties = (building: Building) => {
    setSelectedBuilding(building);
    setSelectedProperties([]);
    setPropertySearchTerm('');
    loadAvailableProperties();
    setIsAssignPropertiesOpen(true);
  };

  // Filter properties based on search term
  const filteredAvailableProperties = availableProperties.filter(property =>
    property.address.toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
    property.population?.toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
    property.ownerName?.toLowerCase().includes(propertySearchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edificios</h1>
            <p className="text-muted-foreground">
              Gestiona los edificios de tu sistema inmobiliario
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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="text-white text-2xl h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gestión de Edificios
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Administra y organiza los edificios de tu sistema inmobiliario</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 py-4 text-lg"
            >
              <Plus className="mr-3 h-6 w-6" />
              Nuevo Edificio
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {buildings.length === 0 ? (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-blue-100 rounded-3xl blur-3xl opacity-50"></div>
          <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                <Building2 className="relative h-20 w-20 text-gray-400 mb-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No hay edificios registrados
              </h3>
              <p className="text-gray-600 text-center mb-8 max-w-md text-lg leading-relaxed">
                Comienza creando tu primer edificio para organizar y gestionar tus propiedades de manera eficiente
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 py-4"
              >
                <Plus className="mr-3 h-6 w-6" />
                Crear Primer Edificio
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {buildings.map((building) => (
            <Card 
              key={building.id} 
              className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden hover:-translate-y-3 hover:scale-[1.03] hover:rotate-1"
              onClick={() => setSelectedBuilding(building)}
            >
              {/* Header de la tarjeta */}
              <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold leading-tight group-hover:scale-105 transition-transform duration-300">
                          {building.name}
                        </CardTitle>
                        <p className="text-blue-100 text-sm mt-1">{building.population}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingBuilding(building)}
                        className="text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(building.id)}
                        className="text-white hover:bg-red-500/20 transition-all duration-200 p-2 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {building.description && (
                    <p className="text-blue-100 text-sm leading-relaxed line-clamp-2">
                      {building.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Contenido de la tarjeta */}
              <CardContent className="p-6 space-y-4">
                {/* Dirección */}
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{building.address}</span>
                </div>

                {/* Complejo si existe */}
                {building.complex && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <span className="text-sm font-medium text-purple-700">Complejo:</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                      {building.complex.name}
                    </Badge>
                  </div>
                )}

                {/* Estadísticas en grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold text-blue-800">
                          {building.totalFloors || '-'}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">Pisos</div>
                      </div>
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold text-green-800">
                          {building.totalUnits || 0}
                        </div>
                        <div className="text-xs text-green-600 font-medium">Unidades</div>
                      </div>
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Estado de propiedades */}
                {building.properties && building.properties.length > 0 ? (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Home className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <span className="font-bold text-emerald-800 text-lg">{building.properties.length}</span>
                          <span className="text-emerald-600 text-sm ml-1">
                            {building.properties.length === 1 ? 'propiedad' : 'propiedades'}
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
                        <Home className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="text-gray-600 text-sm font-medium">Sin propiedades asignadas</span>
                    </div>
                  </div>
                )}

                {/* Footer con fecha */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Creado: {new Date(building.createdAt).toLocaleDateString('es-ES')}</span>
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

      {/* Dialog para crear edificio */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <div className="fixed inset-0 bg-black/30 z-40" aria-hidden="true" />
        <div className="fixed inset-0 lg:left-64 flex items-center justify-center p-2 lg:p-4 z-50">
          <Dialog.Panel className="mx-auto max-w-4xl rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20 p-6 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🏢 Crear Nuevo Edificio
              </Dialog.Title>
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <BuildingForm 
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
              complexes={complexes}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog para editar edificio */}
      <Dialog open={!!editingBuilding} onClose={() => setEditingBuilding(null)}>
        <div className="fixed inset-0 bg-black/30 z-40" aria-hidden="true" />
        <div className="fixed inset-0 lg:left-64 flex items-center justify-center p-2 lg:p-4 z-50">
          <Dialog.Panel className="mx-auto max-w-4xl rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20 p-6 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                ✏️ Editar Edificio
              </Dialog.Title>
              <button
                onClick={() => setEditingBuilding(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {editingBuilding && (
              <BuildingForm 
                initialData={editingBuilding}
                onSubmit={handleEdit}
                onCancel={() => setEditingBuilding(null)}
                complexes={complexes}
              />
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog para ver detalles del edificio */}
      <Dialog open={!!selectedBuilding} onClose={() => setSelectedBuilding(null)}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" aria-hidden="true" />
        <div className="fixed inset-0 lg:left-64 flex items-center justify-center p-2 lg:p-4 z-50">
          <Dialog.Panel className="mx-auto max-w-6xl rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20 w-full max-h-[95vh] overflow-hidden">
            {selectedBuilding && (
              <>
                {/* Header del modal mejorado */}
                <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
                  {/* Patrón de fondo decorativo */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-300 rounded-full blur-2xl"></div>
                  </div>
                  
                  <div className="relative p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Building2 className="h-10 w-10" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold mb-2">{selectedBuilding.name}</h1>
                          <div className="flex items-center space-x-4 text-blue-100">
                            <div className="flex items-center">
                              <MapPin className="h-5 w-5 mr-2" />
                              <span className="text-lg">{selectedBuilding.address}</span>
                            </div>
                            <div className="text-lg">•</div>
                            <span className="text-lg">{selectedBuilding.population}</span>
                          </div>
                          <div className="mt-3 flex items-center space-x-4">
                            {selectedBuilding.complex && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-blue-200">Complejo:</span>
                                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                                  {selectedBuilding.complex.name}
                                </Badge>
                              </div>
                            )}
                            <div className="text-sm text-blue-200">
                              Creado: {new Date(selectedBuilding.createdAt).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBuilding(null)}
                        className="text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-xl"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Estadísticas mejoradas */}
                <div className="p-8 bg-gradient-to-r from-gray-50 to-blue-50/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            {selectedBuilding.totalFloors || '-'}
                          </div>
                          <div className="text-sm font-medium text-gray-600 mt-1">Pisos Totales</div>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-800 bg-clip-text text-transparent">
                            {selectedBuilding.totalUnits || 0}
                          </div>
                          <div className="text-sm font-medium text-gray-600 mt-1">Unidades</div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-800 bg-clip-text text-transparent">
                            {selectedBuilding.properties?.length || 0}
                          </div>
                          <div className="text-sm font-medium text-gray-600 mt-1">Propiedades</div>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Home className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedBuilding.description && (
                    <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="p-2 bg-gray-100 rounded-lg mr-3">
                          📋
                        </span>
                        Descripción
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-base">{selectedBuilding.description}</p>
                    </div>
                  )}
                </div>

                {/* Lista de propiedades mejorada */}
                <div className="p-8 bg-white overflow-y-auto max-h-[60vh]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                        <Home className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Propiedades</h2>
                        <p className="text-gray-600">Administra las propiedades de este edificio</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {selectedBuilding.properties && selectedBuilding.properties.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                            <Home className="h-4 w-4 mr-1" />
                            {selectedBuilding.properties.length} {selectedBuilding.properties.length === 1 ? 'propiedad' : 'propiedades'}
                          </Badge>
                        </div>
                      )}
                      <Button
                        onClick={() => handleOpenAssignProperties(selectedBuilding)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-2"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Asignar Propiedades
                      </Button>
                    </div>
                  </div>

                  {selectedBuilding.properties && selectedBuilding.properties.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {selectedBuilding.properties.map((property, index) => (
                        <Card key={property.id} className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden hover:-translate-y-1 hover:scale-[1.02]">
                          {/* Header de la propiedad */}
                          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                  <Home className="h-5 w-5" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg leading-tight">{property.address}</h3>
                                  <p className="text-gray-300 text-sm">{property.population}</p>
                                </div>
                              </div>
                              {property.type && (
                                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                                  {property.type}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Contenido de la propiedad */}
                          <CardContent className="p-6 space-y-4">
                            {/* Información del propietario */}
                            {(property.ownerName || property.ownerPhone) && (
                              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                                  <User className="h-4 w-4 mr-2" />
                                  Propietario
                                </h4>
                                <div className="space-y-2">
                                  {property.ownerName && (
                                    <div className="flex items-center text-sm text-blue-800">
                                      <span className="font-medium">{property.ownerName}</span>
                                    </div>
                                  )}
                                  {property.ownerPhone && (
                                    <div className="flex items-center text-sm text-blue-700">
                                      <Phone className="h-3 w-3 mr-2" />
                                      <span>{property.ownerPhone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Estado y información adicional */}
                            <div className="space-y-3">
                              {property.status && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Estado:</span>
                                  <Badge 
                                    variant={property.status === 'VENDIDO' ? 'default' : 'secondary'}
                                    className={`text-xs px-3 py-1 ${
                                      property.status === 'VENDIDO' 
                                        ? 'bg-green-100 text-green-800 border-green-200' 
                                        : 'bg-orange-100 text-orange-800 border-orange-200'
                                    }`}
                                  >
                                    {property.status}
                                  </Badge>
                                </div>
                              )}
                              
                              {property.zone && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Zona:</span>
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {property.zone.name}
                                  </Badge>
                                </div>
                              )}

                              {property.responsibleUser && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Responsable:</span>
                                  <span className="text-sm font-medium text-gray-900">{property.responsibleUser.name}</span>
                                </div>
                              )}
                            </div>

                            {/* Footer con fecha */}
                            <div className="pt-4 border-t border-gray-100">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Agregada el {new Date(property.createdAt || '').toLocaleDateString('es-ES')}</span>
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  <span>Activa</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full opacity-50"></div>
                        </div>
                        <div className="relative">
                          <Home className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Sin propiedades asignadas
                          </h3>
                          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                            Este edificio aún no tiene propiedades asignadas. Comienza agregando la primera propiedad.
                          </p>
                          <Button
                            onClick={() => handleOpenAssignProperties(selectedBuilding)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 py-3"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Asignar Primera Propiedad
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog para asignar propiedades al edificio */}
      <Dialog open={isAssignPropertiesOpen} onClose={() => setIsAssignPropertiesOpen(false)}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" aria-hidden="true" />
        <div className="fixed inset-0 lg:left-64 flex items-center justify-center p-2 lg:p-4 z-50">
          <Dialog.Panel className="mx-auto max-w-5xl rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20 w-full max-h-[90vh] overflow-hidden">
            
            {/* Header mejorado */}
            <div className="relative bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 text-white overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-300 rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Plus className="h-8 w-8" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold mb-2">
                        Asignar Propiedades
                      </Dialog.Title>
                      {selectedBuilding && (
                        <div className="text-emerald-100">
                          <span className="text-sm">Edificio:</span>
                          <span className="font-semibold text-lg ml-2">{selectedBuilding.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAssignPropertiesOpen(false)}
                    className="text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-xl"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-800 leading-relaxed">
                    <span className="font-medium">💡 Instrucciones:</span> Selecciona las propiedades que deseas asignar a este edificio. 
                    Solo se muestran propiedades que no están asignadas a ningún edificio.
                  </p>
                </div>
                
                {/* Search bar for properties */}
                {availableProperties.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar propiedades por dirección, población o propietario..."
                        value={propertySearchTerm}
                        onChange={(e) => setPropertySearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                      />
                      {propertySearchTerm && (
                        <button
                          onClick={() => setPropertySearchTerm('')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {propertySearchTerm && (
                      <p className="text-xs text-gray-500 mt-2">
                        {filteredAvailableProperties.length} de {availableProperties.length} propiedades encontradas
                      </p>
                    )}
                  </div>
                )}
                
                {availableProperties.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 bg-gradient-to-r from-gray-100 to-blue-100 rounded-full opacity-50"></div>
                      </div>
                      <div className="relative">
                        <Home className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          No hay propiedades disponibles
                        </h3>
                        <p className="text-gray-600 text-lg max-w-md mx-auto">
                          Todas las propiedades ya están asignadas a edificios o no hay propiedades registradas en el sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : filteredAvailableProperties.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 bg-gradient-to-r from-gray-100 to-blue-100 rounded-full opacity-50"></div>
                      </div>
                      <div className="relative">
                        <svg className="h-20 w-20 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          No se encontraron propiedades
                        </h3>
                        <p className="text-gray-600 text-lg max-w-md mx-auto">
                          {propertySearchTerm ? 
                            `No hay propiedades que coincidan con "${propertySearchTerm}"` :
                            'No hay propiedades disponibles para asignar'
                          }
                        </p>
                        {propertySearchTerm && (
                          <button
                            onClick={() => setPropertySearchTerm('')}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {filteredAvailableProperties.map((property) => (
                        <div
                          key={property.id}
                          className={`group p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            selectedProperties.includes(property.id)
                              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg scale-[1.02]'
                              : 'border-gray-200 hover:border-emerald-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/30'
                          }`}
                          onClick={() => {
                            setSelectedProperties(prev =>
                              prev.includes(property.id)
                                ? prev.filter(id => id !== property.id)
                                : [...prev, property.id]
                            );
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className={`p-2 rounded-lg transition-colors ${
                                  selectedProperties.includes(property.id) 
                                    ? 'bg-emerald-100 text-emerald-600' 
                                    : 'bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                                }`}>
                                  <Home className="h-5 w-5" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{property.address}</h3>
                                  <p className="text-gray-600 text-sm">{property.population}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="space-y-2">
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {property.type}
                                  </Badge>
                                  {property.status && (
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs ${
                                        property.status === 'SALE' 
                                          ? 'bg-green-100 text-green-700 border-green-200' 
                                          : 'bg-orange-100 text-orange-700 border-orange-200'
                                      }`}
                                    >
                                      {property.status}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  {property.zone && (
                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {property.zone.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-4 flex-shrink-0">
                              <div className={`relative w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                                selectedProperties.includes(property.id)
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : 'border-gray-300 group-hover:border-emerald-400'
                              }`}>
                                {selectedProperties.includes(property.id) && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200 bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Home className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {selectedProperties.length} {selectedProperties.length === 1 ? 'propiedad seleccionada' : 'propiedades seleccionadas'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {filteredAvailableProperties.length} propiedades {propertySearchTerm ? 'encontradas' : 'disponibles'}
                            {propertySearchTerm && ` de ${availableProperties.length} total`}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsAssignPropertiesOpen(false)}
                          className="px-6 py-2 rounded-xl border-gray-300 hover:bg-gray-100"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAssignProperties}
                          disabled={selectedProperties.length === 0 || isAssigningProperties}
                          className={`px-6 py-2 rounded-xl transition-all duration-200 ${
                            selectedProperties.length === 0 || isAssigningProperties
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                          }`}
                        >
                          {isAssigningProperties ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Asignando...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Asignar {selectedProperties.length > 0 && selectedProperties.length} Propiedad{selectedProperties.length !== 1 ? 'es' : ''}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}