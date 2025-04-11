import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, initializeDb } from '@/lib/db';
import { generateToken } from '@/lib/auth';

interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
}

export async function POST(request: Request) {
  try {
    // Initialize the database with a default admin user if it doesn't exist
    await initializeDb();
    
    const { email, password } = await request.json() as LoginRequest;

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

    // Generar token JWT
    const token = generateToken(user.id, user.role);

    // Devolver el token y los datos del usuario (sin la contraseña)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _unused, ...userWithoutPassword } = user as User;
    
    return NextResponse.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    // Log error internally without exposing details to client
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 