/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activityLogger';

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
    console.error('Error fetching zones:', error);
    throw new Error('Error al cargar las zonas');
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
    console.error('Error fetching zone:', error);
    throw new Error('Error al cargar la zona');
  }
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

    // Registrar la actividad
    await logActivity({
      type: 'ZONE_CREATED',
      description: `Nueva zona creada: ${zone.name}`,
      relatedId: zone.id,
      relatedType: 'ZONE',
      metadata: {
        name: zone.name,
        description: zone.description,
        coordinates: data.coordinates
      }
    });

    // Obtener todas las propiedades con coordenadas
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      }
    });

    // Para cada propiedad, verificar si está dentro de la zona
    for (const property of properties) {
      if (property.latitude && property.longitude) {
        const isInZone = isPointInPolygon(
          [property.latitude, property.longitude],
          data.coordinates.map(coord => [coord.lat, coord.lng])
        );

        if (isInZone) {
          // Asignar la propiedad a la zona
          await prisma.property.update({
            where: { id: property.id },
            data: { zoneId: zone.id }
          });

          // Registrar la actividad de asignación
          await logActivity({
            type: 'PROPERTY_ASSIGNED',
            description: `Propiedad ${property.address} asignada a zona ${zone.name}`,
            relatedId: property.id,
            relatedType: 'PROPERTY',
            metadata: {
              propertyAddress: property.address,
              zoneName: zone.name,
              zoneId: zone.id
            }
          });
        }
      }
    }
    
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
      type: 'ZONE_UPDATED',
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
      type: 'ZONE_DELETED',
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