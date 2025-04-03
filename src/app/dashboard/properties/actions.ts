'use server';

import { PrismaClient, PropertyType, PropertyStatus, PropertyAction, AssignmentStatus } from '@prisma/client';
import { Property, PropertyCreateInput, PropertyUpdateInput } from '@/types/property';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

const prismaClient = new PrismaClient();

export async function getProperties(): Promise<Property[]> {
  try {
    const properties = await prisma.property.findMany({
      include: {
        zone: true,
        responsible: true,
        assignments: true,
        client: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return properties.map((property) => ({
      id: property.id,
      address: property.address,
      population: property.population,
      status: property.status,
      action: property.action,
      type: property.type,
      ownerName: property.ownerName,
      ownerPhone: property.ownerPhone,
      captureDate: property.captureDate,
      responsibleId: property.responsibleId,
      hasSimpleNote: property.hasSimpleNote,
      isOccupied: property.isOccupied,
      clientId: property.clientId,
      zoneId: property.zoneId,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      latitude: property.latitude,
      longitude: property.longitude,
      occupiedBy: property.occupiedBy,
      isLocated: property.isLocated,
      lastContact: property.lastContact,
      zone: property.zone ? {
        id: property.zone.id,
        name: property.zone.name,
        description: property.zone.description,
        color: property.zone.color,
        coordinates: property.zone.coordinates,
        createdAt: property.zone.createdAt,
        updatedAt: property.zone.updatedAt,
      } : null,
      responsible: property.responsible?.name || null,
      assignments: property.assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        status: assignment.status,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        propertyId: assignment.propertyId,
        clientId: assignment.clientId,
      })),
      client: property.client ? {
        id: property.client.id,
        name: property.client.name,
        email: property.client.email,
        phone: property.client.phone,
        address: property.client.address,
        createdAt: property.client.createdAt,
        updatedAt: property.client.updatedAt,
      } : null,
    }));
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
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

export async function createProperty(data: PropertyCreateInput): Promise<Property> {
  try {
    const property = await prisma.property.create({
      data: {
        ...data,
        status: data.status || PropertyStatus.IN_PROCESS,
        action: data.action || PropertyAction.NEWS,
        type: data.type || PropertyType.HOUSE,
        captureDate: data.captureDate || new Date(),
        hasSimpleNote: data.hasSimpleNote || false,
        isOccupied: data.isOccupied || false,
        isLocated: data.isLocated || false,
      },
      include: {
        zone: true,
        responsible: true,
        assignments: true,
        client: true,
      },
    });

    return {
      id: property.id,
      address: property.address,
      population: property.population,
      status: property.status,
      action: property.action,
      type: property.type,
      ownerName: property.ownerName,
      ownerPhone: property.ownerPhone,
      captureDate: property.captureDate,
      responsibleId: property.responsibleId,
      hasSimpleNote: property.hasSimpleNote,
      isOccupied: property.isOccupied,
      clientId: property.clientId,
      zoneId: property.zoneId,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      latitude: property.latitude,
      longitude: property.longitude,
      occupiedBy: property.occupiedBy,
      isLocated: property.isLocated,
      lastContact: property.lastContact,
      zone: property.zone ? {
        id: property.zone.id,
        name: property.zone.name,
        description: property.zone.description,
        color: property.zone.color,
        coordinates: property.zone.coordinates,
        createdAt: property.zone.createdAt,
        updatedAt: property.zone.updatedAt,
      } : null,
      responsible: property.responsible?.name || null,
      assignments: property.assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        status: assignment.status,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        propertyId: assignment.propertyId,
        clientId: assignment.clientId,
      })),
      client: property.client ? {
        id: property.client.id,
        name: property.client.name,
        email: property.client.email,
        phone: property.client.phone,
        address: property.client.address,
        createdAt: property.client.createdAt,
        updatedAt: property.client.updatedAt,
      } : null,
    };
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
}

export async function updateProperty(id: string, data: PropertyUpdateInput): Promise<Property> {
  try {
    const property = await prisma.property.update({
      where: { id },
      data,
      include: {
        zone: true,
        responsible: true,
        assignments: true,
        client: true,
      },
    });

    return {
      id: property.id,
      address: property.address,
      population: property.population,
      status: property.status,
      action: property.action,
      type: property.type,
      ownerName: property.ownerName,
      ownerPhone: property.ownerPhone,
      captureDate: property.captureDate,
      responsibleId: property.responsibleId,
      hasSimpleNote: property.hasSimpleNote,
      isOccupied: property.isOccupied,
      clientId: property.clientId,
      zoneId: property.zoneId,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      latitude: property.latitude,
      longitude: property.longitude,
      occupiedBy: property.occupiedBy,
      isLocated: property.isLocated,
      lastContact: property.lastContact,
      zone: property.zone ? {
        id: property.zone.id,
        name: property.zone.name,
        description: property.zone.description,
        color: property.zone.color,
        coordinates: property.zone.coordinates,
        createdAt: property.zone.createdAt,
        updatedAt: property.zone.updatedAt,
      } : null,
      responsible: property.responsible?.name || null,
      assignments: property.assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        status: assignment.status,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        propertyId: assignment.propertyId,
        clientId: assignment.clientId,
      })),
      client: property.client ? {
        id: property.client.id,
        name: property.client.name,
        email: property.client.email,
        phone: property.client.phone,
        address: property.client.address,
        createdAt: property.client.createdAt,
        updatedAt: property.client.updatedAt,
      } : null,
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