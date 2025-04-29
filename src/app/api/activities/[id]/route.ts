import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = await getCurrentUserId();
    
    if (!currentUserId) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Verificar que la actividad existe y pertenece al usuario actual
    const activity = await prisma.userActivity.findUnique({
      where: {
        id: params.id,
        userId: currentUserId
      }
    });

    if (!activity) {
      return new NextResponse('Actividad no encontrada', { status: 404 });
    }

    // Eliminar la actividad
    await prisma.userActivity.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // En un entorno de producción, podríamos usar un servicio de logging
    // o enviar el error a un servicio de monitoreo
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
} 