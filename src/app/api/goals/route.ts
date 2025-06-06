import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-users';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Verificar si el usuario es admin
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true }
    });
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    // Obtener todas las metas
    const goals = await prisma.userGoal.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(goals);
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
} 