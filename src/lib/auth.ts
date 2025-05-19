import jwt from 'jsonwebtoken';
import { findUserById } from './db';
import { getUserById } from './prisma-users';
import { cookies } from 'next/headers';

// Custom error class for authentication operations
class AuthError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AuthError';
  }
}

// Clave secreta para JWT
export const JWT_SECRET = process.env.JWT_SECRET || 'gruposm_crm_secret_key_2024';

// Verificar que la clave secreta no sea la predeterminada
if (JWT_SECRET === 'your-secret-key') {
  throw new AuthError('ADVERTENCIA: Se está utilizando una clave secreta predeterminada. Por favor, configure JWT_SECRET en las variables de entorno.');
}

// Verificar si el token es válido y devolver el usuario decodificado
export const verifyToken = (token: string) => {
  try {
    if (!token) {
      throw new AuthError('Token no proporcionado');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; exp: number };

      // Verificar si el token ha expirado
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        throw new AuthError('Token expirado');
      }

      return decoded;
    } catch (jwtError) {
      // Manejar específicamente errores de JWT
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token expirado');
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Token inválido');
      } else {
        throw new AuthError('Error al verificar token', jwtError);
      }
    }
  } catch (error) {
    throw new AuthError('Error al verificar token', error);
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
      throw new AuthError('Error al verificar en Prisma', prismaError);
    }

    // Si no se encuentra en Prisma, intentar con JSON
    try {
      const jsonUser = findUserById(decoded.userId);
      if (jsonUser) {
        return jsonUser.role === 'ADMIN';
      }
    } catch (jsonError) {
      throw new AuthError('Error al verificar en JSON', jsonError);
    }

    return false;
  } catch (error) {
    throw new AuthError('Error en isAdmin', error);
  }
};

// Generar un token JWT
export const generateToken = (userId: string, role: string) => {
  try {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { 
      expiresIn: '24h',
    }
  );
  } catch (error) {
    throw new AuthError('Error al generar token', error);
  }
};

// Obtener el ID del usuario actual basado en el token de autenticación
export async function getCurrentUserId(request?: Request): Promise<string | null> {
  try {
    let token: string | undefined;
    
    // Check if request object is provided (API routes)
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    // If no token found in request headers, check cookies (server components)
    if (!token) {
      const cookieStore = cookies();
      token = cookieStore.get('auth_token')?.value;
    }
    
    if (!token) {
      return null;
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new AuthError('Error al verificar token', error);
    }
  } catch (error) {
    throw new AuthError('Error al obtener ID de usuario', error);
  }
} 