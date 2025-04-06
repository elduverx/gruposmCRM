import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware para verificar si el usuario es administrador
const isAdmin = async (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    return decoded.role === 'ADMIN';
  } catch (error) {
    console.error('Error al verificar token:', error);
    return false;
  }
};

// GET /api/users/count - Obtener el total de usuarios
export async function GET(request: Request) {
  try {
    // Verificar si el usuario es administrador
    const admin = await isAdmin(request);
    if (!admin) {
      console.log('Usuario no autorizado para contar usuarios');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

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