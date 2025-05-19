import { NextResponse } from 'next/server';
import { getUsersByZoneId, assignUsersToZone } from '@/app/dashboard/zones/actions';

// GET /api/zones/[id]/users - Get users assigned to a zone
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const users = await getUsersByZoneId(params.id);
    return NextResponse.json(users);
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

// POST /api/zones/[id]/users - Assign users to a zone
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userIds } = await request.json() as { userIds: string[] };
    
    if (!Array.isArray(userIds)) {
      return NextResponse.json(
        { message: 'Formato de datos incorrecto. Se esperaba un array de IDs de usuarios.' },
        { status: 400 }
      );
    }

    await assignUsersToZone(params.id, userIds);
    return NextResponse.json({ success: true });
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