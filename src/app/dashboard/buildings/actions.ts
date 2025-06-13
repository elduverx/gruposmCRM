'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Building, BuildingCreateInput, BuildingUpdateInput } from '@/types/building';

export async function getBuildings(): Promise<Building[]> {
  try {
    const buildings = await prisma.building.findMany({
      include: {
        complex: true,
        properties: {
          select: {
            id: true,
            address: true,
            population: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return buildings.map(building => ({
      id: building.id,
      name: building.name,
      address: building.address,
      population: building.population,
      latitude: building.latitude,
      longitude: building.longitude,
      description: building.description,
      totalFloors: building.totalFloors,
      totalUnits: building.totalUnits,
      complexId: building.complexId,
      createdAt: building.createdAt.toISOString(),
      updatedAt: building.updatedAt.toISOString(),
      complex: building.complex ? {
        id: building.complex.id,
        name: building.complex.name,
        address: building.complex.address,
        population: building.complex.population,
        latitude: building.complex.latitude,
        longitude: building.complex.longitude,
        description: building.complex.description,
        totalBuildings: building.complex.totalBuildings,
        createdAt: building.complex.createdAt.toISOString(),
        updatedAt: building.complex.updatedAt.toISOString(),
      } : null,
      properties: building.properties.map(property => ({
        id: property.id,
        address: property.address,
        population: property.population,
        type: property.type,
        status: '',
        action: 'IR_A_DIRECCION' as const,
        ownerName: '',
        ownerPhone: '',
        captureDate: '',
        responsibleId: null,
        hasSimpleNote: false,
        isOccupied: false,
        clientId: null,
        zoneId: null,
        createdAt: '',
        updatedAt: '',
        latitude: null,
        longitude: null,
        occupiedBy: null,
        occupiedByName: null,
        isLocated: false,
        responsible: null,
        activities: [],
        zone: null,
        assignments: [],
        dpv: null,
        clients: [],
        responsibleUser: null,
        habitaciones: null,
        banos: null,
        metrosCuadrados: null,
        parking: false,
        ascensor: false,
        piscina: false,
        basePropertyId: null,
        buildingId: null,
        isSold: false,
        price: '',
        description: '',
        yearBuilt: '',
        isFurnished: false,
        ownerEmail: '',
        tenantName: '',
        tenantPhone: '',
        tenantEmail: '',
        notes: '',
      })),
    }));
  } catch (error) {
    console.error('Error fetching buildings:', error);
    throw new Error('Error al obtener los edificios');
  }
}

export async function getBuildingById(id: string): Promise<Building | null> {
  try {
    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        complex: true,
        properties: {
          include: {
            zone: true,
            responsibleUser: true,
            activities: true,
          },
        },
      },
    });

    if (!building) return null;

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      population: building.population,
      latitude: building.latitude,
      longitude: building.longitude,
      description: building.description,
      totalFloors: building.totalFloors,
      totalUnits: building.totalUnits,
      complexId: building.complexId,
      createdAt: building.createdAt.toISOString(),
      updatedAt: building.updatedAt.toISOString(),
      complex: building.complex ? {
        id: building.complex.id,
        name: building.complex.name,
        address: building.complex.address,
        population: building.complex.population,
        latitude: building.complex.latitude,
        longitude: building.complex.longitude,
        description: building.complex.description,
        totalBuildings: building.complex.totalBuildings,
        createdAt: building.complex.createdAt.toISOString(),
        updatedAt: building.complex.updatedAt.toISOString(),
      } : null,
      properties: building.properties.map(property => ({
        id: property.id,
        address: property.address,
        population: property.population,
        type: property.type,
        status: property.status,
        action: property.action,
        ownerName: property.ownerName,
        ownerPhone: property.ownerPhone,
        captureDate: property.captureDate.toISOString(),
        responsibleId: property.responsibleId,
        hasSimpleNote: property.hasSimpleNote,
        isOccupied: property.isOccupied,
        clientId: property.clientId,
        zoneId: property.zoneId,
        createdAt: property.createdAt.toISOString(),
        updatedAt: property.updatedAt.toISOString(),
        latitude: property.latitude,
        longitude: property.longitude,
        occupiedBy: property.occupiedBy,
        occupiedByName: property.occupiedByName,
        isLocated: property.isLocated,
        responsible: property.responsible,
        activities: property.activities.map(activity => ({
          id: activity.id,
          type: activity.type,
          status: activity.status || '',
          date: activity.date.toISOString(),
          client: activity.client,
          notes: activity.notes,
          propertyId: activity.propertyId,
          createdAt: activity.createdAt.toISOString(),
          updatedAt: activity.updatedAt.toISOString(),
        })),
        zone: property.zone ? {
          id: property.zone.id,
          name: property.zone.name,
        } : null,
        assignments: [],
        dpv: null,
        clients: [],
        responsibleUser: property.responsibleUser ? {
          id: property.responsibleUser.id,
          name: property.responsibleUser.name,
          email: property.responsibleUser.email,
        } : null,
        habitaciones: property.habitaciones,
        banos: property.banos,
        metrosCuadrados: property.metrosCuadrados,
        parking: property.parking,
        ascensor: property.ascensor,
        piscina: property.piscina,
        basePropertyId: property.basePropertyId,
        buildingId: property.buildingId,
        isSold: property.isSold,
        price: '',
        description: '',
        yearBuilt: '',
        isFurnished: false,
        ownerEmail: '',
        tenantName: '',
        tenantPhone: '',
        tenantEmail: '',
        notes: '',
      })),
    };
  } catch (error) {
    console.error('Error fetching building:', error);
    throw new Error('Error al obtener el edificio');
  }
}

export async function createBuilding(data: BuildingCreateInput): Promise<Building> {
  try {
    const building = await prisma.building.create({
      data: {
        name: data.name,
        address: data.address,
        population: data.population,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        totalFloors: data.totalFloors,
        totalUnits: data.totalUnits,
        complexId: data.complexId,
      },
      include: {
        complex: true,
        properties: true,
      },
    });

    revalidatePath('/dashboard/properties');

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      population: building.population,
      latitude: building.latitude,
      longitude: building.longitude,
      description: building.description,
      totalFloors: building.totalFloors,
      totalUnits: building.totalUnits,
      complexId: building.complexId,
      createdAt: building.createdAt.toISOString(),
      updatedAt: building.updatedAt.toISOString(),
      complex: building.complex ? {
        id: building.complex.id,
        name: building.complex.name,
        address: building.complex.address,
        population: building.complex.population,
        latitude: building.complex.latitude,
        longitude: building.complex.longitude,
        description: building.complex.description,
        totalBuildings: building.complex.totalBuildings,
        createdAt: building.complex.createdAt.toISOString(),
        updatedAt: building.complex.updatedAt.toISOString(),
      } : null,
      properties: [],
    };
  } catch (error) {
    console.error('Error creating building:', error);
    throw new Error('Error al crear el edificio');
  }
}

export async function updateBuilding(id: string, data: BuildingUpdateInput): Promise<Building> {
  try {
    const building = await prisma.building.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address && { address: data.address }),
        ...(data.population && { population: data.population }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.totalFloors !== undefined && { totalFloors: data.totalFloors }),
        ...(data.totalUnits !== undefined && { totalUnits: data.totalUnits }),
        ...(data.complexId !== undefined && { complexId: data.complexId }),
      },
      include: {
        complex: true,
        properties: true,
      },
    });

    revalidatePath('/dashboard/properties');

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      population: building.population,
      latitude: building.latitude,
      longitude: building.longitude,
      description: building.description,
      totalFloors: building.totalFloors,
      totalUnits: building.totalUnits,
      complexId: building.complexId,
      createdAt: building.createdAt.toISOString(),
      updatedAt: building.updatedAt.toISOString(),
      complex: building.complex ? {
        id: building.complex.id,
        name: building.complex.name,
        address: building.complex.address,
        population: building.complex.population,
        latitude: building.complex.latitude,
        longitude: building.complex.longitude,
        description: building.complex.description,
        totalBuildings: building.complex.totalBuildings,
        createdAt: building.complex.createdAt.toISOString(),
        updatedAt: building.complex.updatedAt.toISOString(),
      } : null,
      properties: [],
    };
  } catch (error) {
    console.error('Error updating building:', error);
    throw new Error('Error al actualizar el edificio');
  }
}

export async function deleteBuilding(id: string): Promise<void> {
  try {
    await prisma.building.delete({
      where: { id },
    });

    revalidatePath('/dashboard/properties');
  } catch (error) {
    console.error('Error deleting building:', error);
    throw new Error('Error al eliminar el edificio');
  }
}

export async function assignPropertyToBuilding(propertyId: string, buildingId: string): Promise<void> {
  try {
    await prisma.property.update({
      where: { id: propertyId },
      data: { buildingId },
    });

    revalidatePath('/dashboard/properties');
  } catch (error) {
    console.error('Error assigning property to building:', error);
    throw new Error('Error al asignar la propiedad al edificio');
  }
}

export async function removePropertyFromBuilding(propertyId: string): Promise<void> {
  try {
    await prisma.property.update({
      where: { id: propertyId },
      data: { buildingId: null },
    });

    revalidatePath('/dashboard/properties');
  } catch (error) {
    console.error('Error removing property from building:', error);
    throw new Error('Error al remover la propiedad del edificio');
  }
}
