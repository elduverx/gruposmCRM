import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

// GET /api/users/count - Obtener el total de usuarios
export async function GET() {
  try {
    const users = getUsers();
    console.log('Total de usuarios:', users.length);
    
    return NextResponse.json({ count: users.length });
  } catch (error) {
    console.error('Error al contar usuarios:', error);
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 