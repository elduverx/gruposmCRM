import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '@/lib/prisma-users';
import { generateToken } from '@/lib/auth';
import { Role } from '@prisma/client';

interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
  password: string;
  role: string | Role;
  createdAt?: string;
  updatedAt?: string;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json() as LoginRequest;

    // Validaciones básicas
    if (!email || !password) {
      console.log('Faltan email o password');
      return NextResponse.json(
        { message: 'Correo electrónico y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario en la base de datos
    const user = await findUserByEmail(email);
    
    if (!user) {
      console.log('Usuario no encontrado');
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Contraseña inválida');
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = generateToken(user.id, String(user.role));

    // Devolver el token y los datos del usuario (sin la contraseña)
    const { password: _unused, ...userWithoutPassword } = user;
    
    console.log('Login exitoso, devolviendo token y datos de usuario');
    
    return NextResponse.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error general en login:', error);
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 