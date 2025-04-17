import { NextResponse } from 'next/server';
import { findUserById as findUserByIdJson, updateUser as updateUserJson, deleteUser as deleteUserJson, findUserByEmail as findUserByEmailJson, getUsers as getUsersJson } from '@/lib/db';
import { getUserById, updateUser, deleteUser, findUserByEmail, getUsers } from '@/lib/prisma-users';
import bcrypt from 'bcryptjs';
import { isAdmin as checkIsAdmin } from '@/lib/auth';
import { Role } from '@prisma/client';

interface UpdateUserData {
  name: string;
  email: string;
  role?: Role;
  password?: string;
}

// GET /api/users/[id] - Obtener un usuario por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si el usuario es administrador
    const admin = await checkIsAdmin(request);
    if (!admin) {
      // eslint-disable-next-line no-console
      console.error('Acceso no autorizado a GET /api/users/[id]');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    try {
      // Intentar obtener con Prisma
      // eslint-disable-next-line no-console
      console.log(`Buscando usuario ${params.id} con Prisma`);
      const user = await getUserById(params.id);
      
      if (!user) {
        // eslint-disable-next-line no-console
        console.log(`Usuario ${params.id} no encontrado en Prisma`);
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
      
      // eslint-disable-next-line no-console
      console.log(`Usuario ${params.id} encontrado en Prisma`);
      return NextResponse.json(user);
    } catch (prismaError) {
      // eslint-disable-next-line no-console
      console.error(`Error al obtener usuario ${params.id} de Prisma:`, prismaError);
      
      // Fallback al JSON
      // eslint-disable-next-line no-console
      console.log(`Intentando obtener usuario ${params.id} del JSON como fallback`);
      const jsonUser = findUserByIdJson(params.id);
      
      if (!jsonUser) {
        // eslint-disable-next-line no-console
        console.log(`Usuario ${params.id} no encontrado en JSON`);
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
      
      // Devolver los datos del usuario (sin la contraseña)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _unused, ...userWithoutPassword } = jsonUser;
      // eslint-disable-next-line no-console
      console.log(`Usuario ${params.id} encontrado en JSON`);
      return NextResponse.json(userWithoutPassword);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en GET /api/users/[id]:', error);
    return NextResponse.json(
      { message: 'Error en el servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
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
    const admin = await checkIsAdmin(request);
    if (!admin) {
      // eslint-disable-next-line no-console
      console.error('Acceso no autorizado a PUT /api/users/[id]');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { name, email, password, role } = await request.json() as UpdateUserData;
    // eslint-disable-next-line no-console
    console.log(`Datos recibidos para actualizar usuario ${params.id}:`, { name, email, role, hasPassword: !!password });

    // Validaciones básicas
    if (!name || !email) {
      // eslint-disable-next-line no-console
      console.error('Validación fallida - nombre o email faltantes');
      return NextResponse.json(
        { message: 'Nombre y email son requeridos' },
        { status: 400 }
      );
    }

    try {
      // Verificar si el usuario existe en Prisma
      const existingUser = await getUserById(params.id);
      if (!existingUser) {
        // eslint-disable-next-line no-console
        console.log(`Usuario ${params.id} no encontrado en Prisma`);
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
      
      // Verificar si el email ya está en uso por otro usuario
      const userWithEmail = await findUserByEmail(email);
      if (userWithEmail && userWithEmail.id !== params.id) {
        // eslint-disable-next-line no-console
        console.error(`Email ${email} ya está en uso por otro usuario`);
        return NextResponse.json(
          { message: 'El correo electrónico ya está registrado' },
          { status: 400 }
        );
      }
      
      // Actualizar con Prisma
      // eslint-disable-next-line no-console
      console.log(`Actualizando usuario ${params.id} con Prisma`);
      const updatedUser = await updateUser(params.id, {
        name,
        email,
        role: role as Role,
        password
      });
      
      // eslint-disable-next-line no-console
      console.log(`Usuario ${params.id} actualizado con Prisma`);
      return NextResponse.json(updatedUser);
    } catch (prismaError) {
      // eslint-disable-next-line no-console
      console.error(`Error al actualizar usuario ${params.id} con Prisma:`, prismaError);
      
      // Fallback al JSON
      // eslint-disable-next-line no-console
      console.log(`Intentando actualizar usuario ${params.id} en JSON como fallback`);
      
      // Verificar si el usuario existe en JSON
      const jsonUser = findUserByIdJson(params.id);
      if (!jsonUser) {
        // eslint-disable-next-line no-console
        console.log(`Usuario ${params.id} no encontrado en JSON`);
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
      
      // Verificar si el email ya está en uso por otro usuario
      const jsonUserWithEmail = findUserByEmailJson(email);
      if (jsonUserWithEmail && jsonUserWithEmail.id !== params.id) {
        // eslint-disable-next-line no-console
        console.error(`Email ${email} ya está en uso por otro usuario en JSON`);
        return NextResponse.json(
          { message: 'El correo electrónico ya está registrado' },
          { status: 400 }
        );
      }
      
      // Preparar los datos actualizados
      const updatedData: Record<string, unknown> = {
        name,
        email,
        role: role || jsonUser.role,
      };
      
      // Si se proporciona una nueva contraseña, hashearla
      if (password) {
        updatedData.password = await bcrypt.hash(password, 10);
      }
      
      // Actualizar el usuario en JSON
      const updatedJsonUser = updateUserJson(params.id, updatedData);
      if (!updatedJsonUser) {
        // eslint-disable-next-line no-console
        console.error(`Error al actualizar usuario ${params.id} en JSON`);
        return NextResponse.json(
          { message: 'Error al actualizar el usuario' },
          { status: 500 }
        );
      }
      
      // Devolver los datos del usuario actualizado (sin la contraseña)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _unused, ...userWithoutPassword } = updatedJsonUser;
      // eslint-disable-next-line no-console
      console.log(`Usuario ${params.id} actualizado en JSON`);
      return NextResponse.json(userWithoutPassword);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en PUT /api/users/[id]:', error);
    return NextResponse.json(
      { message: 'Error en el servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
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
    const admin = await checkIsAdmin(request);
    if (!admin) {
      // eslint-disable-next-line no-console
      console.error('Acceso no autorizado a DELETE /api/users/[id]');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    try {
      // Verificar si el usuario existe en Prisma
      const existingUser = await getUserById(params.id);
      if (!existingUser) {
        // eslint-disable-next-line no-console
        console.log(`Usuario ${params.id} no encontrado en Prisma`);
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
      
      // No permitir eliminar el último administrador
      if (existingUser.role === 'ADMIN') {
        const allUsers = await getUsers();
        const adminCount = allUsers.filter((u) => u.role === 'ADMIN').length;
        
        if (adminCount <= 1) {
          // eslint-disable-next-line no-console
          console.error('Intento de eliminar el último administrador');
          return NextResponse.json(
            { message: 'No se puede eliminar el último administrador' },
            { status: 400 }
          );
        }
      }
      
      // Eliminar con Prisma
      // eslint-disable-next-line no-console
      console.log(`Eliminando usuario ${params.id} con Prisma`);
      await deleteUser(params.id);
      
      // eslint-disable-next-line no-console
      console.log(`Usuario ${params.id} eliminado con Prisma`);
      return NextResponse.json({ message: 'Usuario eliminado correctamente' });
    } catch (prismaError) {
      // eslint-disable-next-line no-console
      console.error(`Error al eliminar usuario ${params.id} con Prisma:`, prismaError);
      
      // Fallback al JSON
      // eslint-disable-next-line no-console
      console.log(`Intentando eliminar usuario ${params.id} del JSON como fallback`);
      
      // Verificar si el usuario existe en JSON
      const jsonUser = findUserByIdJson(params.id);
      if (!jsonUser) {
        // eslint-disable-next-line no-console
        console.log(`Usuario ${params.id} no encontrado en JSON`);
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
      
      // No permitir eliminar el último administrador
      if (jsonUser.role === 'ADMIN') {
        const allJsonUsers = getUsersJson();
        const adminCount = allJsonUsers.filter((u) => u.role === 'ADMIN').length;
        
        if (adminCount <= 1) {
          // eslint-disable-next-line no-console
          console.error('Intento de eliminar el último administrador en JSON');
          return NextResponse.json(
            { message: 'No se puede eliminar el último administrador' },
            { status: 400 }
          );
        }
      }
      
      // Eliminar del JSON
      const success = deleteUserJson(params.id);
      if (!success) {
        // eslint-disable-next-line no-console
        console.error(`Error al eliminar usuario ${params.id} del JSON`);
        return NextResponse.json(
          { message: 'Error al eliminar el usuario' },
          { status: 500 }
        );
      }
      
      // eslint-disable-next-line no-console
      console.log(`Usuario ${params.id} eliminado del JSON`);
      return NextResponse.json({ message: 'Usuario eliminado correctamente' });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en DELETE /api/users/[id]:', error);
    return NextResponse.json(
      { message: 'Error en el servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 