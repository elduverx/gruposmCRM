'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Complex, ComplexCreateInput, ComplexUpdateInput } from '@/types/complex';

export async function getComplexes(): Promise<Complex[]> {
  try {
    const complexes = await prisma.complex.findMany({
      include: {
        buildings: {
          include: {
            properties: {
              select: {
                id: true,
                address: true,
                population: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return complexes.map(complex => ({
      id: complex.id,
      name: complex.name,
      address: complex.address,
      population: complex.population,
      latitude: complex.latitude,
      longitude: complex.longitude,
      description: complex.description,
      totalBuildings: complex.totalBuildings,
      createdAt: complex.createdAt.toISOString(),
      updatedAt: complex.updatedAt.toISOString(),
      buildings: complex.buildings.map(building => ({
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
      })),
    }));
  } catch (error) {
    console.error('Error fetching complexes:', error);
    throw new Error('Error al obtener los complejos');
  }
}

export async function getComplexById(id: string): Promise<Complex | null> {
  try {
    const complex = await prisma.complex.findUnique({
      where: { id },
      include: {
        buildings: {
          include: {
            properties: {
              include: {
                zone: true,
                responsibleUser: true,
                activities: true,
              },
            },
          },
        },
      },
    });

    if (!complex) return null;

    return {
      id: complex.id,
      name: complex.name,
      address: complex.address,
      population: complex.population,
      latitude: complex.latitude,
      longitude: complex.longitude,
      description: complex.description,
      totalBuildings: complex.totalBuildings,
      createdAt: complex.createdAt.toISOString(),
      updatedAt: complex.updatedAt.toISOString(),
      buildings: complex.buildings.map(building => ({
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
      })),
    };
  } catch (error) {
    console.error('Error fetching complex:', error);
    throw new Error('Error al obtener el complejo');
  }
}

export async function createComplex(data: ComplexCreateInput): Promise<Complex> {
  try {
    const complex = await prisma.complex.create({
      data: {
        name: data.name,
        address: data.address,
        population: data.population,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        totalBuildings: data.totalBuildings,
      },
      include: {
        buildings: true,
      },
    });

    revalidatePath('/dashboard/properties');

    return {
      id: complex.id,
      name: complex.name,
      address: complex.address,
      population: complex.population,
      latitude: complex.latitude,
      longitude: complex.longitude,
      description: complex.description,
      totalBuildings: complex.totalBuildings,
      createdAt: complex.createdAt.toISOString(),
      updatedAt: complex.updatedAt.toISOString(),
      buildings: [],
    };
  } catch (error) {
    console.error('Error creating complex:', error);
    throw new Error('Error al crear el complejo');
  }
}

export async function updateComplex(id: string, data: ComplexUpdateInput): Promise<Complex> {
  try {
    const complex = await prisma.complex.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address && { address: data.address }),
        ...(data.population && { population: data.population }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.totalBuildings !== undefined && { totalBuildings: data.totalBuildings }),
      },
      include: {
        buildings: true,
      },
    });

    revalidatePath('/dashboard/properties');

    return {
      id: complex.id,
      name: complex.name,
      address: complex.address,
      population: complex.population,
      latitude: complex.latitude,
      longitude: complex.longitude,
      description: complex.description,
      totalBuildings: complex.totalBuildings,
      createdAt: complex.createdAt.toISOString(),
      updatedAt: complex.updatedAt.toISOString(),
      buildings: [],
    };
  } catch (error) {
    console.error('Error updating complex:', error);
    throw new Error('Error al actualizar el complejo');
  }
}

export async function deleteComplex(id: string): Promise<void> {
  try {
    await prisma.complex.delete({
      where: { id },
    });

    revalidatePath('/dashboard/properties');
  } catch (error) {
    console.error('Error deleting complex:', error);
    throw new Error('Error al eliminar el complejo');
  }
}

export async function assignBuildingToComplex(buildingId: string, complexId: string): Promise<void> {
  try {
    await prisma.building.update({
      where: { id: buildingId },
      data: { complexId },
    });

    revalidatePath('/dashboard/properties');
  } catch (error) {
    console.error('Error assigning building to complex:', error);
    throw new Error('Error al asignar el edificio al complejo');
  }
}

export async function removeBuildingFromComplex(buildingId: string): Promise<void> {
  try {
    await prisma.building.update({
      where: { id: buildingId },
      data: { complexId: null },
    });

    revalidatePath('/dashboard/properties');
  } catch (error) {
    console.error('Error removing building from complex:', error);
    throw new Error('Error al remover el edificio del complejo');
  }
}
