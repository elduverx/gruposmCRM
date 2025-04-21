import jwt from 'jsonwebtoken';
import { findUserById } from './db';
import { findUserByEmail as findUserByEmailPrisma } from './prisma-users';
import { getUserById } from './prisma-users';
import { cookies } from 'next/headers';

// Clave secreta para JWT
export const JWT_SECRET = process.env.JWT_SECRET || 'gruposm_crm_secret_key_2024';

// Verificar que la clave secreta no sea la predeterminada
if (JWT_SECRET === 'your-secret-key') {
  // eslint-disable-next-line no-console
  console.warn('ADVERTENCIA: Se está utilizando una clave secreta predeterminada. Por favor, configure JWT_SECRET en las variables de entorno.');
}

// Verificar si el token es válido y devolver el usuario decodificado
export const verifyToken = (token: string) => {
  try {
    if (!token) {
      // eslint-disable-next-line no-console
      console.error('Token no proporcionado');
      throw new Error('Token no proporcionado');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; exp: number };
      // eslint-disable-next-line no-console
      console.log('Token decodificado:', { userId: decoded.userId, role: decoded.role });

      // Verificar si el token ha expirado
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        // eslint-disable-next-line no-console
        console.error('Token expirado');
        throw new Error('Token expirado');
      }

      return decoded;
    } catch (jwtError) {
      // Manejar específicamente errores de JWT
      if (jwtError instanceof jwt.TokenExpiredError) {
        // eslint-disable-next-line no-console
        console.error('Token expirado (JWT):', jwtError.message);
        throw new Error('Token expirado');
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        // eslint-disable-next-line no-console
        console.error('Token inválido (JWT):', jwtError.message);
        throw new Error('Token inválido');
      } else {
        // eslint-disable-next-line no-console
        console.error('Error al verificar token (JWT):', jwtError);
        throw jwtError;
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al verificar token:', error);
    throw error;
  }
};

// Verificar si el usuario es administrador
export const isAdmin = async (request: Request) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as { userId: string };

    // Intentar primero con Prisma
    try {
      const prismaUser = await getUserById(decoded.userId);
      if (prismaUser) {
        return prismaUser.role === 'ADMIN';
      }
    } catch (prismaError) {
      console.error('Error al verificar en Prisma:', prismaError);
    }

    // Si no se encuentra en Prisma, intentar con JSON
    try {
      const jsonUser = findUserById(decoded.userId);
      if (jsonUser) {
        return jsonUser.role === 'ADMIN';
      }
    } catch (jsonError) {
      console.error('Error al verificar en JSON:', jsonError);
    }

    return false;
  } catch (error) {
    console.error('Error en isAdmin:', error);
    return false;
  }
};

// Generar un token JWT
export const generateToken = (userId: string, role: string) => {
  // eslint-disable-next-line no-console
  console.log('Generando token para usuario:', userId, 'con rol:', role);
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { 
      expiresIn: '24h',
    }
  );
};

// Obtener el ID del usuario actual basado en el token de autenticación
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      return null;
    }
  } catch (error) {
    return null;
  }
} 