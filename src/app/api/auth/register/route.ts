import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, addUser, initializeDb, User } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    // Initialize the database with a default admin user if it doesn't exist
    await initializeDb();
    
    const { name, email, password } = await request.json() as RegisterRequest;

    // Validaciones básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'El correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: 'USER', // Rol por defecto
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Guardar el usuario
    addUser(newUser);

    // Generar token JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Devolver el token y los datos del usuario (sin la contraseña)
    const { password: _unused, ...userWithoutPassword } = newUser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void _unused; // Explicitly mark as intentionally unused
    
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