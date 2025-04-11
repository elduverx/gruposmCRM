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
      // Log error internally without exposing details to client
      return NextResponse.json(
        { message: 'Error al verificar permisos' },
        { status: 401 }
      );
    }

    if (!isUserAdmin) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { name, email, password, role } = await request.json() as CreateUserRequest;

    // Validaciones básicas
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'El correo electrónico ya está en uso' },
        { status: 400 }
      );
    }

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

    // Guardar el usuario
    const savedUser = addUser(newUser);
    // Log success internally without exposing details to client

    // Devolver el usuario creado (sin la contraseña)
    const { password: _unused, ...userWithoutPassword } = savedUser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void _unused; // Explicitly mark as intentionally unused
    // Log response internally without exposing details to client
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    // Log error internally without exposing details to client
    return NextResponse.json(
      { message: 'Error al crear usuario' },
      { status: 500 }
    );
  }
} 