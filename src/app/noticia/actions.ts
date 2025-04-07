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

  return news as unknown as PropertyNews[];
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

export async function updatePropertyNews(id: string, data: Partial<PropertyNews>): Promise<PropertyNews | null> {
  try {
    const news = await prisma.propertyNews.update({
      where: { id },
      data: {
        type: data.type,
        action: data.action,
        valuation: data.valuation,
        priority: data.priority,
        responsible: data.responsible,
        value: data.value,
        precioSM: data.valuation ? data.precioSM : null,
        precioCliente: data.valuation ? data.precioCliente : null,
      },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            population: true,
          },
        },
      },
    });

    return news as unknown as PropertyNews;
  } catch (error) {
    console.error('Error updating news:', error);
    return null;
  }
} 