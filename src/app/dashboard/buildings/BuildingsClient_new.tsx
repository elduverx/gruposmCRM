'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { toast } from 'sonner';
import { Building } from '@/types/building';
import BuildingForm from '@/components/BuildingForm';
import { getBuildings, deleteBuilding } from './actions';

export function BuildingsClient() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setIsLoading(true);
      const data = await getBuildings();
      setBuildings(data);
    } catch (error) {
      toast.error('Error al cargar los edificios');
      console.error('Error loading buildings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    loadBuildings();
    toast.success('Edificio creado exitosamente');
  };

  const handleEditSuccess = () => {
    setEditingBuilding(null);
    loadBuildings();
    toast.success('Edificio actualizado exitosamente');
  };

  const handleDelete = async (buildingId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este edificio?')) {
      return;
    }

    try {
      await deleteBuilding(buildingId);
      loadBuildings();
      toast.success('Edificio eliminado exitosamente');
    } catch (error) {
      toast.error('Error al eliminar el edificio');
      console.error('Error deleting building:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando edificios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edificios</h1>
          <p className="text-muted-foreground">
            Gestiona los edificios de tu sistema inmobiliario
          </p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Edificio
        </Button>
      </div>

      {buildings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay edificios registrados
            </h3>
            <p className="text-gray-500 text-center mb-6">
              Comienza creando tu primer edificio para organizar tus propiedades
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Edificio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {buildings.map((building) => (
            <Card key={building.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{building.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingBuilding(building)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(building.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                {building.description && (
                  <CardDescription>{building.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{building.address}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Población:</span>
                  <span className="ml-1">{building.population}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium">Pisos:</span>
                    <span className="ml-1">{building.totalFloors || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{building.totalUnits || 0} unidades</span>
                  </div>
                </div>

                {building.properties && building.properties.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{building.properties.length}</span> propiedades asignadas
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Creado: {new Date(building.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear edificio */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Crear Nuevo Edificio
            </Dialog.Title>
            <BuildingForm 
              onSubmit={handleCreateSuccess}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog para editar edificio */}
      <Dialog open={!!editingBuilding} onClose={() => setEditingBuilding(null)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Editar Edificio
            </Dialog.Title>
            {editingBuilding && (
              <BuildingForm 
                initialData={editingBuilding}
                onSubmit={handleEditSuccess}
                onCancel={() => setEditingBuilding(null)}
              />
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
