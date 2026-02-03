'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Order, OrderCreateInput } from '@/types/order';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Prisma } from '@prisma/client';

type ClientRequestWithClient = {
  id: string;
  clientId: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  minPrice: number;
  maxPrice: number;
  propertyType: string;
  features: string;
  desiredLocation?: string | null;
  createdAt: Date;
  updatedAt: Date;
  Client: {
    id: string;
    name: string;
    email: string | null;
  };
};

// Definir el tipo para las características de la propiedad
type PropertyFeatures = string[];

type ClientRequestCreateInput = {
  id: string;
  clientId: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  minPrice: number;
  maxPrice: number;
  propertyType: string;
  features: string;
  desiredLocation?: string | null;
  updatedAt: Date;
};

type ClientRequestUpdateInput = {
  updatedAt: Date;
  features?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  desiredLocation?: string | null;
};

function mapOrderResponse(order: ClientRequestWithClient): Order {
  // Safe JSON parsing function
  const safeParseFeatures = (featuresString: string | null | undefined): PropertyFeatures => {
    if (!featuresString) {
      return [];
    }
    
    try {
      const parsed = JSON.parse(featuresString);
      // Ensure the parsed value is an array of strings
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
      return [];
    } catch (error) {
      console.warn('Failed to parse order features JSON:', error);
      return [];
    }
  };

  return {
    id: order.id,
    status: 'PENDING',
    operationType: order.type as 'SALE' | 'RENT',
    total: 0,
    bedrooms: order.bedrooms,
    bathrooms: order.bathrooms,
    minPrice: order.minPrice,
    maxPrice: order.maxPrice,
    propertyType: order.propertyType,
    features: safeParseFeatures(order.features),
    desiredLocation: order.desiredLocation ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    client: {
      id: order.Client.id,
      name: order.Client.name,
      email: order.Client.email
    }
  };
}

export async function getOrders(): Promise<Order[]> {
  try {
    const orders = await prisma.clientRequest.findMany({
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as unknown as ClientRequestWithClient[];

    return orders.map(mapOrderResponse);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching orders:', error);
    throw new Error('Error al obtener los pedidos');
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const order = await prisma.clientRequest.findUnique({
      where: { id },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }) as unknown as ClientRequestWithClient | null;

    if (!order) {
      return null;
    }

    return mapOrderResponse(order);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting order:', error);
    throw new Error('Error al cargar el pedido');
  }
}

export async function createOrder(data: OrderCreateInput): Promise<{ order: Order | null; error: string | null }> {
  try {
    await prisma.client.update({
      where: { id: data.clientId },
      data: { hasRequest: true }
    });

    const createData: ClientRequestCreateInput = {
      id: `order_${Date.now()}`,
      clientId: data.clientId,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      propertyType: data.propertyType,
      features: JSON.stringify(data.features),
      desiredLocation: data.desiredLocation || null,
      updatedAt: new Date(),
      type: data.operationType
    };

    const order = await prisma.clientRequest.create({
      data: createData,
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }) as ClientRequestWithClient;

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/clients');

    return {
      order: mapOrderResponse(order),
      error: null
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating order:', error);
    return { order: null, error: 'Error al crear el pedido' };
  }
}

export async function updateOrder(id: string, data: Partial<OrderCreateInput>): Promise<{ order: Order | null; error: string | null }> {
  try {
    const updateData: ClientRequestUpdateInput = {
      updatedAt: new Date()
    };
    
    if (data.features) {
      updateData.features = JSON.stringify(data.features);
    }
    
    if (data.operationType) {
      updateData.type = data.operationType;
    }

    if (data.bedrooms) {
      updateData.bedrooms = data.bedrooms;
    }

    if (data.bathrooms) {
      updateData.bathrooms = data.bathrooms;
    }

    if (data.minPrice) {
      updateData.minPrice = data.minPrice;
    }

    if (data.maxPrice) {
      updateData.maxPrice = data.maxPrice;
    }

    if (data.propertyType) {
      updateData.propertyType = data.propertyType;
    }

    if (data.desiredLocation !== undefined) {
      updateData.desiredLocation = data.desiredLocation || null;
    }
    
    const order = await prisma.clientRequest.update({
      where: { id },
      data: updateData,
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }) as ClientRequestWithClient;

    revalidatePath('/dashboard/orders');

    return {
      order: mapOrderResponse(order),
      error: null
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating order:', error);
    return { order: null, error: 'Error al actualizar el pedido' };
  }
}

export async function deleteOrder(id: string): Promise<{ error: string | null }> {
  try {
    // Primero, obtenemos el pedido para saber a qué cliente pertenece
    const order = await prisma.clientRequest.findUnique({
      where: { id },
      select: { clientId: true }
    });

    if (!order) {
      return { error: 'Pedido no encontrado' };
    }

    // Eliminamos el pedido
    await prisma.clientRequest.delete({
      where: { id }
    });

    // Actualizamos el cliente para marcar que ya no tiene pedido
    await prisma.client.update({
      where: { id: order.clientId },
      data: { hasRequest: false }
    });

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/clients');

    return { error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting order:', error);
    return { error: 'Error al eliminar el pedido' };
  }
} 
