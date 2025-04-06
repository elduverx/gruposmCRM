import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { verifyToken, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No se encontró el encabezado de autorización o no es un token Bearer');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log('Token recibido para refrescar:', token.substring(0, 10) + '...');
    
    try {
      const decoded = verifyToken(token);
      console.log('Token verificado, userId:', decoded.userId);
      
      const user = findUserById(decoded.userId);
      if (!user) {
        console.log('Usuario no encontrado para el ID:', decoded.userId);
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Generar un nuevo token
      const newToken = generateToken(user.id, user.role);
      console.log('Nuevo token generado para usuario:', user.id);

      return NextResponse.json({ 
        token: newToken,
        message: 'Token refrescado exitosamente'
      });
    } catch (error) {
      console.error('Error al verificar token:', error);
      return NextResponse.json(
        { message: 'Token inválido o expirado' },
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