import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, initializeDb } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { findUserByEmail as findUserByEmailPrisma } from '@/lib/prisma-users';
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
    // Initialize the database with a default admin user if it doesn't exist
    await initializeDb();
    
    const { email, password } = await request.json() as LoginRequest;

    // Validaciones básicas
    if (!email || !password) {
      // eslint-disable-next-line no-console
      console.log('Faltan email o password');
      return NextResponse.json(
        { message: 'Correo electrónico y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Intento de autenticación con Prisma primero
    let user: User | null = null;
    let isPasswordValid = false;
    
    try {
      // eslint-disable-next-line no-console
      console.log('Intentando autenticar con Prisma para el email:', email);
      const prismaUser = await findUserByEmailPrisma(email);
      
      if (prismaUser) {
        // eslint-disable-next-line no-console
        console.log('Usuario encontrado en Prisma, verificando contraseña');
        isPasswordValid = await bcrypt.compare(password, prismaUser.password);
        
        if (isPasswordValid) {
          // eslint-disable-next-line no-console
          console.log('Contraseña válida en Prisma');
          // Transformar al formato esperado
          user = {
            id: prismaUser.id,
            name: prismaUser.name || '',
            email: prismaUser.email,
            password: prismaUser.password,
            role: prismaUser.role,
            createdAt: prismaUser.createdAt.toISOString(),
            updatedAt: prismaUser.updatedAt.toISOString()
          };
        } else {
          // eslint-disable-next-line no-console
          console.log('Contraseña inválida en Prisma');
        }
      } else {
        // eslint-disable-next-line no-console
        console.log('Usuario no encontrado en Prisma');
      }
    } catch (prismaError) {
      // eslint-disable-next-line no-console
      console.error('Error al autenticar con Prisma:', prismaError);
    }

    // Si no se encontró en Prisma, intentar con JSON
    if (!user || !isPasswordValid) {
      // eslint-disable-next-line no-console
      console.log('Intentando autenticar con JSON para el email:', email);
      const jsonUser = findUserByEmail(email);
      
      if (!jsonUser) {
        // eslint-disable-next-line no-console
        console.log('Usuario no encontrado en JSON');
        return NextResponse.json(
          { message: 'Credenciales inválidas' },
          { status: 401 }
        );
      }

      isPasswordValid = await bcrypt.compare(password, jsonUser.password);
      if (!isPasswordValid) {
        // eslint-disable-next-line no-console
        console.log('Contraseña inválida en JSON');
        return NextResponse.json(
          { message: 'Credenciales inválidas' },
          { status: 401 }
        );
      }
      
      // eslint-disable-next-line no-console
      console.log('Autenticación exitosa con JSON');
      user = jsonUser;
    } else {
      // eslint-disable-next-line no-console
      console.log('Autenticación exitosa con Prisma');
    }

    if (!user) {
      // Este caso no debería ocurrir, pero para estar seguros
      return NextResponse.json(
        { message: 'Error en la autenticación' },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = generateToken(user.id, String(user.role));

    // Devolver el token y los datos del usuario (sin la contraseña)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _unused, ...userWithoutPassword } = user;
    
    // eslint-disable-next-line no-console
    console.log('Login exitoso, devolviendo token y datos de usuario');
    
    return NextResponse.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error general en login:', error);
    // Log error internally without exposing details to client
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 