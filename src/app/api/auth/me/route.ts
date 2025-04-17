import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/prisma-users';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Obtener el token del header de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verificar el token
    try {
      const decoded = verifyToken(token);
      
      // Intentar obtener el usuario de Prisma primero
      try {
        const prismaUser = await getUserById(decoded.userId);
        if (prismaUser) {
          return NextResponse.json(prismaUser);
        }
      } catch (prismaError) {
        // eslint-disable-next-line no-console
        console.error('Error al buscar usuario en Prisma:', prismaError);
      }
      
      // Si no se encuentra en Prisma, buscar en JSON
      const jsonUser = findUserById(decoded.userId);
      if (!jsonUser) {
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Devolver los datos del usuario (sin la contraseña)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _unused, ...userWithoutPassword } = jsonUser;
      
      return NextResponse.json(userWithoutPassword);
    } catch (error) {
      // Log error internally without exposing details to client
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    // Log error internally without exposing details to client
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 
