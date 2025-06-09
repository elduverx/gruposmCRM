/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activityLogger';
import { ActivityType } from '@/types/activity';

export type Zone = {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  coordinates: { lat: number; lng: number }[];
  createdAt: Date;
  updatedAt: Date;
};

export async function getZones(): Promise<Zone[]> {
  try {
    const zones = await prisma.zone.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return zones.map((zone: { 
      id: string; 
      name: string; 
      description?: string | null; 
      color: string; 
      coordinates: any; 
      createdAt: Date; 
      updatedAt: Date; 
    }) => ({
      ...zone,
      coordinates: JSON.parse(zone.coordinates as string),
    }));
  } catch (error) {
    throw new Error(`Error al cargar las zonas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function getZoneById(id: string): Promise<Zone | null> {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id },
    });
    
    if (!zone) return null;
    
    return {
      ...zone,
      coordinates: JSON.parse(zone.coordinates as string),
    };
  } catch (error) {
    throw new Error(`Error al cargar la zona: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Función para calcular el bounding box de un polígono
function getBoundingBox(coordinates: { lat: number; lng: number }[]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  return coordinates.reduce(
    (box, coord) => ({
      minLat: Math.min(box.minLat, coord.lat),
      maxLat: Math.max(box.maxLat, coord.lat),
      minLng: Math.min(box.minLng, coord.lng),
      maxLng: Math.max(box.maxLng, coord.lng),
    }),
    {
      minLat: coordinates[0].lat,
      maxLat: coordinates[0].lat,
      minLng: coordinates[0].lng,
      maxLng: coordinates[0].lng,
    }
  );
}

interface Property {
  id: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

// Función para procesar propiedades en lotes
async function processPropertiesInBatches(
  properties: Property[],
  zoneId: string,
  zoneName: string,
  coordinates: { lat: number; lng: number }[],
  batchSize: number = 50
) {
  const propertyIds: string[] = [];

  // Procesar propiedades en lotes
  for (let i = 0; i < properties.length; i += batchSize) {
    const batch = properties.slice(i, i + batchSize);
    
    // Filtrar propiedades que están dentro del polígono
    const propertiesInZone = batch.filter(property => {
      if (!property.latitude || !property.longitude) return false;
      return isPointInPolygon(
        [property.latitude, property.longitude],
        coordinates.map(coord => [coord.lat, coord.lng])
      );
    });

    // Acumular IDs
    propertiesInZone.forEach(property => {
      propertyIds.push(property.id);
    });
  }

  // Actualizar todas las propiedades en una sola operación
  if (propertyIds.length > 0) {
    await prisma.property.updateMany({
      where: {
        id: { in: propertyIds }
      },
      data: { zoneId }
    });
  }

  return propertyIds.length;
}

export async function createZone(data: Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>): Promise<Zone> {
  try {
    // Crear la zona
    const zone = await prisma.zone.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        coordinates: JSON.stringify(data.coordinates)
      },
    });

    // Registrar la actividad de creación
    await logActivity({
      type: ActivityType.OTROS,
      description: `Nueva zona creada: ${zone.name}`,
      relatedId: zone.id,
      relatedType: 'ZONE',
      metadata: {
        name: zone.name,
        description: zone.description,
        coordinates: data.coordinates
      }
    });

    // Calcular el bounding box de la zona
    const boundingBox = getBoundingBox(data.coordinates);

    // Obtener propiedades dentro del bounding box
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { latitude: { gte: boundingBox.minLat } },
          { latitude: { lte: boundingBox.maxLat } },
          { longitude: { gte: boundingBox.minLng } },
          { longitude: { lte: boundingBox.maxLng } }
        ]
      }
    });

    // Procesar propiedades en lotes
    const assignedCount = await processPropertiesInBatches(
      properties,
      zone.id,
      zone.name,
      data.coordinates
    );

    console.log(`Asignadas ${assignedCount} propiedades a la zona ${zone.name}`);
    
    revalidatePath('/dashboard/zones');
    
    return {
      ...zone,
      coordinates: JSON.parse(zone.coordinates as string),
    };
  } catch (error) {
    console.error('Error creating zone:', error);
    throw new Error('Error al crear la zona');
  }
}

// Función auxiliar para verificar si un punto está dentro de un polígono
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

export async function updateZone(data: Zone): Promise<Zone> {
  try {
    const zone = await prisma.zone.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        coordinates: JSON.stringify(data.coordinates)
      },
    });

    // Registrar la actividad
    await logActivity({
      type: ActivityType.OTROS,
      description: `Zona actualizada: ${zone.name}`,
      relatedId: zone.id,
      relatedType: 'ZONE',
      metadata: {
        name: zone.name,
        description: zone.description,
        coordinates: data.coordinates
      }
    });

    revalidatePath('/dashboard/zones');
    return {
      ...zone,
      coordinates: JSON.parse(zone.coordinates as string),
    };
  } catch (error) {
    console.error('Error updating zone:', error);
    throw new Error('Error al actualizar la zona');
  }
}

export async function deleteZone(id: string): Promise<boolean> {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id }
    });

    if (!zone) {
      return false;
    }

    await prisma.zone.delete({
      where: { id }
    });

    // Registrar la actividad
    await logActivity({
      type: ActivityType.OTROS,
      description: `Zona eliminada: ${zone.name}`,
      relatedId: zone.id,
      relatedType: 'ZONE',
      metadata: {
        name: zone.name,
        description: zone.description
      }
    });

    revalidatePath('/dashboard/zones');
    return true;
  } catch (error) {
    console.error('Error deleting zone:', error);
    return false;
  }
}

export async function assignPropertyToZone(propertyId: string, zoneId: string | null): Promise<void> {
  try {
    if (zoneId === null) {
      await prisma.property.update({
        where: { id: propertyId },
        data: { zoneId: null },
      });
      revalidatePath('/dashboard/zones');
      return;
    }

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      throw new Error('La zona especificada no existe');
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: { zoneId },
    });
    
    revalidatePath('/dashboard/zones');
  } catch (error) {
    console.error('Error assigning property to zone:', error);
    throw new Error('Error al asignar el inmueble a la zona');
  }
}

export async function getPropertiesInZone(zoneId: string) {
  try {
    const properties = await prisma.property.findMany({
      where: { zoneId },
      orderBy: { createdAt: 'desc' },
    });
    
    return properties;
  } catch (error) {
    console.error('Error fetching properties in zone:', error);
    throw new Error('Error al cargar los inmuebles de la zona');
  }
}

export async function getZoneNewsAndAssignments(zoneId: string) {
  try {
    // Obtener las propiedades de la zona
    const properties = await prisma.property.findMany({
      where: { zoneId },
      select: { id: true }
    });

    const propertyIds = properties.map((p: { id: string }) => p.id);

    // Obtener las noticias de las propiedades
    const news = await prisma.propertyNews.findMany({
      where: {
        propertyId: {
          in: propertyIds
        }
      },
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

    // Obtener los encargos de las propiedades
    const assignments = await prisma.assignment.findMany({
      where: {
        propertyId: {
          in: propertyIds
        }
      },
      orderBy: { createdAt: 'desc' },
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

    return {
      news: news.map((item: { 
        id: string; 
        createdAt: Date; 
        updatedAt: Date; 
        type: string;
        action: string;
        valuation: string;
        priority: string;
        responsible: string | null;
        value: number | null;
        propertyId: string;
        property: {
          id: string;
          address: string;
          population: string;
          zoneId: string | null;
        };
      }) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      })),
      assignments: assignments.map((item: { 
        id: string; 
        createdAt: Date; 
        updatedAt: Date; 
        exclusiveUntil: Date;
        type: string;
        price: number;
        origin: string;
        clientId: string;
        propertyId: string;
        sellerFeeType: string;
        sellerFeeValue: number;
        buyerFeeType: string;
        buyerFeeValue: number;
        client: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
        };
        property: {
          id: string;
          address: string;
          population: string;
        };
      }) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        exclusiveUntil: item.exclusiveUntil.toISOString()
      }))
    };
  } catch (error) {
    console.error('Error fetching zone news and assignments:', error);
    throw new Error('Error al cargar las noticias y encargos de la zona');
  }
}

// Get users assigned to a zone
export async function getUsersByZoneId(zoneId: string) {
  try {
    // Using type assertion to handle the Prisma type issue
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        // @ts-ignore - The Prisma types don't recognize the new relationship yet
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (!zone) {
      throw new Error('Zona no encontrada');
    }
    
    // @ts-ignore - The Prisma types don't recognize the new relationship yet
    return zone.users;
  } catch (error) {
    console.error('Error getting users for zone:', error);
    throw new Error('Error al obtener usuarios para la zona');
  }
}

// Get all users for assignment
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Error al obtener usuarios');
  }
}

// Assign users to a zone
export async function assignUsersToZone(zoneId: string, userIds: string[]) {
  try {
    // Get current users
    const currentUsers = await getUsersByZoneId(zoneId);
    const currentUserIds = currentUsers.map(user => user.id);
    
    // Determine which users to connect and which to disconnect
    const usersToConnect = userIds.filter(id => !currentUserIds.includes(id));
    const usersToDisconnect = currentUserIds.filter(id => !userIds.includes(id));
    
    // Update the zone with new user connections
    // @ts-ignore - The Prisma types don't recognize the new relationship yet
    await prisma.zone.update({
      where: { id: zoneId },
      data: {
        users: {
          connect: usersToConnect.map(id => ({ id })),
          disconnect: usersToDisconnect.map(id => ({ id }))
        }
      }
    });
    
    // Log the activity
    await logActivity({
      type: ActivityType.OTROS,
      description: `Usuarios asignados a zona ${zoneId}`,
      relatedId: zoneId,
      relatedType: 'ZONE',
      metadata: {
        userIds,
        usersAdded: usersToConnect,
        usersRemoved: usersToDisconnect
      }
    });
    
    revalidatePath('/dashboard/zones');
    return true;
  } catch (error) {
    console.error('Error assigning users to zone:', error);
    throw new Error('Error al asignar usuarios a la zona');
  }
}

// Get zones assigned to a user
export async function getZonesByUserId(userId: string) {
  try {
    // @ts-ignore - The Prisma types don't recognize the new relationship yet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        zones: true
      }
    });
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    // @ts-ignore - The Prisma types don't recognize the new relationship yet
    return user.zones.map(zone => ({
      ...zone,
      coordinates: JSON.parse(zone.coordinates as string),
    }));
  } catch (error) {
    console.error('Error getting zones for user:', error);
    throw new Error('Error al obtener zonas para el usuario');
  }
}