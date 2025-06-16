'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building, MapPin, Users, Edit, Trash2, ChevronRight } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { Complex } from '@/types/complex';
import ComplexForm from '@/components/ComplexForm';
import { getComplexes, deleteComplex } from './actions';

export function ComplexesClient() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingComplex, setEditingComplex] = useState<Complex | null>(null);
  const [expandedComplex, setExpandedComplex] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComplexes();
  }, []);

  const loadComplexes = async () => {
    try {
      setIsLoading(true);
      const data = await getComplexes();
      setComplexes(data);
    } catch (error) {
      toast.error('Error al cargar los complejos');
      console.error('Error loading complexes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    loadComplexes();
    toast.success('Complejo creado exitosamente');
  };

  const handleEditSuccess = () => {
    setEditingComplex(null);
    loadComplexes();
    toast.success('Complejo actualizado exitosamente');
  };

  const handleDelete = async (complexId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este complejo?')) {
      return;
    }

    try {
      await deleteComplex(complexId);
      loadComplexes();
      toast.success('Complejo eliminado exitosamente');
    } catch (error) {
      toast.error('Error al eliminar el complejo');
      console.error('Error deleting complex:', error);
    }
  };

  const toggleExpanded = (complexId: string) => {
    setExpandedComplex(expandedComplex === complexId ? null : complexId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando complejos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complejos</h1>
          <p className="text-muted-foreground">
            Gestiona los complejos residenciales y sus edificios
          </p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Complejo
        </Button>
      </div>

      {complexes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay complejos registrados
            </h3>
            <p className="text-gray-500 text-center mb-6">
              Comienza creando tu primer complejo para organizar edificios y propiedades
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Complejo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {complexes.map((complex) => (
            <Card key={complex.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <div>
                      <CardTitle className="text-xl">{complex.name}</CardTitle>
                      {complex.description && (
                        <CardDescription className="mt-1">{complex.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingComplex(complex)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(complex.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{complex.address}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Población:</span>
                    <span className="ml-1">{complex.population}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Edificios planificados:</span>
                    <span className="ml-1">{complex.totalBuildings || '-'}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{complex.buildings?.length || 0} edificios actuales</span>
                  </div>
                </div>

                {complex.buildings && complex.buildings.length > 0 && (
                  <div className="border-t pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(complex.id)}
                      className="mb-3"
                    >
                      <ChevronRight 
                        className={`h-4 w-4 mr-1 transition-transform ${
                          expandedComplex === complex.id ? 'rotate-90' : ''
                        }`} 
                      />
                      Ver edificios ({complex.buildings.length})
                    </Button>

                    {expandedComplex === complex.id && (
                      <div className="grid gap-3 md:grid-cols-2">
                        {complex.buildings.map((building) => (
                          <Card key={building.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <h4 className="font-medium text-sm mb-2">{building.name}</h4>
                              <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span>{building.address}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Pisos: {building.totalFloors || '-'}</span>
                                  <span>Unidades: {building.totalUnits || '-'}</span>
                                </div>
                                {building.properties && building.properties.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {building.properties.length} propiedades
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 border-t pt-2">
                  Creado: {new Date(complex.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear complejo */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Crear Nuevo Complejo
            </Dialog.Title>
            <ComplexForm 
              onSubmit={handleCreateSuccess}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog para editar complejo */}
      <Dialog open={!!editingComplex} onClose={() => setEditingComplex(null)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Editar Complejo
            </Dialog.Title>
            {editingComplex && (
              <ComplexForm 
                initialData={editingComplex}
                onSubmit={handleEditSuccess}
                onCancel={() => setEditingComplex(null)}
              />
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
