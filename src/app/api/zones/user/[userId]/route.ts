import { NextResponse } from 'next/server';
import { getZonesByUserId } from '@/app/dashboard/zones/actions';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Get current user for authorization
    const currentUserId = await getCurrentUserId(request);
    
    if (!currentUserId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get zones assigned to the requested user
    const zones = await getZonesByUserId(params.userId);
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