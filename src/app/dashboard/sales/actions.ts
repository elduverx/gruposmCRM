'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activityLogger';
import type { ActivityType } from '@/types/activity';

// Definir una interfaz para las propiedades vendidas
interface SoldProperty {
  id: string;
  address: string;
  population: string;
  updatedAt: string;
  isSold: boolean;
  assignment_id?: string;
  clientId?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  assignments: Array<{
    id: string;
    clientId?: string;
    client?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  }>;
}

// Primero, añadir un campo booleano 'isSold' a la tabla Property
async function addIsSoldColumn() {
  try {
    // Verificar si la columna ya existe
    const columnExists = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Property' AND COLUMN_NAME = 'isSold'
    `);
    
    if (!Array.isArray(columnExists) || columnExists.length === 0) {
      // La columna no existe, vamos a crearla
      await prisma.$executeRawUnsafe(`
        ALTER TABLE Property ADD COLUMN isSold BOOLEAN DEFAULT false
      `);
      // Usar logActivity en lugar de console.log
      await logActivity({
        type: 'SYSTEM' as ActivityType,
        description: 'Columna isSold añadida correctamente a la tabla Property',
        relatedType: 'system'
      });
    }
    return true;
  } catch (error) {
    // Usar logActivity en lugar de console.error
    await logActivity({
      type: 'ERROR' as ActivityType,
      description: `Error al añadir la columna isSold: ${error instanceof Error ? error.message : String(error)}`,
      relatedType: 'system'
    });
    return false;
  }
}

// Función para marcar una propiedad como vendida
export async function markPropertyAsSold(propertyId: string, clientId: string): Promise<boolean> {
  try {
    // Asegurarnos que la columna 'isSold' existe
    await addIsSoldColumn();
    
    // Buscamos primero la propiedad para verificar que existe
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      // Usar logActivity en lugar de console.error
      await logActivity({
        type: 'ERROR' as ActivityType,
        description: `Propiedad con ID ${propertyId} no encontrada`,
        relatedType: 'property',
        relatedId: propertyId
      });
      return false;
    }

    // Actualizar la propiedad marcándola como vendida con el campo booleano
    await prisma.$executeRawUnsafe(`
      UPDATE Property 
      SET isSold = true 
      WHERE id = ?
    `, propertyId);

    // Actualizar el pedido del cliente (si existe)
    const clientRequest = await prisma.clientRequest.findUnique({
      where: { clientId }
    });

    if (clientRequest) {
      // Marcar que el pedido ha sido completado
      await prisma.client.update({
        where: { id: clientId },
        data: { 
          hasRequest: false 
        }
      });
    }

    // Registrar la actividad
    await logActivity({
      type: 'OTROS' as ActivityType,
      description: `Propiedad marcada como vendida`,
      relatedId: propertyId,
      relatedType: 'property'
    });

    // Revalidar las rutas relacionadas
    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/properties');
    revalidatePath('/dashboard/clients');
    revalidatePath('/dashboard/assignments');

    return true;
  } catch (error) {
    // Usar logActivity en lugar de console.error
    await logActivity({
      type: 'ERROR' as ActivityType,
      description: `Error al marcar propiedad como vendida: ${error instanceof Error ? error.message : String(error)}`,
      relatedType: 'property',
      relatedId: propertyId
    });
    return false;
  }
}

// Función para revertir la venta de una propiedad (marcarla como no vendida)
export async function revertPropertySale(propertyId: string): Promise<boolean> {
  try {
    // Asegurarnos que la columna 'isSold' existe
    await addIsSoldColumn();
    
    // Buscamos primero la propiedad para verificar que existe
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      // Usar logActivity en lugar de console.error
      await logActivity({
        type: 'ERROR' as ActivityType,
        description: `Propiedad con ID ${propertyId} no encontrada`,
        relatedType: 'property',
        relatedId: propertyId
      });
      return false;
    }

    // Actualizar la propiedad marcándola como no vendida
    await prisma.$executeRawUnsafe(`
      UPDATE Property 
      SET isSold = false 
      WHERE id = ?
    `, propertyId);

    // Registrar la actividad
    await logActivity({
      type: 'OTROS' as ActivityType,
      description: `Venta de propiedad revertida`,
      relatedId: propertyId,
      relatedType: 'property'
    });

    // Revalidar las rutas relacionadas
    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/properties');
    revalidatePath('/dashboard/clients');
    revalidatePath('/dashboard/assignments');

    return true;
  } catch (error) {
    // Usar logActivity en lugar de console.error
    await logActivity({
      type: 'ERROR' as ActivityType,
      description: `Error al revertir la venta de la propiedad: ${error instanceof Error ? error.message : String(error)}`,
      relatedType: 'property',
      relatedId: propertyId
    });
    return false;
  }
}

// Obtener todas las propiedades vendidas con sus detalles
export async function getSoldProperties(): Promise<SoldProperty[]> {
  try {
    // Asegurarnos que la columna 'isSold' existe
    await addIsSoldColumn();
    
    // Usando query raw para obtener las propiedades vendidas usando el campo isSold
    const properties = await prisma.$queryRawUnsafe(`
      SELECT p.*, 
        a.id as assignment_id, a.clientId,
        c.name as client_name, c.email as client_email, c.phone as client_phone
      FROM Property p
      LEFT JOIN Assignment a ON p.id = a.propertyId
      LEFT JOIN Client c ON a.clientId = c.id
      WHERE p.isSold = true
      ORDER BY p.updatedAt DESC
    `);
    
    // Transformar el resultado para que coincida con la estructura esperada
    const formattedProperties = Array.isArray(properties) ? properties.map((p: SoldProperty) => {
      return {
        ...p,
        assignments: p.assignment_id ? [{
          id: p.assignment_id,
          clientId: p.clientId,
          client: {
            name: p.client_name,
            email: p.client_email,
            phone: p.client_phone
          }
        }] : []
      };
    }) : [];
    
    return formattedProperties;
  } catch (error) {
    // Usar logActivity en lugar de console.error
    await logActivity({
      type: 'ERROR' as ActivityType,
      description: `Error al obtener propiedades vendidas: ${error instanceof Error ? error.message : String(error)}`,
      relatedType: 'system'
    });
    return [];
  }
} 