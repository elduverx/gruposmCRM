import { PrismaClient, Role } from '@prisma/client';
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
    console.log('Obteniendo usuarios de la base de datos...');
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
    console.log(`Se encontraron ${users.length} usuarios`);
    return users;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw new Error(`Error al obtener usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Obtener un usuario por ID (sin la contraseña)
export async function getUserById(id: string) {
  try {
    console.log(`Buscando usuario con ID: ${id}`);
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
    console.log(user ? 'Usuario encontrado' : 'Usuario no encontrado');
    return user;
  } catch (error) {
    console.error(`Error al buscar usuario por ID ${id}:`, error);
    throw new Error(`Error al buscar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Encontrar usuario por email (incluyendo contraseña para autenticación)
export async function findUserByEmail(email: string) {
  try {
    console.log(`Buscando usuario por email: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email }
    });
    console.log(user ? 'Usuario encontrado por email' : 'Usuario no encontrado por email');
    return user;
  } catch (error) {
    console.error(`Error al buscar usuario por email ${email}:`, error);
    throw new Error(`Error al buscar usuario por email: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Crear un nuevo usuario
export async function createUser(userData: CreateUserData) {
  try {
    console.log(`Creando usuario con email: ${userData.email}`);
    
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
    
    console.log(`Usuario creado con ID: ${user.id}`);
    
    // Retornar usuario sin contraseña
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw new Error(`Error al crear usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Actualizar un usuario
export async function updateUser(id: string, userData: UpdateUserData) {
  try {
    console.log(`Actualizando usuario con ID: ${id}`);
    
    // Preparar los datos para la actualización
    const updateData: any = {};
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
    
    console.log(`Usuario actualizado: ${user.id}`);
    
    // Retornar usuario sin contraseña
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error(`Error al actualizar usuario ${id}:`, error);
    throw new Error(`Error al actualizar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Eliminar un usuario
export async function deleteUser(id: string) {
  try {
    console.log(`Eliminando usuario con ID: ${id}`);
    await prisma.user.delete({
      where: { id }
    });
    console.log(`Usuario eliminado: ${id}`);
    return true;
  } catch (error) {
    console.error(`Error al eliminar usuario ${id}:`, error);
    throw new Error(`Error al eliminar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Migrar usuarios desde JSON a la base de datos
export async function migrateUsersFromJson(jsonUsers: any[]) {
  try {
    console.log(`Migrando ${jsonUsers.length} usuarios desde JSON...`);
    
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
              role: user.role as Role,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt)
            }
          });
          results.success++;
        } else {
          console.log(`El usuario ${user.email} ya existe, omitiendo...`);
        }
      } catch (error) {
        console.error(`Error al migrar usuario ${user.email}:`, error);
        results.failed++;
        results.errors.push(`${user.email}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
    
    console.log(`Migración completada: ${results.success} exitosos, ${results.failed} fallidos`);
    return results;
  } catch (error) {
    console.error('Error durante la migración:', error);
    throw new Error(`Error durante la migración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
} 