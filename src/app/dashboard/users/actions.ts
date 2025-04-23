import { getUsers as getUsersFromDb, User } from '@/lib/db';
import { prisma } from '@/lib/prisma';

/**
 * Obtiene todos los usuarios del sistema
 * @returns Lista de usuarios
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    return getUsersFromDb();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al obtener usuarios:', error);
    throw new Error('Error al obtener usuarios');
  }
};

/**
 * Obtiene todos los usuarios para usar en formularios de selección de responsables
 * @returns Lista simplificada de usuarios para dropdown
 */
export const getUsersForSelect = async (): Promise<{id: string; name: string}[]> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return users.map(user => ({
      id: user.id,
      name: user.name || user.email.split('@')[0] // Si no hay nombre, usa la primera parte del email
    }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al obtener usuarios para selector:', error);
    return [];
  }
}; 