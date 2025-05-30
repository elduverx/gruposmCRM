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
    const count = await prisma.property.count({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { isLocated: true }
        ]
      }
    });
    return NextResponse.json({ count });
  } catch (error) {
    // Log error internally without exposing details to client
    return NextResponse.json(
      { error: 'Error al obtener el conteo de propiedades' },
      { status: 500 }
    );
  }
} 