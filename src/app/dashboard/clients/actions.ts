'use server';

import { prisma } from '@/lib/prisma';
import { Client, ClientFormData } from '@/types/client';

export async function getClients(): Promise<Client[]> {
  try {
    const clients = await prisma.client.findMany({
      include: {
        properties: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Convertir los resultados a Client[]
    return clients as unknown as Client[];
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
}

export async function createClient(data: ClientFormData): Promise<Client> {
  try {
    const client = await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        properties: {
          connect: data.relatedProperties.map(id => ({ id }))
        }
      },
      include: {
        properties: true
      }
    });
    
    return client as unknown as Client;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
}

export async function updateClient(id: string, data: ClientFormData): Promise<Client> {
  try {
    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        properties: {
          set: data.relatedProperties.map(id => ({ id }))
        }
      },
      include: {
        properties: true
      }
    });
    
    return client as unknown as Client;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    await prisma.client.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
} 