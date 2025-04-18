import { NextResponse } from 'next/server';
import { getUsers as getJsonUsers, addUser, User } from '@/lib/db';
import { getUsers, createUser, findUserByEmail as findUserByEmailPrisma } from '@/lib/prisma-users';
import bcrypt from 'bcryptjs';
import { isAdmin, verifyToken } from '@/lib/auth';
import { Role } from '@prisma/client';

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

// GET /api/users - Obtener todos los usuarios
export async function GET(request: Request) {
  try {
    // Verificar si el usuario está autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // eslint-disable-next-line no-console
      console.error('No se encontró encabezado de autorización');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    try {
      verifyToken(token);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Token inválido:', error);
      return NextResponse.json(
        { message: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    try {
      // Usar la nueva función de Prisma
      const users = await getUsers();
      return NextResponse.json(users);
    } catch (prismaError) {
      // eslint-disable-next-line no-console
      console.error('Error al obtener usuarios de Prisma:', prismaError);
      
      // Fallback a la función original (JSON)
      // eslint-disable-next-line no-console
      console.log('Intentando obtener usuarios del JSON como fallback...');
      const jsonUsers = getJsonUsers();
      return NextResponse.json(jsonUsers);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error general al obtener usuarios:', error);
    return NextResponse.json(
      { message: 'Error al obtener usuarios', details: error instanceof Error ? error.message : 'Error desconocido' },
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
      // eslint-disable-next-line no-console
      console.error('Error al verificar permisos de admin:', error);
      return NextResponse.json(
        { message: 'Error al verificar permisos', details: error instanceof Error ? error.message : 'Error desconocido' },
        { status: 401 }
      );
    }

    if (!isUserAdmin) {
      // eslint-disable-next-line no-console
      console.error('Usuario no tiene permisos de admin');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json() as unknown;
    // eslint-disable-next-line no-console
    console.log('Datos recibidos para crear usuario:', JSON.stringify(body));
    
    // Type assertion with proper interface
    const { name, email, password, role } = body as CreateUserRequest;

    // Validaciones básicas
    if (!name || !email || !password || !role) {
      // eslint-disable-next-line no-console
      console.error('Validación fallida - campos faltantes:', { name, email, password: !!password, role });
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await findUserByEmailPrisma(email);
    if (existingUser) {
      // eslint-disable-next-line no-console
      console.error('Email ya existe:', email);
      return NextResponse.json(
        { message: 'El correo electrónico ya está en uso' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line no-console
    console.log('Iniciando creación de usuario con Prisma:', email);
    
    try {
      // Intentar crear con Prisma
      const newUser = await createUser({
        name,
        email,
        password,
        role: role === 'ADMIN' || role === 'USER' ? role : 'USER'
      });
      
      // eslint-disable-next-line no-console
      console.log('Usuario creado exitosamente con Prisma:', newUser.id);
      return NextResponse.json(newUser, { status: 201 });
    } catch (prismaError) {
      // eslint-disable-next-line no-console
      console.error('Error al crear usuario con Prisma:', prismaError);
      
      // Fallback al método original (JSON)
      // eslint-disable-next-line no-console
      console.log('Intentando crear usuario en JSON como fallback...');
      
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
      // eslint-disable-next-line no-console
      console.log('Usuario guardado en JSON como fallback:', savedUser.id);
      
      // Devolver el usuario creado (sin la contraseña)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _unused, ...userWithoutPassword } = savedUser;
      return NextResponse.json(userWithoutPassword, { status: 201 });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error detallado al crear usuario:', error);
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