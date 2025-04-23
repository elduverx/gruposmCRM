'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activityLogger';
import type { ActivityType } from '@/lib/activityLogger';

// Primero, añadir un campo booleano 'isSold' a la tabla Property
async function addIsSoldColumn() {
  try {
    // Verificar si la columna ya existe
    const columnExists = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Property' AND COLUMN_NAME = 'isSold'
    `);
    
    if (!Array.isArray(columnExists) || (columnExists as any[]).length === 0) {
      // La columna no existe, vamos a crearla
      await prisma.$executeRawUnsafe(`
        ALTER TABLE Property ADD COLUMN isSold BOOLEAN DEFAULT false
      `);
      console.log("Columna isSold añadida correctamente a la tabla Property");
    }
    return true;
  } catch (error) {
    console.error("Error al añadir la columna isSold:", error);
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
      console.error(`Propiedad con ID ${propertyId} no encontrada`);
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
      type: 'MANUAL' as ActivityType,
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
    console.error('Error al marcar propiedad como vendida:', error);
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
      console.error(`Propiedad con ID ${propertyId} no encontrada`);
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
      type: 'MANUAL' as ActivityType,
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
    console.error('Error al revertir la venta de la propiedad:', error);
    return false;
  }
}

// Obtener todas las propiedades vendidas con sus detalles
export async function getSoldProperties() {
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
    const formattedProperties = Array.isArray(properties) ? properties.map((p: any) => {
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
    console.error('Error al obtener propiedades vendidas:', error);
    return [];
  }
} 