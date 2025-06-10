// @ts-nocheck
'use server';

import { Property, PropertyCreateInput, Activity, DPV, Assignment } from '@/types/property';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { PropertyNewsWithProperty } from '@/types/prisma';
import { ActivityType } from '@prisma/client';
import { logActivity } from '@/lib/activityLogger';
import { getCurrentUserId } from '@/lib/auth';

// Type guards for database results
interface RawProperty {
  id: string;
  address: string;
  population: string | null;
  type: string;
  ownerName: string | null;
  ownerPhone: string | null;
  zoneId: string | null;
  status: string;
  action: string;
  captureDate: Date;
  responsibleId: string | null;
  hasSimpleNote: boolean;
  isOccupied: boolean;
  clientId: string | null;
  latitude: number | null;
  longitude: number | null;
  occupiedBy: string | null;
  isLocated: boolean;
  responsible: string | null;
  habitaciones: number | null;
  banos: number | null;
  metrosCuadrados: number | null;
  parking: boolean;
  ascensor: boolean;
  piscina: boolean;
  createdAt: Date;
  updatedAt: Date;
  zone?: { id: string; name: string } | null;
  activities?: RawActivity[];
  responsibleUser?: { id: string; name: string; email: string } | null;
  assignments?: RawAssignment[];
  clients?: { id: string; name: string; email: string }[];
  dpv?: RawDPV | null;
}

interface RawActivity {
  id: string;
  propertyId: string;
  type: string;
  notes: string | null;
  client: string | null;
  date: Date;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RawAssignment {
  id: string;
  propertyId: string;
  type: string;
  price: number;
  exclusiveUntil: Date;
  origin: string;
  clientId: string;
  sellerFeeType: string;
  sellerFeeValue: number;
  buyerFeeType: string;
  buyerFeeValue: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RawDPV {
  id: string;
  propertyId: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

// Type guard functions
function isRawProperty(obj: unknown): obj is RawProperty {
  return obj !== null && 
    typeof obj === 'object' && 
    'id' in obj && 
    'address' in obj;
}

function isRawActivity(obj: unknown): obj is RawActivity {
  return obj !== null && 
    typeof obj === 'object' && 
    'id' in obj && 
    'propertyId' in obj;
}

function isRawAssignment(obj: unknown): obj is RawAssignment {
  return obj !== null && 
    typeof obj === 'object' && 
    'id' in obj && 
    'propertyId' in obj;
}

function isRawDPV(obj: unknown): obj is RawDPV {
  return obj !== null && 
    typeof obj === 'object' && 
    'id' in obj && 
    'propertyId' in obj;
}

// Helper function to safely convert date to ISO string
function safeToISOString(date: unknown): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return new Date().toISOString();
}

// Helper function to safely map activities
function mapActivities(activities: unknown[]): Activity[] {
  if (!Array.isArray(activities)) return [];
  
  return activities.map(activity => {
    if (!isRawActivity(activity)) {
      return {
        id: '',
        propertyId: '',
        type: '',
        notes: null,
        client: null,
        date: new Date().toISOString(),
        status: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    return {
      ...activity,
      date: safeToISOString(activity.date),
      createdAt: safeToISOString(activity.createdAt),
      updatedAt: safeToISOString(activity.updatedAt)
    };
  });
}

// Helper function to safely map assignments
function mapAssignments(assignments: unknown[]): Assignment[] {
  if (!Array.isArray(assignments)) return [];
  
  return assignments.map(assignment => {
    if (!isRawAssignment(assignment)) {
      return {
        id: '',
        propertyId: '',
        type: '',
        price: 0,
        exclusiveUntil: new Date().toISOString(),
        origin: '',
        clientId: '',
        sellerFeeType: '',
        sellerFeeValue: 0,
        buyerFeeType: '',
        buyerFeeValue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    return {
      ...assignment,
      createdAt: safeToISOString(assignment.createdAt),
      updatedAt: safeToISOString(assignment.updatedAt),
      exclusiveUntil: safeToISOString(assignment.exclusiveUntil)
    };
  });
}

// Helper function to safely map clients
function mapClients(clients: unknown[]): { id: string; name: string; email: string }[] {
  if (!Array.isArray(clients)) return [];
  
  return clients.map(client => {
    if (typeof client !== 'object' || client === null) {
      return { id: '', name: '', email: '' };
    }
    
    const id = typeof (client as { id?: unknown }).id === 'string' ? (client as { id: string }).id : '';
    const name = typeof (client as { name?: unknown }).name === 'string' ? (client as { name: string }).name : '';
    const email = typeof (client as { email?: unknown }).email === 'string' ? (client as { email: string }).email : '';
    
    return { id, name, email };
  });
}

// Helper function to safely map responsible user
function mapResponsibleUser(user: unknown): { id: string; name: string; email: string } | null {
  if (typeof user !== 'object' || user === null) return null;
  
  const id = typeof (user as { id?: unknown }).id === 'string' ? (user as { id: string }).id : '';
  const name = typeof (user as { name?: unknown }).name === 'string' ? (user as { name: string }).name : '';
  const email = typeof (user as { email?: unknown }).email === 'string' ? (user as { email: string }).email : '';
  
  return { id, name, email };
}

// Helper function to safely map DPV
function mapDPV(dpv: unknown): DPV | null {
  if (!isRawDPV(dpv)) return null;
  
  const createdAt = safeToISOString(dpv.createdAt);
  const updatedAt = safeToISOString(dpv.updatedAt);
  
  return {
    ...dpv,
    createdAt,
    updatedAt
  };
}

// Helper function to safely map property
function mapProperty(property: unknown): Property {
  if (!isRawProperty(property)) {
    return {
      id: '',
      address: '',
      population: '',
      type: 'CASA',
      ownerName: '',
      ownerPhone: '',
      status: 'SALE',
      action: 'IR_A_DIRECCION',
      captureDate: new Date().toISOString(),
      responsibleId: null,
      hasSimpleNote: false,
      isOccupied: false,
      clientId: null,
      zoneId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      latitude: null,
      longitude: null,
      occupiedBy: null,
      isLocated: false,
      responsible: null,
      habitaciones: null,
      banos: null,
      metrosCuadrados: null,
      parking: false,
      ascensor: false,
      piscina: false,
      activities: [],
      zone: null,
      assignments: [],
      clients: [],
      dpv: null,
      responsibleUser: null,
      // Propiedades adicionales requeridas
      price: '',
      description: '',
      yearBuilt: '',
      isFurnished: false,
      ownerEmail: '',
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      notes: '',
    };
  }
  
  return {
    ...property,
    captureDate: safeToISOString(property.captureDate),
    createdAt: safeToISOString(property.createdAt),
    updatedAt: safeToISOString(property.updatedAt),
    activities: property.activities ? mapActivities(property.activities) : [],
    zone: property.zone || null,
    assignments: property.assignments ? mapAssignments(property.assignments) : [],
    clients: property.clients ? mapClients(property.clients) : [],
    dpv: property.dpv ? mapDPV(property.dpv) : null,
    responsibleUser: mapResponsibleUser(property.responsibleUser),
    // Si tenemos un usuario responsable, utilizar su nombre como valor de responsible
    responsible: property.responsibleUser?.name || property.responsible || null,
    // Propiedades adicionales requeridas con valores por defecto
    price: '',
    description: '',
    yearBuilt: '',
    isFurnished: false,
    ownerEmail: '',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    notes: '',
  };
}

export async function getProperties(
  page: number = 1,
  limit: number = 20,
  searchTerm: string = '',
  sortBy: string = 'updatedAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  zoneId?: string
): Promise<{ properties: Property[]; total: number }> {
  try {
    const skip = (page - 1) * limit;
    
    // Construir la condición where
    const whereCondition = {
      AND: [
        searchTerm ? {
          OR: [
            { address: { contains: searchTerm, mode: 'insensitive' } },
            { population: { contains: searchTerm, mode: 'insensitive' } },
            { ownerName: { contains: searchTerm, mode: 'insensitive' } }
          ]
        } : {},
        zoneId ? { zoneId } : {}
      ]
    };
    
    // Ejecutar las consultas en paralelo
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        skip,
        take: limit,
        where: whereCondition,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          zone: {
            select: {
              id: true,
              name: true
            }
          },
          responsibleUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          activities: true,
          assignments: true,
          clients: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          dpv: true
        }
      }),
      prisma.property.count({
        where: whereCondition
      })
    ]);
    
    return {
      properties: properties.map(mapProperty),
      total
    };
  } catch (error) {
    throw new Error(`Error al obtener propiedades: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

    return mapProperty(property);
  } catch (error) {
    throw new Error('Error getting property');
  }
}

export async function createProperty(data: PropertyCreateInput): Promise<Property | null> {
  try {
    const property = await prisma.property.create({
      data: {
        ...data,
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
      },
    });

    // Registrar la actividad
    await logActivity({
      type: 'OTROS' as ActivityType,
      description: `Nueva propiedad creada: ${property.address}`,
      relatedId: property.id,
      relatedType: 'PROPERTY',
      metadata: {
        address: property.address,
        type: property.type,
        status: property.status
      }
    });

    revalidatePath('/dashboard/properties');
    return property;
  } catch (error) {
    throw new Error('Error creating property');
  }
}

export async function updateProperty(id: string, data: Partial<Property>): Promise<Property | null> {
  try {
    const property = await prisma.property.update({
      where: { id },
      data
    });
    return property;
  } catch (error) {
    throw new Error('Error al actualizar la propiedad');
  }
}

export async function deleteProperty(id: string): Promise<boolean> {
  try {
    const property = await prisma.property.findUnique({
      where: { id }
    });

    if (!property) {
      return false;
    }

    await prisma.property.delete({
      where: { id }
    });

    // Registrar la actividad
    await logActivity({
      type: 'OTROS' as ActivityType,
      description: `Propiedad eliminada: ${property.address}`,
      relatedId: property.id,
      relatedType: 'PROPERTY',
      metadata: {
        address: property.address,
        type: property.type,
        status: property.status
      }
    });

    revalidatePath('/dashboard/properties');
    return true;
  } catch (error) {
    throw new Error('Error deleting property');
  }
}

// Funciones para actividades
export async function getActivitiesByPropertyId(propertyId: string): Promise<Activity[]> {
  try {
    const activities = await prisma.activity.findMany({
      where: { propertyId },
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
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
        updatedAt: updatedAt.toISOString(),
        user: activity.user ? {
          id: activity.user.id,
          name: activity.user.name,
          email: activity.user.email
        } : null
      };
    });
  } catch (error) {
    console.error('Error detallado al obtener actividades:', error);
    throw new Error(`Error getting activities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createActivity(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Activity | null> {
  try {
    const activityDate = typeof data.date === 'string' ? new Date(data.date) : data.date;

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      throw new Error('No hay un usuario autenticado');
    }

    // Validate that type is a valid ActivityType
    const validTypes = ['DPV', 'NOTICIA', 'ENCARGO', 'VISITA', 'LLAMADA', 'EMAIL', 'OTROS'];
    if (!validTypes.includes(data.type)) {
      throw new Error(`Tipo de actividad inválido: ${data.type}. Valores permitidos: ${validTypes.join(', ')}`);
    }

    // Set proper metadata for activity status
    const metadata = {
      status: data.status === 'Realizada' ? 'completed' : 'pending',
      date: activityDate.toISOString(),
      type: data.type,
      notes: data.notes
    };

    const activity = await prisma.activity.create({
      data: {
        type: data.type, // ActivityType is now properly typed
        status: data.status,
        client: data.client || null,
        notes: data.notes || null,
        date: activityDate,
        metadata: metadata as Prisma.JsonValue,
        user: {
          connect: {
            id: currentUserId
          }
        },
        property: {
          connect: {
            id: data.propertyId
          }
        }
      },
      include: {
        property: {
          select: {
            id: true,
            address: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log user activity
    try {
      await logActivity({
        type: data.type,
        description: `Nueva actividad creada: ${data.type} para ${activity.property.address}`,
        relatedId: activity.id,
        relatedType: 'PROPERTY_ACTIVITY',
        metadata: {
          propertyId: data.propertyId,
          type: data.type,
          status: data.status,
          date: activityDate
        },
        points: 1
      });
    } catch (logError) {
      // Log the error but don't fail the activity creation
      console.error('Error al registrar la actividad en el historial:', logError);
    }

    revalidatePath(`/dashboard/properties/${data.propertyId}`);

    if (!activity) {
      return null;
    }

    return {
      ...activity,
      createdAt: activity.createdAt.toISOString(),
      updatedAt: activity.updatedAt.toISOString(),
      date: activity.date.toISOString(),
    };
  } catch (error) {
    console.error('Error creating activity:', error);
    if (error instanceof Error) {
      throw new Error(`Error creating activity: ${error.message}`);
    }
    throw new Error('Error creating activity: Unknown error');
  }
}

// Funciones para DPV
export async function getDPVByPropertyId(propertyId: string): Promise<DPV | null> {
  try {
    const dpv = await prisma.dPV.findFirst({
      where: { propertyId }
    });
    
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
    throw new Error('Error fetching DPV');
  }
}

export async function createOrUpdateDPV(propertyId: string, data: Omit<DPV, 'id' | 'createdAt' | 'updatedAt'>): Promise<DPV | null> {
  try {
    // Validar datos requeridos
    if (!propertyId) {
      throw new Error('El ID de la propiedad es requerido');
    }

    // Validar que links sea un array
    if (!Array.isArray(data.links)) {
      throw new Error('El campo links debe ser un array de strings');
    }

    // Convertir y validar valores numéricos
    let currentPrice: number | null = null;
    if (data.currentPrice !== null && data.currentPrice !== undefined) {
      const numValue = Number(data.currentPrice);
      if (isNaN(numValue)) {
        throw new Error('El precio actual debe ser un número válido');
      }
      currentPrice = numValue;
    }

    let estimatedValue: number | null = null;
    if (data.estimatedValue !== null && data.estimatedValue !== undefined) {
      const numValue = Number(data.estimatedValue);
      if (isNaN(numValue)) {
        throw new Error('El valor estimado debe ser un número válido');
      }
      estimatedValue = numValue;
    }

    const dpv = await prisma.dPV.upsert({
      where: { propertyId },
      create: {
        ...data,
        currentPrice,
        estimatedValue,
        propertyId,
        links: Array.isArray(data.links) ? data.links : []
      },
      update: {
        ...data,
        currentPrice,
        estimatedValue,
        links: Array.isArray(data.links) ? data.links : []
      },
      include: {
        property: {
          select: {
            address: true
          }
        }
      }
    });
    
    // Log user activity with consistent DPV type
    try {
      await logActivity({
        type: 'DPV' as ActivityType,
        description: `DPV ${dpv.id ? 'actualizado' : 'creado'} para ${dpv.property.address}`,
        relatedId: dpv.id,
        relatedType: 'PROPERTY_DPV',
        metadata: {
          propertyId,
          currentPrice: data.currentPrice,
          estimatedValue: data.estimatedValue,
          realEstate: data.realEstate,
          links: data.links
        },
        points: 3 // Puntos fijos por DPV
      });
    } catch (logError) {
      // Just log the error but don't fail the DPV operation
      // This ensures DPV is created/updated even if activity logging fails
      console.error('Error al registrar la actividad del DPV:', logError);
      if (process.env.NODE_ENV === 'development') {
        // In development, log the full error for debugging
        console.error('Stack trace:', logError instanceof Error ? logError.stack : '');
      }
      // Log to your error tracking service if needed
      // reportError(logError);
    }

    revalidatePath(`/dashboard/properties/${propertyId}`);
    revalidatePath('/dashboard/users');  // Revalidar la página de usuarios para actualizar estadísticas

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
    console.error('Error al crear/actualizar DPV:', error);
    if (error instanceof Error) {
      throw new Error(`Error al crear/actualizar DPV: ${error.message}`);
    }
    throw new Error('Error al crear/actualizar DPV: Error desconocido');
  }
}

// Funciones para noticias de propiedades
export async function getPropertyNews(propertyId: string): Promise<PropertyNewsWithProperty[]> {
  try {
    const news = await prisma.propertyNews.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
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
    return news;
  } catch (error) {
    throw new Error('Error getting property news');
  }
}

export async function createPropertyNews(data: Omit<PropertyNewsWithProperty, 'id' | 'createdAt' | 'updatedAt' | 'property'>): Promise<PropertyNewsWithProperty> {
  try {
    // Validate required propertyId
    if (!data.propertyId) {
      throw new Error('propertyId is required');
    }

    // Convert value to number and validate
    const numericValue = data.value !== undefined && data.value !== null 
      ? typeof data.value === 'string' 
        ? parseFloat(data.value) 
        : Number(data.value)
      : 0;

    if (isNaN(numericValue)) {
      throw new Error('Invalid value provided. Must be a valid number.');
    }

    const news = await prisma.propertyNews.create({
      data: {
        type: data.type,          // Default DPV added in schema
        action: data.action,      // Default Venta added in schema
        valuation: data.valuation, // Default No added in schema
        priority: data.priority,   // Default LOW added in schema
        responsible: data.responsible, // Default Sin asignar added in schema
        value: numericValue,
        propertyId: data.propertyId,
        precioSM: data.precioSM || null,
        precioCliente: data.precioCliente || null,
        commissionType: data.commissionType,   // Default percentage added in schema
        commissionValue: data.commissionValue, // Default 3 added in schema
        isDone: false
      },
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

    // Obtener metas activas de tipo NEWS del usuario actual y registrar la actividad
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        const activeNewsGoals = await prisma.userGoal.findMany({
          where: {
            userId: userId,
            category: 'NEWS',
            isCompleted: false
          }
        });

        // Registrar la actividad y enlazarla con cada meta NEWS activa
        for (const goal of activeNewsGoals) {
          await logActivity({
            type: 'NOTICIA' as ActivityType,
            description: `Nueva noticia creada: ${news.type} para ${news.property.address}`,
            relatedId: news.id,
            relatedType: 'PROPERTY_NEWS',
            metadata: {
              propertyId: data.propertyId,
              type: data.type,
              action: data.action,
              priority: data.priority
            },
            points: 2,
            goalId: goal.id
          });
        }

        // Si no hay metas activas, registrar la actividad sin goalId
        if (activeNewsGoals.length === 0) {
          await logActivity({
            type: 'NOTICIA' as ActivityType,
            description: `Nueva noticia creada: ${news.type} para ${news.property.address}`,
            relatedId: news.id,
            relatedType: 'PROPERTY_NEWS',
            metadata: {
              propertyId: data.propertyId,
              type: data.type,
              action: data.action,
              priority: data.priority
            },
            points: 2
          });
        }
      }
    } catch (logError) {
      // Log the error but don't fail the news creation
      console.error('Error al registrar la actividad de la noticia:', logError);
      if (process.env.NODE_ENV === 'development') {
        console.error('Stack trace:', logError instanceof Error ? logError.stack : '');
      }
    }

    revalidatePath(`/dashboard/properties/${data.propertyId}`);
    revalidatePath('/dashboard/users');  // Revalidar la página de usuarios para actualizar estadísticas
    revalidatePath('/dashboard/metas');  // Revalidar la página de metas para actualizar el progreso
    return news;
  } catch (error) {
    console.error('Error creating property news:', error);
    if (error instanceof Error) {
      throw new Error(`Error creating property news: ${error.message}`);
    }
    throw new Error('Error creating property news: Unknown error');
  }
}

// Funciones para encargos
export async function getAssignmentsByPropertyId(propertyId: string): Promise<Assignment[]> {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return assignments.map(assignment => ({
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      exclusiveUntil: assignment.exclusiveUntil.toISOString()
    }));
  } catch (error) {
    throw new Error('Error getting assignments');
  }
}

export async function createAssignment(data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assignment> {
  try {
    const assignment = await prisma.assignment.create({
      data: {
        type: data.type,
        price: data.price,
        exclusiveUntil: new Date(data.exclusiveUntil),
        origin: data.origin,
        clientId: data.clientId,
        propertyId: data.propertyId,
        sellerFeeType: data.sellerFeeType,
        sellerFeeValue: data.sellerFeeValue,
        buyerFeeType: data.buyerFeeType,
        buyerFeeValue: data.buyerFeeValue
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
            population: true,
            type: true,
            status: true
          }
        }
      }
    });

    // Log activity
    try {
      await logActivity({
        type: 'ENCARGO' as ActivityType,
        description: `Nuevo encargo creado: ${assignment.type} para ${data.propertyId}`,
        relatedId: assignment.id,
        relatedType: 'PROPERTY_ASSIGNMENT',
        metadata: {
          propertyId: data.propertyId,
          type: data.type,
          price: data.price,
          clientId: data.clientId
        },
        points: 2
      });
    } catch (logError) {
      // Log the error but don't fail the assignment creation
      console.error('Error al registrar la actividad del encargo:', logError);
      if (process.env.NODE_ENV === 'development') {
        console.error('Stack trace:', logError instanceof Error ? logError.stack : '');
      }
    }

    // Revalidar rutas afectadas
    revalidatePath(`/dashboard/properties/${data.propertyId}`);
    revalidatePath('/dashboard/users');  // Revalidar la página de usuarios para actualizar estadísticas
    revalidatePath('/dashboard/assignments'); // Revalidar la lista de asignaciones
    return {
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      exclusiveUntil: assignment.exclusiveUntil.toISOString(),
      property: {
        id: assignment.property.id,
        address: assignment.property.address,
        population: assignment.property.population || '',
        type: assignment.property.type || '',
        status: assignment.property.status || ''
      }
    };
  } catch (error) {
    console.error('Error creating assignment:', error);
    if (error instanceof Error) {
      throw new Error(`Error creating assignment: ${error.message}`);
    }
    throw new Error('Error creating assignment: Unknown error');
  }
}

export async function updateAssignment(id: string, data: Partial<Assignment>): Promise<Assignment> {
  try {
    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        ...data,
        exclusiveUntil: data.exclusiveUntil ? new Date(data.exclusiveUntil) : undefined
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    revalidatePath(`/dashboard/properties/${assignment.propertyId}`);
    return {
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      exclusiveUntil: assignment.exclusiveUntil.toISOString()
    };
  } catch (error) {
    throw new Error('Error updating assignment');
  }
}

export async function deleteAssignment(id: string): Promise<boolean> {
  try {
    const assignment = await prisma.assignment.delete({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            address: true
          }
        }
      }
    });

    // Log activity
    try {
      await logActivity({
        type: 'ENCARGO' as ActivityType,
        description: `Encargo eliminado: ${assignment.type} para ${assignment.property.address}`,
        relatedId: assignment.id,
        relatedType: 'PROPERTY_ASSIGNMENT',
        metadata: {
          propertyId: assignment.propertyId,
          type: assignment.type
        },
        points: 1
      });
    } catch (logError) {
      // Log the error but don't fail the assignment deletion
      console.error('Error al registrar la actividad de eliminación del encargo:', logError);
      if (process.env.NODE_ENV === 'development') {
        console.error('Stack trace:', logError instanceof Error ? logError.stack : '');
      }
    }

    // Revalidar rutas afectadas
    revalidatePath(`/dashboard/properties/${assignment.propertyId}`);
    revalidatePath('/dashboard/users');  // Revalidar la página de usuarios para actualizar estadísticas
    revalidatePath('/dashboard/assignments'); // Revalidar la página de assignments
    revalidatePath('/dashboard/assignments/list'); // Revalidar la lista de asignaciones
    revalidatePath('/dashboard'); // Revalidar el dashboard por si hay widgets de asignaciones
    return true;
  } catch (error) {
    return false;
  }
}

export async function getAssignments(): Promise<Assignment[]> {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        property: {
          select: {
            id: true,
            address: true,
            population: true,
            type: true,
            status: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return assignments.map(assignment => {
      return {
        ...assignment,
        exclusiveUntil: assignment.exclusiveUntil.toISOString(),
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
        property: {
          id: assignment.property.id,
          address: assignment.property.address,
          population: assignment.property.population || '',
          type: assignment.property.type || '',
          status: assignment.property.status || ''
        }
      };
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
}