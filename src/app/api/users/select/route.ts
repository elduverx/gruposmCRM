import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-users';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name || user.email.split('@')[0] // Si no hay nombre, usa la primera parte del email
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error al obtener usuarios',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 500 }
    );
  }
} 