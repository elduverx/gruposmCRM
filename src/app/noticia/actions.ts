'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PropertyNews } from '@/types/property';
import { getCurrentUserId } from '@/lib/auth';

async function buildNewsVisibilityWhere() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return {};

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { zones: true }
    });

    if (!user) return {};
    if (user.role === 'ADMIN') return {};

    const zoneIds = user.zones.map(zone => zone.id);
    if (zoneIds.length > 0) {
      return {
        property: {
          zoneId: { in: zoneIds }
        }
      };
    }

    const responsible = (user.name || user.email || '').trim();
    if (!responsible) {
      return { id: '__none__' };
    }

    return { responsible };
  } catch (error) {
    // En caso de error, devolver sin filtro para evitar bloquear la UI
    return {};
  }
}

export async function getAllNews(): Promise<PropertyNews[]> {
  const where = await buildNewsVisibilityWhere();
  const news = await prisma.propertyNews.findMany({
    where,
    include: {
      property: {
        select: {
          id: true,
          address: true,
          population: true,
          zoneId: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return news.map((item: {
    id: string;
    type: string;
    action: string;
    valuation: string;
    priority: string;
    responsible: string;
    value: number;
    propertyId: string;
    createdAt: Date;
    updatedAt: Date;
    property: {
      id: string;
      address: string;
      population: string;
      zoneId: string | null;
    };
  }) => ({
    ...item,
    valuation: item.valuation,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    property: {
      ...item.property,
      zoneId: item.property.zoneId || ''
    }
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
    revalidatePath('/dashboard/metas');

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting news:', error);
    return false;
  }
}

export async function updatePropertyNews(id: string, data: {
  type: string;
  action: string;
  valuation: string;
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
        valuation: data.valuation,
        priority: data.priority,
        responsible: data.responsible,
        value: numericValue,
        precioSM: data.valuation ? numericPrecioSM : null,
        precioCliente: data.valuation ? numericPrecioCliente : null,
      },
    });

    revalidatePath('/noticia');
    revalidatePath('/dashboard/metas');
    return news;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating property news:', error);
    throw error;
  }
} 
