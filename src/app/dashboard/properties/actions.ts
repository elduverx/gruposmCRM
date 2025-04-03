'use server';

import { PrismaClient, PropertyType, PropertyStatus, PropertyAction } from '@prisma/client';
import { Property } from '@/types/property';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

const prismaClient = new PrismaClient();

export async function getProperties(): Promise<Property[]> {
  try {
    const properties = await prismaClient.property.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return properties.map(property => ({
      ...property,
      type: property.type as PropertyType,
      status: property.status as PropertyStatus,
      action: property.action as PropertyAction,
    }));
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw new Error('Error al obtener los inmuebles');
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) return null;

    return {
      ...property,
      type: property.type as PropertyType,
      status: property.status as PropertyStatus,
      action: property.action as PropertyAction,
      lastContact: property.lastContact?.toISOString().split('T')[0] || undefined,
    };
  } catch (error) {
    console.error('Error fetching property:', error);
    throw new Error('Error al obtener el inmueble');
  }
}

export async function createProperty(data: {
  address: string;
  population: string;
  status: PropertyStatus;
  action: PropertyAction;
  type: PropertyType;
  ownerName: string;
  ownerPhone: string;
  isOccupied: boolean;
  occupiedBy: string | null;
  latitude: number | null;
  longitude: number | null;
}) {
  try {
    const property = await prismaClient.property.create({
      data: {
        ...data,
        captureDate: new Date(),
      },
    });
    
    revalidatePath('/dashboard/properties');
    
    return property;
  } catch (error) {
    console.error('Error creating property:', error);
    throw new Error('Error al crear el inmueble');
  }
}

export async function updateProperty(
  id: string,
  data: Partial<Property>
) {
  try {
    const property = await prisma.property.update({
      where: { id },
      data: {
        ...data,
        lastContact: data.lastContact ? new Date(data.lastContact) : undefined,
      },
    });
    
    revalidatePath('/dashboard/properties');
    revalidatePath(`/dashboard/properties/${id}`);
    
    return {
      ...property,
      type: property.type as PropertyType,
      status: property.status as PropertyStatus,
      action: property.action as PropertyAction,
      lastContact: property.lastContact?.toISOString().split('T')[0] || undefined,
    };
  } catch (error) {
    console.error('Error updating property:', error);
    throw new Error('Error al actualizar el inmueble');
  }
}

export async function deleteProperty(id: string) {
  try {
    await prismaClient.property.delete({
      where: { id },
    });
    
    revalidatePath('/dashboard/properties');
    
    return true;
  } catch (error) {
    console.error('Error deleting property:', error);
    throw new Error('Error al eliminar el inmueble');
  }
} 