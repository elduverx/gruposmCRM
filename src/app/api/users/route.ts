import { NextResponse } from 'next/server';
import { addUser, User } from '@/lib/db';
import { createUser, findUserByEmail as findUserByEmailPrisma } from '@/lib/prisma-users';
import bcrypt from 'bcryptjs';
import { isAdmin, getCurrentUserId } from '@/lib/auth';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

// GET /api/users - Obtener todos los usuarios
export async function GET(request: Request) {
  try {
    // Simplemente verificar si hay un usuario autenticado
    const currentUserId = await getCurrentUserId(request);
    
    if (!currentUserId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener todos los usuarios sin importar el rol
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/users - Crear un nuevo usuario
export async function POST(request: Request) {
  try {
    // Verificar si el usuario es administrador
    let isUserAdmin = false;
    try {
      isUserAdmin = await isAdmin(request);
    } catch (error) {
      return NextResponse.json(
        { message: 'Error al verificar permisos', details: error instanceof Error ? error.message : 'Error desconocido' },
        { status: 401 }
      );
    }

    if (!isUserAdmin) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json() as unknown;
    const { name, email, password, role } = body as CreateUserRequest;

    // Validaciones básicas
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await findUserByEmailPrisma(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'El correo electrónico ya está en uso' },
        { status: 400 }
      );
    }
    
    try {
      // Intentar crear con Prisma
      const newUser = await createUser({
        name,
        email,
        password,
        role: role === 'ADMIN' || role === 'USER' ? role : 'USER'
      });
      
      return NextResponse.json(newUser, { status: 201 });
    } catch (prismaError) {
      // Fallback al método original (JSON)
      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Crear el usuario en JSON
      const jsonUser: User = {
        id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        role: role as 'ADMIN' | 'USER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const savedUser = addUser(jsonUser);
      
      // Devolver el usuario creado (sin la contraseña)
      const { password: _, ...userWithoutPassword } = savedUser;
      return NextResponse.json(userWithoutPassword, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { 
        message: 'Error al crear usuario', 
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.stack : null) : null
      },
      { status: 500 }
    );
  }
} 