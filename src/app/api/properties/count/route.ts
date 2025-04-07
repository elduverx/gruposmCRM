import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.property.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting properties count:', error);
    return NextResponse.json(
      { error: 'Error al obtener el conteo de inmuebles' },
      { status: 500 }
    );
  }
} 