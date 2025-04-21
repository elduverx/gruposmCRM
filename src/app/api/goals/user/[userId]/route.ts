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

    // Solo permitir ver las metas propias o si es admin
    const isAdmin = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true }
    });

    if (currentUserId !== params.userId && isAdmin?.role !== 'ADMIN') {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const goals = await prisma.userGoal.findMany({
      where: {
        userId: params.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error al obtener metas:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
} 