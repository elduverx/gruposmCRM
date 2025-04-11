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

    return propertyNews;
  } catch (error) {
    console.error('Error creating property news:', error);
    throw new Error('Failed to create property news');
  }
} 