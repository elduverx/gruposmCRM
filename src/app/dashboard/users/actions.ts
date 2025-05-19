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

/**
 * Obtiene una lista simplificada de usuarios para usar en selectores
 * @returns Lista de usuarios con id y name
 */
export const getUsersForSelect = async (): Promise<{id: string; name: string}[]> => {
  try {
    const users = await getUsersFromDb();
    return users.map(user => ({
      id: user.id,
      name: user.name
    }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al obtener usuarios para selector:', error);
    throw new Error('Error al obtener usuarios para selector');
  }
}; 