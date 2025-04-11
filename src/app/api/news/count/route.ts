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
    const count = await prisma.news.count();
    return NextResponse.json({ count });
  } catch (error) {
    // En producción, no exponemos detalles del error
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Error al obtener el conteo de noticias'
      : `Error al obtener el conteo de noticias: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 