import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // During build time, return a mock response
  if (process.env.NODE_ENV === 'production' && process.env.SKIP_DB_CHECK === 'true') {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await prisma.assignment.count();
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error al obtener el conteo de encargos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 