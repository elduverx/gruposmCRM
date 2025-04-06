import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { verifyToken, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      
      const user = findUserById(decoded.userId);
      if (!user) {
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Generar un nuevo token
      const newToken = generateToken(user.id, user.role);

      return NextResponse.json({ token: newToken });
    } catch (error) {
      console.error('Error al verificar token:', error);
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error en el endpoint /api/auth/refresh:', error);
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 