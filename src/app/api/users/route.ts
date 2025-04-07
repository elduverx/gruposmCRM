import { NextResponse } from 'next/server';
import { getUsers, addUser, findUserByEmail, findUserById, User } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { isAdmin, verifyToken } from '@/lib/auth';

// GET /api/users - Obtener todos los usuarios
export async function GET(request: Request) {
  try {
    // Verificar si el usuario está autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Usuario no autenticado');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    try {
      verifyToken(token);
    } catch (error) {
      console.error('Error al verificar token:', error);
      return NextResponse.json(
        { message: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const users = getUsers();
    console.log('Usuarios obtenidos:', users.length);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
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
      console.error('Error al verificar si el usuario es administrador:', error);
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

    const { name, email, password, role } = await request.json();

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
      role: role as 'ADMIN' | 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Guardar el usuario
    const savedUser = addUser(newUser);
    console.log('Usuario guardado:', savedUser);

    // Devolver el usuario creado (sin la contraseña)
    const { password: _, ...userWithoutPassword } = savedUser;
    console.log('Usuario devuelto:', userWithoutPassword);
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { message: 'Error al crear usuario' },
      { status: 500 }
    );
  }
} 