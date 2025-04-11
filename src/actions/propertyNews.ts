'use server';

import { prisma } from '@/lib/prisma';

interface CreatePropertyNewsData {
  type: string;
  action: string;
  valuation: string;
  priority: string;
  responsible: string;
  value: number;
  precioSM: number;
  precioCliente: number;
}

export async function createPropertyNews(propertyId: string, data: CreatePropertyNewsData) {
  try {
    const propertyNews = await prisma.propertyNews.create({
      data: {
        propertyId,
        type: data.type,
        action: data.action,
        valuation: data.valuation,
        priority: data.priority,
        responsible: data.responsible,
        value: data.value,
        precioSM: data.precioSM,
        precioCliente: data.precioCliente,
      },
    });

    return { success: true, data: propertyNews };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create property news'
    };
  }
} 