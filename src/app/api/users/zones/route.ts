import { NextResponse } from 'next/server';
import { getZonesByUserId } from '@/app/dashboard/zones/actions';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const zones = await getZonesByUserId(userId);
    return NextResponse.json(zones);
  } catch (error) {
    return NextResponse.json(
      { 
        message: 'Error en el servidor', 
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.stack : null) : null
      },
      { status: 500 }
    );
  }
} 