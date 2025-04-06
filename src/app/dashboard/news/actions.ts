'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DPV, PropertyNews } from '@/types/property';

export async function getPropertyNews() {
  try {
    const news = await prisma.propertyNews.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        property: true
      }
    });

    return news.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      property: item.property ? {
        ...item.property,
        createdAt: item.property.createdAt.toISOString(),
        updatedAt: item.property.updatedAt.toISOString()
      } : undefined
    }));
  } catch (error) {
    console.error('Error getting property news:', error);
    return [];
  }
}

export async function createPropertyNews(data: {
  type: string;
  action: string;
  valuation: string;
  priority: string;
  responsible: string;
  value?: number | null;
  propertyId: string;
}) {
  try {
    const propertyNews = await prisma.propertyNews.create({
      data: {
        ...data,
        value: data.value || null
      }
    });
    
    // Revalidar tanto la ruta de detalles de la propiedad como la ruta general de noticias
    revalidatePath(`/dashboard/properties/${data.propertyId}`);
    revalidatePath('/dashboard/news');
    return propertyNews;
  } catch (error) {
    console.error('Error creating property news:', error);
    return null;
  }
}

export async function deletePropertyNews(id: string) {
  try {
    await prisma.propertyNews.delete({
      where: { id }
    });
    
    revalidatePath('/dashboard/news');
    return true;
  } catch (error) {
    console.error('Error deleting property news:', error);
    return false;
  }
}

// Función para obtener los datos de DPV de una propiedad
export async function getDPVByPropertyId(propertyId: string): Promise<DPV | null> {
  try {
    const dpv = await prisma.dPV.findUnique({
      where: { propertyId },
    });
    
    if (!dpv) return null;
    
    // Asegurarnos de que links sea un array de strings
    const links = Array.isArray(dpv.links) 
      ? dpv.links.filter((link): link is string => typeof link === 'string')
      : [];
    
    return {
      ...dpv,
      links,
      createdAt: dpv.createdAt.toISOString(),
      updatedAt: dpv.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error fetching DPV:', error);
    return null;
  }
} 