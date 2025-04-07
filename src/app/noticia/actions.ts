'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PropertyNews } from '@/types/property';

export async function getAllNews(): Promise<PropertyNews[]> {
  const news = await prisma.propertyNews.findMany({
    include: {
      property: {
        select: {
          id: true,
          address: true,
          population: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return news.map(item => ({
    ...item,
    valuation: item.valuation,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  })) as PropertyNews[];
}

export async function deleteNews(id: string): Promise<boolean> {
  try {
    await prisma.propertyNews.delete({
      where: { id },
    });

    // Revalidar las rutas
    revalidatePath('/noticia');
    revalidatePath('/dashboard/properties');

    return true;
  } catch (error) {
    console.error('Error deleting news:', error);
    return false;
  }
}

export async function updatePropertyNews(id: string, data: {
  type: string;
  action: string;
  valuation: boolean;
  priority: 'HIGH' | 'LOW';
  responsible: string;
  value: number;
  precioSM: number | null;
  precioCliente: number | null;
}) {
  try {
    // Convert numeric values to ensure they're numbers, not strings
    const numericValue = typeof data.value === 'string' ? parseFloat(data.value) : data.value;
    const numericPrecioSM = data.precioSM !== null ? (typeof data.precioSM === 'string' ? parseFloat(data.precioSM) : data.precioSM) : null;
    const numericPrecioCliente = data.precioCliente !== null ? (typeof data.precioCliente === 'string' ? parseFloat(data.precioCliente) : data.precioCliente) : null;

    const news = await prisma.propertyNews.update({
      where: { id },
      data: {
        type: data.type,
        action: data.action,
        valuation: data.valuation ? 'true' : 'false',
        priority: data.priority,
        responsible: data.responsible,
        value: numericValue,
        precioSM: data.valuation ? numericPrecioSM : null,
        precioCliente: data.valuation ? numericPrecioCliente : null,
      },
    });

    revalidatePath('/noticia');
    return news;
  } catch (error) {
    console.error('Error updating property news:', error);
    throw error;
  }
} 