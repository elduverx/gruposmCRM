import { PrismaClient, Role, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Prevenir múltiples instancias de Prisma Client en desarrollo
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Interface para la creación de usuario
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

// Interface para actualización de usuario
export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
}

// Obtener todos los usuarios
export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // No incluir la contraseña
      }
    });
    return users;
  } catch (error) {
    throw new Error(`Error al obtener usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Obtener un usuario por ID (sin la contraseña)
export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // No incluir la contraseña
      }
    });
    return user;
  } catch (error) {
    throw new Error(`Error al buscar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Encontrar usuario por email (incluyendo contraseña para autenticación)
export async function findUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    return user;
  } catch (error) {
    throw new Error(`Error al buscar usuario por email: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

import { createDefaultGoalsForUser } from './createDefaultGoals';

// Crear un nuevo usuario
export async function createUser(userData: CreateUserData) {
  try {
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Crear el usuario en la base de datos
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      }
    });

    // Crear las metas por defecto para el usuario
    await createDefaultGoalsForUser(user.id);
    
    // Retornar usuario sin contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error(`Error al crear usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Actualizar un usuario
export async function updateUser(id: string, userData: UpdateUserData) {
  try {
    // Preparar los datos para la actualización
    const updateData: Partial<User> = {};
    if (userData.name) updateData.name = userData.name;
    if (userData.email) updateData.email = userData.email;
    if (userData.role) updateData.role = userData.role;
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }
    
    // Actualizar el usuario
    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });
    
    // Retornar usuario sin contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error(`Error al actualizar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Eliminar un usuario
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    throw new Error(`Error al eliminar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Interface para usuarios importados desde JSON
interface JsonUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// Migrar usuarios desde JSON a la base de datos
export async function migrateUsersFromJson(jsonUsers: JsonUser[]) {
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const user of jsonUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        
        if (!existingUser) {
          // Insertar nuevo usuario
          await prisma.user.create({
            data: {
              id: user.id,
              name: user.name,
              email: user.email,
              password: user.password, // Asumimos que las contraseñas ya están hasheadas
              role: user.role,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt)
            }
          });
          results.success++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${user.email}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`Error durante la migración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
} 