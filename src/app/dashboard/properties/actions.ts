'use server';

import { PrismaClient, PropertyType, PropertyStatus, PropertyAction, Prisma } from '@prisma/client';
import { Property, PropertyCreateInput, PropertyUpdateInput, Activity, DPV } from '@/types/property';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

const prismaClient = new PrismaClient();

export async function getProperties(): Promise<Property[]> {
  try {
    const properties = await prisma.property.findMany({
      include: {
        zone: true,
        responsible: true,
        activities: {
          orderBy: {
            date: 'desc'
          },
          take: 1
        }
      } satisfies Prisma.PropertyInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return properties.map((property): Property => ({
      id: property.id,
      address: property.address,
      population: property.population,
      status: property.status,
      action: property.action,
      type: property.type,
      ownerName: property.ownerName,
      ownerPhone: property.ownerPhone,
      captureDate: property.captureDate.toISOString(),
      responsibleId: property.responsibleId ?? undefined,
      hasSimpleNote: property.hasSimpleNote,
      isOccupied: property.isOccupied,
      clientId: property.clientId ?? undefined,
      zoneId: property.zoneId ?? undefined,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      latitude: property.latitude ?? undefined,
      longitude: property.longitude ?? undefined,
      occupiedBy: property.occupiedBy ?? undefined,
      isLocated: property.isLocated,
      zone: property.zone ? {
        id: property.zone.id,
        name: property.zone.name
      } : undefined,
      responsible: property.responsible?.name ?? undefined,
      activities: property.activities.map((activity): Activity => ({
        id: activity.id,
        type: activity.type,
        status: activity.status,
        date: activity.date.toISOString(),
        client: activity.client ?? undefined,
        notes: activity.notes ?? undefined,
        propertyId: activity.propertyId,
        createdAt: activity.createdAt.toISOString(),
        updatedAt: activity.updatedAt.toISOString()
      }))
    }));
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        zone: true
      }
    });

    if (!property) return null;

    return {
      ...property,
      type: property.type as PropertyType,
      status: property.status as PropertyStatus,
      action: property.action as PropertyAction,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}

export async function createProperty(data: PropertyCreateInput): Promise<Property> {
  try {
    const property = await prisma.property.create({
      data: {
        ...data,
        status: data.status || PropertyStatus.IN_PROCESS,
        action: data.action || PropertyAction.NEWS,
        type: data.type || PropertyType.HOUSE,
        captureDate: data.captureDate || new Date(),
        hasSimpleNote: data.hasSimpleNote || false,
        isOccupied: data.isOccupied || false,
        isLocated: data.isLocated || false,
      },
      include: {
        zone: true,
        responsible: true,
        assignments: true,
        client: true,
      },
    });

    return {
      id: property.id,
      address: property.address,
      population: property.population,
      status: property.status,
      action: property.action,
      type: property.type,
      ownerName: property.ownerName,
      ownerPhone: property.ownerPhone,
      captureDate: property.captureDate,
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
      isLocated: property.isLocated,
      zone: property.zone ? {
        id: property.zone.id,
        name: property.zone.name,
        description: property.zone.description,
        color: property.zone.color,
        coordinates: property.zone.coordinates,
        createdAt: property.zone.createdAt,
        updatedAt: property.zone.updatedAt,
      } : null,
      responsible: property.responsible?.name || null,
      assignments: property.assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        status: assignment.status,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        propertyId: assignment.propertyId,
        clientId: assignment.clientId,
      })),
      client: property.client ? {
        id: property.client.id,
        name: property.client.name,
        email: property.client.email,
        phone: property.client.phone,
        address: property.client.address,
        createdAt: property.client.createdAt,
        updatedAt: property.client.updatedAt,
      } : null,
    };
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
}

export async function updateProperty(id: string, data: Partial<Property>): Promise<Property | null> {
  try {
    const property = await prisma.property.update({
      where: { id },
      data
    });

    revalidatePath('/dashboard/properties');
    revalidatePath(`/dashboard/properties/${id}`);

    return {
      ...property,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error updating property:', error);
    return null;
  }
}

export async function deleteProperty(id: string): Promise<boolean> {
  try {
    await prisma.property.delete({
      where: { id },
    });

    revalidatePath('/dashboard/properties');
    return true;
  } catch (error) {
    console.error('Error deleting property:', error);
    return false;
  }
}

// Funciones para actividades
export async function getActivitiesByPropertyId(propertyId: string): Promise<Activity[]> {
  try {
    const activities = await prisma.activity.findMany({
      where: { propertyId },
      orderBy: { date: 'desc' },
    });
    
    return activities.map(activity => ({
      ...activity,
      date: activity.date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      createdAt: activity.createdAt.toISOString(),
      updatedAt: activity.updatedAt.toISOString()
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

export async function createActivity(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Activity | null> {
  try {
    const activity = await prisma.activity.create({
      data: {
        ...data,
        date: new Date(data.date)
      }
    });
    
    revalidatePath(`/dashboard/properties/${data.propertyId}`);

    return {
      ...activity,
      date: activity.date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      createdAt: activity.createdAt.toISOString(),
      updatedAt: activity.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error creating activity:', error);
    return null;
  }
}

// Funciones para DPV
export async function getDPVByPropertyId(propertyId: string): Promise<DPV | null> {
  try {
    const dpv = await prisma.dPV.findUnique({
      where: { propertyId },
    });
    
    if (!dpv) return null;
    
    return {
      ...dpv,
      createdAt: dpv.createdAt.toISOString(),
      updatedAt: dpv.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error fetching DPV:', error);
    return null;
  }
}

export async function createOrUpdateDPV(propertyId: string, data: Omit<DPV, 'id' | 'createdAt' | 'updatedAt'>): Promise<DPV | null> {
  try {
    const dpv = await prisma.dPV.upsert({
      where: { propertyId },
      create: {
        ...data,
        propertyId
      },
      update: data
    });
    
    revalidatePath(`/dashboard/properties/${propertyId}`);

    return {
      ...dpv,
      createdAt: dpv.createdAt.toISOString(),
      updatedAt: dpv.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error creating/updating DPV:', error);
    return null;
  }
} 