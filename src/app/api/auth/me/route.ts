import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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
      
      // Buscar el usuario
      const user = findUserById(decoded.userId);
      if (!user) {
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Devolver los datos del usuario (sin la contraseña)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _unused, ...userWithoutPassword } = user;
      
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
