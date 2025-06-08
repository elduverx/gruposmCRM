import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const currentUserId = await getCurrentUserId();
    
    if (!currentUserId) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Solo permitir ver las actividades propias o si es admin
    const isAdmin = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true }
    });

    if (currentUserId !== params.userId && isAdmin?.role !== 'ADMIN') {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Obtener actividades de usuario
    const userActivities = await prisma.userActivity.findMany({
      where: {
        userId: params.userId
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Obtener actividades de propiedades
    const propertyActivities = await prisma.activity.findMany({
      where: {
        userId: params.userId
      },
      orderBy: {
        date: 'desc'
      },
      include: {
        property: {
          select: {
            address: true
          }
        }
      }
    });

    // Transformar actividades de propiedades al formato de UserActivity
    const transformedPropertyActivities = propertyActivities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      type: activity.type,
      description: `${activity.type} para la propiedad ${activity.property?.address || 'desconocida'}`,
      timestamp: activity.date.toISOString(),
      points: 1,
      relatedId: activity.propertyId,
      relatedType: activity.type.toUpperCase() === 'DPV' ? 'PROPERTY_DPV' : 'PROPERTY_ACTIVITY',
      metadata: JSON.stringify({
        status: activity.status,
        client: activity.client,
        notes: activity.notes
      })
    }));

    // Combinar ambos tipos de actividades y ordenar por fecha
    const allActivities = [...userActivities, ...transformedPropertyActivities].sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(allActivities);
  } catch (error) {
    console.error('Error getting user activities:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}