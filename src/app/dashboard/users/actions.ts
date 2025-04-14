import { getUsers as getUsersFromDb, User } from '@/lib/db';

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