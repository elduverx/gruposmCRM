import { prisma } from '@/lib/prisma';
import { Activity } from '@/types/activity';
import { Property } from '@/types/property';

export async function getActivities(): Promise<Activity[]> {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: {
        date: 'desc'
      },
      include: {
        property: true
      }
    });

    // Map activities to match the Activity type
    return activities.map(activity => {
      // Asegurarse de que las fechas sean válidas
      const date = activity.date ? new Date(activity.date) : new Date();
      const createdAt = activity.createdAt ? new Date(activity.createdAt) : new Date();
      const updatedAt = activity.updatedAt ? new Date(activity.updatedAt) : new Date();

      return {
        id: activity.id,
        propertyId: activity.propertyId,
        type: activity.type as Activity['type'], // Explicitly cast Prisma enum to our Activity type
        status: activity.status || '',
        client: activity.client,
        notes: activity.notes,
        date: date.toISOString(),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        property: activity.property ? {
          id: activity.property.id,
          address: activity.property.address,
          population: activity.property.population || '',
          type: activity.property.type,
          status: activity.property.status,
          action: activity.property.action,
          captureDate: activity.property.captureDate.toISOString(),
          responsibleId: activity.property.responsibleId,
          hasSimpleNote: activity.property.hasSimpleNote,
          isOccupied: activity.property.isOccupied,
          clientId: activity.property.clientId,
          zoneId: activity.property.zoneId,
          latitude: activity.property.latitude,
          longitude: activity.property.longitude,
          occupiedBy: activity.property.occupiedBy,
          isLocated: activity.property.isLocated,
          responsible: activity.property.responsible,
          habitaciones: activity.property.habitaciones,
          banos: activity.property.banos,
          metrosCuadrados: activity.property.metrosCuadrados,
          parking: activity.property.parking,
          ascensor: activity.property.ascensor,
          piscina: activity.property.piscina,
          createdAt: activity.property.createdAt.toISOString(),
          updatedAt: activity.property.updatedAt.toISOString(),
          ownerName: activity.property.ownerName,
          ownerPhone: activity.property.ownerPhone,
          basePropertyId: activity.property.basePropertyId,
          isSold: activity.property.isSold,
          occupiedByName: activity.property.occupiedBy || '',
          activities: [],
          zone: null,
          assignments: [],
          dpv: null,
          responsibleUser: null,
          clients: [],
          // Add missing required fields with default values
          price: '',
          description: '',
          yearBuilt: '',
          isFurnished: false,
          ownerEmail: '',
          tenantName: '',
          tenantPhone: '',
          tenantEmail: '',
          notes: '',
          buildingId: null
        } as Property : null
      };
    });
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
} 