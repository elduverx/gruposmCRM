'use server';

import { prisma } from '@/lib/prisma';
import { Client, ClientFormData } from '@/types/client';
import { Property, Assignment } from '@/types/property';

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
    // eslint-disable-next-line no-console
    console.error('Error fetching clients:', error);
    throw error;
  }
}

export async function createClient(data: ClientFormData): Promise<Client> {
  try {
    const wantsOrder = !!data.orderRequest?.desiredLocation?.trim();
    const clientData = {
      name: data.name,
      email: data.email?.trim() || null,
      phone: data.phone,
      address: data.address,
      hasRequest: data.hasRequest || wantsOrder,
      isTenant: data.isTenant || false,
      properties: {
        connect: data.relatedProperties.map(id => ({ id }))
      }
    };

    const client = await prisma.client.create({
      data: clientData,
      include: {
        properties: true
      }
    });

    if (wantsOrder) {
      await prisma.clientRequest.create({
        data: {
          id: `order_${Date.now()}`,
          clientId: client.id,
          bedrooms: 1,
          bathrooms: 1,
          minPrice: 0,
          maxPrice: 0,
          propertyType: 'PISO',
          features: JSON.stringify([]),
          desiredLocation: data.orderRequest?.desiredLocation?.trim() || null,
          updatedAt: new Date(),
          type: 'SALE'
        }
      });
    }
    
    return client as unknown as Client;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating client:', error);
    throw error;
  }
}

export async function updateClient(id: string, data: ClientFormData): Promise<Client> {
  try {
    const wantsOrder = !!data.orderRequest?.desiredLocation?.trim();
    const updateData = {
      name: data.name,
      email: data.email?.trim() || null,
      phone: data.phone,
      address: data.address,
      hasRequest: data.hasRequest || wantsOrder,
      isTenant: data.isTenant || false,
      properties: {
        set: data.relatedProperties.map(id => ({ id }))
      }
    };

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        properties: true
      }
    });

    if (wantsOrder) {
      await prisma.clientRequest.upsert({
        where: { clientId: client.id },
        update: {
          desiredLocation: data.orderRequest?.desiredLocation?.trim() || null,
          updatedAt: new Date()
        },
        create: {
          id: `order_${Date.now()}`,
          clientId: client.id,
          bedrooms: 1,
          bathrooms: 1,
          minPrice: 0,
          maxPrice: 0,
          propertyType: 'PISO',
          features: JSON.stringify([]),
          desiredLocation: data.orderRequest?.desiredLocation?.trim() || null,
          updatedAt: new Date(),
          type: 'SALE'
        }
      });
    }
    
    return client as unknown as Client;
  } catch (error) {
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error('Error deleting client:', error);
    throw error;
  }
}

export async function getClientById(id: string): Promise<Client & { properties: Property[]; assignments: Assignment[] }> {
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        properties: {
          include: {
            zone: true,
            activities: true,
            assignments: true,
            dpv: true,
            clients: true,
            responsibleUser: true
          }
        },
        assignments: {
          include: {
            property: {
              include: {
                zone: true,
                activities: true,
                assignments: true,
                dpv: true,
                clients: true,
                responsibleUser: true
              }
            }
          }
        }
      }
    });
    
    if (!client) {
      throw new Error('Client not found');
    }

    return client as unknown as Client & { properties: Property[]; assignments: Assignment[] };
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
}
