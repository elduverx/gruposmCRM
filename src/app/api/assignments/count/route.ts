import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.assignment.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting assignments count:', error);
    return NextResponse.json(
      { error: 'Error al obtener el conteo de encargos' },
      { status: 500 }
    );
  }
} 