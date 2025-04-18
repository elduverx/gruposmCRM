import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: {
        date: 'desc',
      },
      include: {
        property: {
          select: {
            id: true,
            address: true,
          },
        },
      },
    });
    
    // Formatear las fechas para mantener la hora pero de forma más legible
    const formattedActivities = activities.map(activity => {
      // Formatear la fecha principal con hora
      const date = new Date(activity.date);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      // Formatear las fechas de creación y actualización
      const createdAt = new Date(activity.createdAt);
      const updatedAt = new Date(activity.updatedAt);
      
      return {
        ...activity,
        date: formattedDate,
        createdAt: `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`,
        updatedAt: `${updatedAt.getFullYear()}-${String(updatedAt.getMonth() + 1).padStart(2, '0')}-${String(updatedAt.getDate()).padStart(2, '0')} ${String(updatedAt.getHours()).padStart(2, '0')}:${String(updatedAt.getMinutes()).padStart(2, '0')}`,
      };
    });
    
    return NextResponse.json(formattedActivities);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching activities' },
      { status: 500 }
    );
  }
} 