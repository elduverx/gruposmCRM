import { NextResponse } from 'next/server';
import { getUsers, addUser, findUserByEmail, User } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { isAdmin, verifyToken } from '@/lib/auth';

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
}

// GET /api/users - Obtener todos los usuarios
export async function GET(request: Request) {
  try {
    // Verificar si el usuario está autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Log error internally without exposing details to client
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    try {
      verifyToken(token);
    } catch (error) {
      // Log error internally without exposing details to client
      return NextResponse.json(
        { message: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const users = getUsers();
    // Log count internally without exposing details to client
    return NextResponse.json(users);
  } catch (error) {
    // Log error internally without exposing details to client
    return NextResponse.json(
      { message: 'Error al obtener usuarios' },
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
      console.error('Error al verificar permisos de admin:', error);
      return NextResponse.json(
        { message: 'Error al verificar permisos', details: error instanceof Error ? error.message : 'Error desconocido' },
        { status: 401 }
      );
    }

    if (!isUserAdmin) {
      console.error('Usuario no tiene permisos de admin');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Datos recibidos para crear usuario:', JSON.stringify(body));
    
    const { name, email, password, role } = body as CreateUserRequest;

    // Validaciones básicas
    if (!name || !email || !password || !role) {
      console.error('Validación fallida - campos faltantes:', { name, email, password: !!password, role });
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      console.error('Email ya existe:', email);
      return NextResponse.json(
        { message: 'El correo electrónico ya está en uso' },
        { status: 400 }
      );
    }

    console.log('Iniciando creación de usuario:', email);
    
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Intentando guardar usuario en la base de datos');
    
    // Guardar el usuario
    const savedUser = addUser(newUser);
    console.log('Usuario guardado exitosamente:', savedUser.id);

    // Devolver el usuario creado (sin la contraseña)
    const { password: _unused, ...userWithoutPassword } = savedUser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void _unused; // Explicitly mark as intentionally unused
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
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