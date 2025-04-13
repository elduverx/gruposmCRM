// @ts-nocheck
'use server';

import { Property, PropertyCreateInput, Activity, DPV, Assignment, PropertyType, PropertyAction, OperationType } from '@/types/property';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { PropertyNewsWithProperty } from '@/types/prisma';

export async function getProperties(): Promise<Property[]> {
  try {
    const properties = await prisma.property.findMany({
      include: {
        zone: true,
        activities: true,
        responsibleUser: true
      }
    });
    
    return properties.map((property): Property => ({
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
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error('Error getting properties:', error.message);
    }
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
        responsibleUser: true,
        assignments: true,
        dpv: true,
        clients: true
      }
    });

    if (!property) return null;

    // Asegurarse de que las propiedades existan antes de acceder a ellas
    return {
      ...property,
      createdAt: property.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: property.updatedAt?.toISOString() || new Date().toISOString(),
      activities: Array.isArray(property.activities) 
        ? property.activities.map(activity => ({
            ...activity,
            createdAt: activity.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: activity.updatedAt?.toISOString() || new Date().toISOString()
          }))
        : []
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting property:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function createProperty(data: PropertyCreateInput): Promise<Property> {
  try {
    // Ensure status is a valid OperationType enum value
    const validStatus = data.status || OperationType.SALE;
    
    const property = await prisma.property.create({
      data: {
        address: data.address,
        population: data.population,
        status: validStatus,
        action: data.action || PropertyAction.IR_A_DIRECCION,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        responsibleId: data.responsibleId,
        hasSimpleNote: data.hasSimpleNote || false,
        isOccupied: data.isOccupied || false,
        clientId: data.clientId,
        zoneId: data.zoneId,
        latitude: data.latitude,
        longitude: data.longitude,
        occupiedBy: data.occupiedBy,
        type: data.type || PropertyType.PISO,
        isLocated: data.isLocated || false,
        responsible: data.responsible,
        habitaciones: data.habitaciones,
        banos: data.banos,
        metrosCuadrados: data.metrosCuadrados,
        parking: data.parking || false,
        ascensor: data.ascensor || false,
        piscina: data.piscina || false,
      },
    });

    return property;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating property:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Error al crear la propiedad');
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

    if (!property) {
      return null;
    }

    // Asegurarse de que las propiedades existan antes de acceder a ellas
    const formattedProperty = {
      ...property,
      createdAt: property.createdAt ? new Date(property.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: property.updatedAt ? new Date(property.updatedAt).toISOString() : new Date().toISOString(),
      activities: Array.isArray(property.activities) 
        ? property.activities.map(activity => ({
            ...activity,
            createdAt: activity.createdAt ? new Date(activity.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: activity.updatedAt ? new Date(activity.updatedAt).toISOString() : new Date().toISOString()
          }))
        : []
    };

    return formattedProperty;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating property:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function deleteProperty(id: string): Promise<boolean> {
  try {
    // Primero eliminar registros relacionados
    await prisma.$transaction(async (tx) => {
      // Eliminar actividades
      await tx.activity.deleteMany({
        where: { propertyId: id }
      });
      
      // Eliminar DPV
      await tx.dPV.deleteMany({
        where: { propertyId: id }
      });
      
      // Eliminar noticias
      await tx.propertyNews.deleteMany({
        where: { propertyId: id }
      });
      
      // Eliminar asignaciones
      await tx.assignment.deleteMany({
        where: { propertyId: id }
      });
      
      // Eliminar referencias de clientes a la propiedad
      await tx.client.updateMany({
        where: {
          properties: {
            some: {
              id: id
            }
          }
        },
        data: {
          properties: {
            disconnect: {
              id: id
            }
          }
        }
      });
      
      // Finalmente eliminar la propiedad
      await tx.property.delete({
        where: { id }
      });
    });
    
    // eslint-disable-next-line no-console
    console.log('Property and related records deleted:', id);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting property:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// Funciones para actividades
export async function getActivitiesByPropertyId(propertyId: string): Promise<Activity[]> {
  try {
    const activities = await prisma.activity.findMany({
      where: { propertyId },
      orderBy: { date: 'desc' }
    });

    if (!Array.isArray(activities)) {
      return [];
    }

    return activities.map(activity => {
      // Asegurarse de que las fechas sean válidas
      const date = activity.date ? new Date(activity.date) : new Date();
      const createdAt = activity.createdAt ? new Date(activity.createdAt) : new Date();
      const updatedAt = activity.updatedAt ? new Date(activity.updatedAt) : new Date();

      return {
        id: activity.id,
        propertyId: activity.propertyId,
        type: activity.type || '',
        status: activity.status || '',
        client: activity.client,
        notes: activity.notes,
        date: date.toLocaleDateString('es-ES'),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      };
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting activities:', error instanceof Error ? error.message : 'Unknown error');
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

    if (!activity) {
      return null;
    }

    // Asegurarse de que las fechas sean válidas
    const date = activity.date ? new Date(activity.date) : new Date();
    const createdAt = activity.createdAt ? new Date(activity.createdAt) : new Date();
    const updatedAt = activity.updatedAt ? new Date(activity.updatedAt) : new Date();

    return {
      ...activity,
      date: date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating activity:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Funciones para DPV
export async function getDPVByPropertyId(propertyId: string): Promise<DPV | null> {
  try {
    const dpv = await prisma.dPV.findFirst({
      where: { propertyId }
    });
    
    // eslint-disable-next-line no-console
    console.log('DPV fetched for property:', propertyId, dpv ? 'found' : 'not found');
    
    if (!dpv) return null;
    
    return {
      id: dpv.id,
      propertyId: dpv.propertyId,
      links: dpv.links as string[],
      realEstate: dpv.realEstate,
      phone: dpv.phone,
      currentPrice: dpv.currentPrice,
      estimatedValue: dpv.estimatedValue,
      createdAt: dpv.createdAt.toISOString(),
      updatedAt: dpv.updatedAt.toISOString()
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching DPV:', error instanceof Error ? error.message : 'Unknown error');
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

    // Asegurar que links sea un array de strings
    const links = Array.isArray(dpv.links) 
      ? (dpv.links as unknown[]).filter((link): link is string => typeof link === 'string')
      : [];

    return {
      ...dpv,
      links,
      createdAt: dpv.createdAt.toISOString(),
      updatedAt: dpv.updatedAt.toISOString()
    };
  } catch (error) {
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error('Error creating/updating DPV:', error.message);
    }
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
    // eslint-disable-next-line no-console
    console.error('Error creating property news:', error instanceof Error ? error.message : 'Unknown error');
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
            id: true,
            address: true,
            population: true,
            zoneId: true
          }
        }
      }
    });

    // Corregir los problemas de seguridad de tipos
    return news.map(item => {
      // Asegurarse de que item es un objeto válido
      if (!item || typeof item !== 'object') {
        return null;
      }
      
      // Validar y convertir los valores
      const value = typeof item.value === 'string' ? parseFloat(item.value) : (item.value || 0);
      const precioSM = item.precioSM !== null ? (typeof item.precioSM === 'string' ? parseFloat(item.precioSM) : item.precioSM) : null;
      const precioCliente = item.precioCliente !== null ? (typeof item.precioCliente === 'string' ? parseFloat(item.precioCliente) : item.precioCliente) : null;
      
      // Crear un objeto seguro con las propiedades necesarias
      const safeItem: PropertyNewsWithProperty = {
        id: item.id || '',
        propertyId: item.propertyId || '',
        type: item.type || '',
        action: item.action || '',
        valuation: typeof item.valuation === 'string' ? item.valuation === 'true' : Boolean(item.valuation),
        priority: item.priority === 'HIGH' ? 'HIGH' : 'LOW',
        responsible: item.responsible || '',
        value: value,
        precioSM: precioSM,
        precioCliente: precioCliente,
        createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt || Date.now()),
        updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt || Date.now()),
        property: {
          id: item.property?.id || '',
          address: item.property?.address || '',
          population: item.property?.population || '',
          zoneId: item.property?.zoneId || ''
        }
      };
      
      return safeItem;
    }).filter(Boolean) as PropertyNewsWithProperty[];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting property news:', error instanceof Error ? error.message : 'Unknown error');
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
        client: true,
        property: true
      }
    });

    return {
      ...assignment,
      exclusiveUntil: assignment.exclusiveUntil.toISOString(),
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      client: assignment.client ? {
        id: assignment.client.id,
        name: assignment.client.name,
        email: assignment.client.email,
        phone: assignment.client.phone
      } : undefined,
      property: assignment.property ? {
        id: assignment.property.id,
        address: assignment.property.address,
        population: assignment.property.population
      } : undefined
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating assignment:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function getAssignmentsByPropertyId(propertyId: string): Promise<Assignment[]> {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { propertyId },
      include: {
        client: true,
        property: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return assignments.map(assignment => ({
      ...assignment,
      exclusiveUntil: assignment.exclusiveUntil.toISOString(),
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      client: assignment.client ? {
        id: assignment.client.id,
        name: assignment.client.name,
        email: assignment.client.email,
        phone: assignment.client.phone
      } : undefined,
      property: assignment.property ? {
        id: assignment.property.id,
        address: assignment.property.address,
        population: assignment.property.population
      } : undefined
    }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting assignments:', error instanceof Error ? error.message : 'Unknown error');
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
        client: true,
        property: true
      }
    });
    return assignments;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting assignments:', error instanceof Error ? error.message : 'Unknown error');
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
        buyerFeeValue: data.buyerFeeValue
      }
    });
    
    // eslint-disable-next-line no-console
    console.log('Assignment updated:', id);
    
    revalidatePath(`/dashboard/properties/${assignment.propertyId}`);
    return {
      id: assignment.id,
      type: assignment.type,
      price: assignment.price,
      exclusiveUntil: assignment.exclusiveUntil,
      origin: assignment.origin,
      clientId: assignment.clientId,
      sellerFeeType: assignment.sellerFeeType,
      sellerFeeValue: assignment.sellerFeeValue,
      buyerFeeType: assignment.buyerFeeType,
      buyerFeeValue: assignment.buyerFeeValue,
      propertyId: assignment.propertyId,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString()
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating assignment:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function deleteAssignment(id: string): Promise<boolean> {
  try {
    const assignment = await prisma.assignment.delete({
      where: { id }
    });
    
    // eslint-disable-next-line no-console
    console.log('Assignment deleted:', id);
    
    revalidatePath(`/dashboard/properties/${assignment.propertyId}`);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting assignment:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}