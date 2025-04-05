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
    
    return zones.map(zone => ({
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

export async function updatePropertyZoneByCoordinates(propertyId: string): Promise<void> {
  try {
    // Obtener la propiedad con sus coordenadas
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { latitude: true, longitude: true }
    });

    if (!property || !property.latitude || !property.longitude) {
      return;
    }

    // Obtener todas las zonas
    const zones = await prisma.zone.findMany();

    // Encontrar la zona que contiene las coordenadas de la propiedad
    for (const zone of zones) {
      const coordinates = JSON.parse(zone.coordinates as string);
      if (isPointInPolygon(
        [property.latitude, property.longitude],
        coordinates.map((coord: { lat: number; lng: number }) => [coord.lat, coord.lng])
      )) {
        // Actualizar la zona de la propiedad
        await prisma.property.update({
          where: { id: propertyId },
          data: { zoneId: zone.id }
        });
        break;
      }
    }

    revalidatePath('/dashboard/zones');
    revalidatePath('/dashboard/properties');
  } catch (error) {
    console.error('Error updating property zone by coordinates:', error);
    throw new Error('Error al actualizar la zona de la propiedad');
  }
}

// Función auxiliar para determinar si un punto está dentro de un polígono
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
} 