// @ts-nocheck
'use server';

import { PropertyType, PropertyStatus, PropertyAction, Prisma } from '@prisma/client';
import { Property, PropertyCreateInput, Activity, DPV, PropertyNews, Assignment, PropertyUpdateInput } from '@/types/property';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { PropertyNewsWithProperty, PropertyNewsCreateInput } from '@/types/prisma';

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
        activities: true,
        responsibleUser: true
      }
    });

    return properties.map(property => ({
      ...property,
      captureDate: property.captureDate.toISOString(),
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      activities: property.activities.map(activity => ({
        ...activity,
        createdAt: activity.createdAt.toISOString(),
        updatedAt: activity.updatedAt.toISOString(),
        date: activity.date.toISOString()
      })),
      zone: property.zone ? {
        id: property.zone.id,
        name: property.zone.name
      } : null,
      assignments: [],
      dpv: null,
      clients: [],
      responsibleUser: property.responsibleUser ? {
        id: property.responsibleUser.id,
        name: property.responsibleUser.name,
        email: property.responsibleUser.email
      } : null
    }));
  } catch (error) {
    console.error('Error getting properties:', error);
    return [];
  }
}

export async function getProperty(id: string): Promise<Property | null> {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        zone: true,
        activities: true,
        responsibleUser: true
      }
    });

    if (!property) {
      return null;
    }

    return {
      ...property,
      captureDate: property.captureDate.toISOString(),
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      activities: property.activities.map(activity => ({
        ...activity,
        createdAt: activity.createdAt.toISOString(),
        updatedAt: activity.updatedAt.toISOString(),
        date: activity.date.toISOString()
      })),
      zone: property.zone ? {
        id: property.zone.id,
        name: property.zone.name
      } : null,
      assignments: [],
      dpv: null,
      clients: [],
      responsibleUser: property.responsibleUser ? {
        id: property.responsibleUser.id,
        name: property.responsibleUser.name,
        email: property.responsibleUser.email
      } : null
    };
  } catch (error) {
    console.error('Error getting property:', error);
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
        responsible: data.responsible,
        habitaciones: data.habitaciones || null,
        banos: data.banos || null,
        metrosCuadrados: data.metrosCuadrados || null,
        parking: data.parking || false,
        ascensor: data.ascensor || false,
        piscina: data.piscina || false
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
      habitaciones: property.habitaciones ?? undefined,
      banos: property.banos ?? undefined,
      metrosCuadrados: property.metrosCuadrados ?? undefined,
      parking: property.parking ?? undefined,
      ascensor: property.ascensor ?? undefined,
      piscina: property.piscina ?? undefined,
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

export async function updateProperty(id: string, data: {
  address?: string;
  population?: string;
  type?: string;
  ownerName?: string;
  ownerPhone?: string;
  zoneId?: string | null;
  status?: string;
  action?: string;
  captureDate?: string;
  responsibleId?: string | null;
  hasSimpleNote?: boolean;
  isOccupied?: boolean;
  clientId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  occupiedBy?: string | null;
  isLocated?: boolean;
  responsible?: string | null;
  habitaciones?: number | null;
  banos?: number | null;
  metrosCuadrados?: number | null;
  parking?: boolean;
  ascensor?: boolean;
  piscina?: boolean;
}): Promise<Property | null> {
  try {
    // Si se proporciona un zoneId, verificar que la zona existe
    if (data.zoneId) {
      const zone = await prisma.zone.findUnique({
        where: { id: data.zoneId }
      });
      if (!zone) {
        throw new Error('La zona especificada no existe');
      }
    }

    // Convertir la fecha de captura a objeto Date si es necesario
    const captureDate = data.captureDate ? new Date(data.captureDate) : undefined;

    const property = await prisma.property.update({
      where: { id },
      data: {
        address: data.address,
        population: data.population,
        type: data.type,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        zoneId: data.zoneId || null,
        status: data.status,
        action: data.action,
        captureDate: captureDate,
        responsibleId: data.responsibleId,
        hasSimpleNote: data.hasSimpleNote,
        isOccupied: data.isOccupied,
        clientId: data.clientId,
        latitude: data.latitude,
        longitude: data.longitude,
        occupiedBy: data.occupiedBy,
        isLocated: data.isLocated,
        responsible: data.responsible,
        habitaciones: data.habitaciones,
        banos: data.banos,
        metrosCuadrados: data.metrosCuadrados,
        parking: data.parking,
        ascensor: data.ascensor,
        piscina: data.piscina
      },
      include: {
        responsibleUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        activities: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        zone: true
      }
    });

    revalidatePath('/dashboard/properties');
    revalidatePath(`/dashboard/properties/${id}`);
    revalidatePath('/dashboard/zones');

    return {
      ...property,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      activities: property.activities.map(activity => ({
        ...activity,
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
    
    // Asegurarnos de que links sea un array de strings
    const links = Array.isArray(dpv.links) 
      ? dpv.links.filter((link): link is string => typeof link === 'string')
      : [];
    
    return {
      ...dpv,
      links,
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

    // Asegurarnos de que links sea un array de strings
    const links = Array.isArray(dpv.links) 
      ? dpv.links.filter((link): link is string => typeof link === 'string')
      : [];

    return {
      ...dpv,
      links,
      createdAt: dpv.createdAt.toISOString(),
      updatedAt: dpv.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error creating/updating DPV:', error);
    return null;
  }
}

export async function createPropertyNews(propertyId: string, data: {
  type: string;
  action: string;
  valuation: boolean;
  priority: 'HIGH' | 'LOW';
  responsible: string;
  value: number;
  precioSM: number | null;
  precioCliente: number | null;
}) {
  try {
    // Convert numeric values to ensure they're numbers, not strings
    const numericValue = typeof data.value === 'string' ? parseFloat(data.value) : data.value;
    const numericPrecioSM = data.precioSM !== null ? (typeof data.precioSM === 'string' ? parseFloat(data.precioSM) : data.precioSM) : null;
    const numericPrecioCliente = data.precioCliente !== null ? (typeof data.precioCliente === 'string' ? parseFloat(data.precioCliente) : data.precioCliente) : null;

    const news = await prisma.propertyNews.create({
      data: {
        type: data.type,
        action: data.action,
        valuation: data.valuation ? 'true' : 'false',
        priority: data.priority,
        responsible: data.responsible,
        value: numericValue,
        precioSM: data.valuation ? numericPrecioSM : null,
        precioCliente: data.valuation ? numericPrecioCliente : null,
        propertyId: propertyId,
      },
    });

    revalidatePath(`/dashboard/properties/${propertyId}`);
    return news;
  } catch (error) {
    console.error('Error creating property news:', error);
    throw error;
  }
}

export async function getPropertyNews(propertyId: string): Promise<PropertyNewsWithProperty[]> {
  try {
    const news = await prisma.propertyNews.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      distinct: ['propertyId'],
      include: {
        property: {
          select: {
            address: true,
            population: true
          }
        }
      }
    });

    // Convertir las fechas a strings y asegurarse de que todos los campos estén presentes
    return news.map(item => ({
      id: item.id,
      type: item.type,
      action: item.action,
      valuation: item.valuation,
      priority: item.priority,
      responsible: item.responsible,
      value: item.value,
      precioSM: item.precioSM,
      precioCliente: item.precioCliente,
      propertyId: item.propertyId,
      property: item.property,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }));
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