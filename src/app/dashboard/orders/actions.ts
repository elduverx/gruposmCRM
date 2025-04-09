'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Order, OrderCreateInput } from '@/types/order';
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
  createdAt: Date;
  updatedAt: Date;
  Client: {
    id: string;
    name: string;
    email: string;
  };
};

function mapOrderResponse(order: ClientRequestWithClient): Order {
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
    features: JSON.parse(order.features),
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
    console.error('Error getting order:', error);
    throw new Error('Error al cargar el pedido');
  }
}

export async function createOrder(data: OrderCreateInput): Promise<{ order: Order | null; error: string | null }> {
  try {
    // Primero, actualizamos el cliente para marcar que tiene un pedido
    await prisma.client.update({
      where: { id: data.clientId },
      data: { hasRequest: true }
    });

    // Luego, creamos el pedido
    const order = await prisma.clientRequest.create({
      data: {
        id: `order_${Date.now()}`,
        clientId: data.clientId,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        propertyType: data.propertyType,
        features: JSON.stringify(data.features),
        updatedAt: new Date(),
        type: data.operationType
      } as unknown as Prisma.ClientRequestCreateInput,
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }) as unknown as ClientRequestWithClient;

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/clients');

    return {
      order: mapOrderResponse(order),
      error: null
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return { order: null, error: 'Error al crear el pedido' };
  }
}

export async function updateOrder(id: string, data: Partial<OrderCreateInput>): Promise<{ order: Order | null; error: string | null }> {
  try {
    const updateData: any = {
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
    }) as unknown as ClientRequestWithClient;

    revalidatePath('/dashboard/orders');

    return {
      order: mapOrderResponse(order),
      error: null
    };
  } catch (error) {
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
    console.error('Error deleting order:', error);
    return { error: 'Error al eliminar el pedido' };
  }
} 