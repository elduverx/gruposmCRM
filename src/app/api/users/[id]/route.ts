import { NextResponse } from 'next/server';
import { findUserById, updateUser, deleteUser, findUserByEmail, getUsers } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware para verificar si el usuario es administrador
const isAdmin = async (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    return decoded.role === 'ADMIN';
  } catch (error) {
    return false;
  }
};

// GET /api/users/[id] - Obtener un usuario por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si el usuario es administrador
    const admin = await isAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = findUserById(params.id);
    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Devolver los datos del usuario (sin la contraseña)
    const { password: _password, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Actualizar un usuario
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si el usuario es administrador
    const admin = await isAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = findUserById(params.id);
    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const { name, email, password, role } = await request.json();

    // Validaciones básicas
    if (!name || !email) {
      return NextResponse.json(
        { message: 'Nombre y email son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya está en uso por otro usuario
    const existingUser = findUserByEmail(email);
    if (existingUser && existingUser.id !== params.id) {
      return NextResponse.json(
        { message: 'El correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    // Preparar los datos actualizados
    const updatedData: any = {
      name,
      email,
      role: role || user.role,
    };

    // Si se proporciona una nueva contraseña, hashearla
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    // Actualizar el usuario
    const updatedUser = updateUser(params.id, updatedData);
    if (!updatedUser) {
      return NextResponse.json(
        { message: 'Error al actualizar el usuario' },
        { status: 500 }
      );
    }

    // Devolver los datos del usuario actualizado (sin la contraseña)
    const { password: _password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Eliminar un usuario
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si el usuario es administrador
    const admin = await isAdmin(request);
    if (!admin) {
      console.log('Usuario no autorizado para eliminar');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = findUserById(params.id);
    if (!user) {
      console.log('Usuario no encontrado para eliminar:', params.id);
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // No permitir eliminar el último administrador
    if (user.role === 'ADMIN') {
      const allUsers = getUsers();
      const adminCount = allUsers.filter((u) => u.role === 'ADMIN').length;
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { message: 'No se puede eliminar el último administrador' },
          { status: 400 }
        );
      }
    }

    // Eliminar el usuario
    const success = deleteUser(params.id);
    if (!success) {
      return NextResponse.json(
        { message: 'Error al eliminar el usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 