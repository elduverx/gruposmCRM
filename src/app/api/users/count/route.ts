import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

// GET /api/users/count - Obtener el total de usuarios
export async function GET() {
  try {
    const users = getUsers();
    // Log count internally without exposing details to client
    return NextResponse.json({ count: users.length });
  } catch (error) {
    // Log error internally without exposing details to client
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 