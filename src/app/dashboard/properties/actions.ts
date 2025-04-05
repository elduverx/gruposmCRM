'use server';

import { PropertyType, PropertyStatus, PropertyAction, Prisma } from '@prisma/client';
import { Property, PropertyCreateInput, Activity, DPV, PropertyNews, Assignment } from '@/types/property';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

type PrismaProperty = Prisma.PropertyGetPayload<{
  include: {
    zone: true;
    activities: true;
    responsibleUser: true;
  }
}>;

export async function getProperties(): Promise<Property[]> {
  try {
    const properties = await prisma.property.findMany({
      include: {
        zone: true,
        activities: {
          orderBy: {
            date: 'desc'
          }
        },
        responsibleUser: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as unknown as PrismaProperty[];

    return properties.map(property => {
      const result: Property = {
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
        responsible: property.responsible ?? undefined,
        zone: property.zone ? {
          id: property.zone.id,
          name: property.zone.name
        } : undefined,
        activities: property.activities.map(activity => ({
          id: activity.id,
          type: activity.type,
          status: activity.status,
          date: activity.date.toISOString(),
          client: activity.client ?? undefined,
          notes: activity.notes ?? undefined,
          propertyId: activity.propertyId,
          createdAt: activity.createdAt.toISOString(),
          updatedAt: activity.updatedAt.toISOString()
        })),
        responsibleUser: property.responsibleUser ? {
          id: property.responsibleUser.id,
          name: property.responsibleUser.name,
          email: property.responsibleUser.email
        } : undefined
      };
      return result;
    });
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
        zone: true,
        activities: true,
        responsibleUser: true
      }
    });

    if (!property) return null;

    return {
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
      responsible: property.responsible ?? undefined,
      zone: property.zone ? {
        id: property.zone.id,
        name: property.zone.name
      } : undefined,
      activities: property.activities ? property.activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        status: activity.status,
        date: activity.date.toISOString(),
        client: activity.client ?? undefined,
        notes: activity.notes ?? undefined,
        propertyId: activity.propertyId,
        createdAt: activity.createdAt.toISOString(),
        updatedAt: activity.updatedAt.toISOString()
      })) : [],
      responsibleUser: property.responsibleUser ? {
        id: property.responsibleUser.id,
        name: property.responsibleUser.name,
        email: property.responsibleUser.email
      } : undefined
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
        address: data.address,
        population: data.population,
        status: 'SIN_EMPEZAR' as PropertyStatus,
        action: 'IR_A_DIRECCION' as PropertyAction,
        type: 'CASA' as PropertyType,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        captureDate: data.captureDate || new Date(),
        responsibleId: data.responsibleId,
        hasSimpleNote: data.hasSimpleNote || false,
        isOccupied: data.isOccupied || false,
        clientId: data.clientId,
        zoneId: data.zoneId,
        latitude: data.latitude,
        longitude: data.longitude,
        occupiedBy: data.occupiedBy,
        isLocated: data.isLocated || false,
        responsible: data.responsible
      },
      include: {
        zone: true,
        activities: true,
        responsibleUser: true
      }
    });

    return {
      ...property,
      captureDate: property.captureDate.toISOString(),
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      responsibleId: property.responsibleId ?? undefined,
      clientId: property.clientId ?? undefined,
      zoneId: property.zoneId ?? undefined,
      latitude: property.latitude ?? undefined,
      longitude: property.longitude ?? undefined,
      occupiedBy: property.occupiedBy ?? undefined,
      responsible: property.responsible ?? undefined,
      zone: property.zone ? {
        id: property.zone.id,
        name: property.zone.name
      } : undefined,
      activities: property.activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        status: activity.status,
        date: activity.date.toISOString(),
        client: activity.client ?? undefined,
        notes: activity.notes ?? undefined,
        propertyId: activity.propertyId,
        createdAt: activity.createdAt.toISOString(),
        updatedAt: activity.updatedAt.toISOString()
      })),
      responsibleUser: property.responsibleUser ? {
        id: property.responsibleUser.id,
        name: property.responsibleUser.name,
        email: property.responsibleUser.email
      } : undefined
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
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        zone: true,
        activities: true
      }
    });

    return {
      ...property,
      captureDate: property.captureDate.toISOString(),
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      responsibleId: property.responsibleId ?? undefined,
      clientId: property.clientId ?? undefined,
      zoneId: property.zoneId ?? undefined,
      latitude: property.latitude ?? undefined,
      longitude: property.longitude ?? undefined,
      occupiedBy: property.occupiedBy ?? undefined,
      responsible: property.responsible ?? undefined,
      zone: property.zone ? {
        id: property.zone.id,
        name: property.zone.name
      } : undefined,
      activities: property.activities.map(activity => ({
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

export async function createPropertyNews(data: {
  type: string;
  action: string;
  valuation: string;
  priority: string;
  responsible: string;
  value: number;
  propertyId: string;
}): Promise<PropertyNews | null> {
  try {
    // Verificar si ya existe una noticia para esta propiedad
    const existingNews = await prisma.propertyNews.findFirst({
      where: {
        propertyId: data.propertyId
      }
    });

    if (existingNews) {
      throw new Error('Ya existe una noticia para esta propiedad');
    }

    const news = await prisma.propertyNews.create({
      data: {
        type: data.type,
        action: data.action,
        valuation: data.valuation,
        priority: data.priority,
        responsible: data.responsible,
        value: data.value,
        propertyId: data.propertyId,
      }
    });
    
    revalidatePath(`/dashboard/properties/${data.propertyId}`);
    revalidatePath('/dashboard/properties');
    return news;
  } catch (error) {
    console.error('Error creating property news:', error);
    return null;
  }
}

export async function getPropertyNews(propertyId: string): Promise<PropertyNews[]> {
  try {
    const propertyNews = await prisma.propertyNews.findMany({
      where: {
        propertyId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return propertyNews;
  } catch (error) {
    console.error('Error getting property news:', error);
    return [];
  }
}

export async function createAssignment(data: {
  type: string;
  price: number;
  exclusiveUntil: Date;
  origin: string;
  clientId: string;
  sellerFeeType: string;
  sellerFeeValue: number;
  buyerFeeType: string;
  buyerFeeValue: number;
  propertyId: string;
}): Promise<Assignment | null> {
  try {
    const assignment = await prisma.assignment.create({
      data: {
        type: data.type,
        price: data.price,
        exclusiveUntil: data.exclusiveUntil,
        origin: data.origin,
        clientId: data.clientId,
        sellerFeeType: data.sellerFeeType,
        sellerFeeValue: data.sellerFeeValue,
        buyerFeeType: data.buyerFeeType,
        buyerFeeValue: data.buyerFeeValue,
        propertyId: data.propertyId
      },
      include: {
        client: true
      }
    });
    
    revalidatePath(`/dashboard/properties/${data.propertyId}`);
    return assignment;
  } catch (error) {
    console.error('Error creating assignment:', error);
    return null;
  }
}

export async function getAssignmentsByPropertyId(propertyId: string): Promise<Assignment[]> {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        propertyId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        client: true
      }
    });
    return assignments;
  } catch (error) {
    console.error('Error getting assignments:', error);
    return [];
  }
}

export async function getAssignments(): Promise<Assignment[]> {
  try {
    const assignments = await prisma.assignment.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        property: {
          select: {
            id: true,
            address: true,
            population: true
          }
        }
      }
    });
    return assignments;
  } catch (error) {
    console.error('Error getting assignments:', error);
    return [];
  }
}

export async function updateAssignment(id: string, data: {
  type: string;
  price: number;
  exclusiveUntil: Date;
  origin: string;
  clientId: string;
  sellerFeeType: string;
  sellerFeeValue: number;
  buyerFeeType: string;
  buyerFeeValue: number;
}): Promise<Assignment | null> {
  try {
    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        type: data.type,
        price: data.price,
        exclusiveUntil: data.exclusiveUntil,
        origin: data.origin,
        clientId: data.clientId,
        sellerFeeType: data.sellerFeeType,
        sellerFeeValue: data.sellerFeeValue,
        buyerFeeType: data.buyerFeeType,
        buyerFeeValue: data.buyerFeeValue,
      },
      include: {
        client: true,
        property: true
      }
    });
    
    revalidatePath('/dashboard/assignments');
    revalidatePath(`/dashboard/properties/${assignment.propertyId}`);
    return assignment;
  } catch (error) {
    console.error('Error updating assignment:', error);
    return null;
  }
}

export async function deleteAssignment(id: string): Promise<boolean> {
  try {
    const assignment = await prisma.assignment.delete({
      where: { id }
    });
    
    revalidatePath('/dashboard/assignments');
    revalidatePath(`/dashboard/properties/${assignment.propertyId}`);
    return true;
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return false;
  }
} 