import { NextResponse } from 'next/server';
import { verifyToken, generateToken } from '@/lib/auth';
import { findUserById } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Buscar el usuario
    const user = findUserById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Generar nuevo token
    const newToken = generateToken(user.id, user.role);

    // Devolver el nuevo token y los datos del usuario (sin la contraseña)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      token: newToken,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 