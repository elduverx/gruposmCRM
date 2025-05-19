// @ts-nocheck
'use server';

import { Property, PropertyCreateInput, Activity, DPV, Assignment } from '@/types/property';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { PropertyNewsWithProperty } from '@/types/prisma';
import { logActivity } from '@/lib/activityLogger';

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
    // Construir la consulta base
    const where = {
      ...(searchTerm 
        ? {
            OR: [
              { address: { contains: searchTerm } },
              { population: { contains: searchTerm } },
              { ownerName: { contains: searchTerm } },
              { ownerPhone: { contains: searchTerm } }
            ]
          }
        : {}),
      ...(zoneId ? { zoneId } : {})
    };

    // Obtener el total de propiedades que coinciden con el filtro
    const total = await prisma.property.count({ where });

    // Obtener las propiedades con paginación
    const properties = await prisma.property.findMany({
      where,
      include: {
        zone: true,
        activities: {
          orderBy: { date: 'desc' },
          take: 1
        },
        responsibleUser: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    });
    
    return {
      properties: properties.map(mapProperty),
      total
    };
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw new Error('Error al obtener las propiedades');
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
      type: 'PROPERTY_CREATED',
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
      type: 'PROPERTY_DELETED',
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
    throw new Error('Error getting activities');
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
    throw new Error('Error creating activity');
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
    throw new Error('Error creating/updating DPV');
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
    throw new Error('Error creating property news');
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
    throw new Error('Error getting property news');
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

    // Revalidar todas las rutas relevantes
    revalidatePath(`/dashboard/properties/${data.propertyId}`);
    revalidatePath('/dashboard/assignments');
    revalidatePath('/dashboard/properties');
    revalidatePath('/dashboard');

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
    throw new Error('Error creating assignment');
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
    throw new Error('Error getting assignments');
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
    throw new Error('Error getting assignments');
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
    
    // Revalidar todas las rutas relevantes
    revalidatePath(`/dashboard/properties/${assignment.propertyId}`);
    revalidatePath('/dashboard/assignments');
    revalidatePath('/dashboard/properties');
    revalidatePath('/dashboard');
    
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
    throw new Error('Error updating assignment');
  }
}

export async function deleteAssignment(id: string): Promise<boolean> {
  try {
    const assignment = await prisma.assignment.delete({
      where: { id }
    });
    
    // Revalidar todas las rutas relevantes
    revalidatePath(`/dashboard/properties/${assignment.propertyId}`);
    revalidatePath('/dashboard/assignments');
    revalidatePath('/dashboard/properties');
    revalidatePath('/dashboard');
    
    return true;
  } catch (error) {
    throw new Error('Error deleting assignment');
  }
}