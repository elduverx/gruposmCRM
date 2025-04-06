import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, initializeDb } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Initialize the database with a default admin user if it doesn't exist
    await initializeDb();
    
    const { email, password } = await request.json();

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Correo electrónico y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar el usuario
    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    console.log('Usuario autenticado:', user.id, 'con rol:', user.role);

    // Generar token JWT
    const token = generateToken(user.id, user.role);

    // Devolver el token y los datos del usuario (sin la contraseña)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error en el login:', error);
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 