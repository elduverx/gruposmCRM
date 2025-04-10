'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
    const zone = await prisma.zone.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        coordinates: JSON.stringify(data.coordinates)
      },
    });
    
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

export async function updateZone(id: string, data: Partial<Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Zone> {
  try {
    const updateData: Record<string, unknown> = { ...data };
    
    if (data.coordinates) {
      updateData.coordinates = JSON.stringify(data.coordinates);
    }
    
    const zone = await prisma.zone.update({
      where: { id },
      data: updateData,
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

export async function deleteZone(id: string): Promise<void> {
  try {
    await prisma.zone.delete({
      where: { id },
    });
    
    revalidatePath('/dashboard/zones');
  } catch (error) {
    console.error('Error deleting zone:', error);
    throw new Error('Error al eliminar la zona');
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