import { prisma } from '@/lib/prisma';
import { Activity } from '@/types/property';

export async function getActivitiesByProperty(propertyId: string): Promise<Activity[]> {
  try {
    const activities = await prisma.activity.findMany({
      where: { propertyId },
      orderBy: { date: 'desc' }
    });
    
    return activities.map(activity => ({
      ...activity,
      date: activity.date.toISOString(),
      createdAt: activity.createdAt.toISOString(),
      updatedAt: activity.updatedAt.toISOString()
    }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting activities:', error);
    return [];
  }
} 