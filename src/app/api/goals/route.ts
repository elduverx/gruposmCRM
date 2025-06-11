import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-users';
import { getCurrentUserId } from '@/lib/auth';
import { GoalCategory } from '@prisma/client';

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

export async function POST(request: Request) {
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
      return NextResponse.json({ message: 'Solo los administradores pueden crear metas para otros usuarios' }, { status: 403 });
    }

    // Obtener datos del cuerpo de la petición
    const body = await request.json();
    const { title, description, targetCount, category, endDate, userId } = body;

    // Validar datos requeridos
    if (!title || !targetCount || !userId) {
      return NextResponse.json({ message: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Verificar que el usuario destino existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    // Crear la meta
    const newGoal = await prisma.userGoal.create({
      data: {
        userId,
        title,
        description: description || null,
        targetCount: parseInt(targetCount),
        currentCount: 0,
        startDate: new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isCompleted: false,
        category: category || GoalCategory.GENERAL
      }
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}