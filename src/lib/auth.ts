import jwt from 'jsonwebtoken';
import { findUserById } from './db';

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
      // eslint-disable-next-line no-console
      console.log('No se encontró el encabezado de autorización o no es un token Bearer');
      return false;
    }

    const token = authHeader.split(' ')[1];
    // eslint-disable-next-line no-console
    console.log(`Token recibido: ${token.substring(0, 10)}...`);
    
    try {
      const decoded = verifyToken(token);
      // eslint-disable-next-line no-console
      console.log('Token verificado, userId:', decoded.userId, 'role:', decoded.role);
      
      // Primero verificar si el token incluye el rol
      if (decoded.role === 'ADMIN') {
        // eslint-disable-next-line no-console
        console.log('Usuario es administrador según el token');
        return true;
      }
      
      // Si el token no incluye el rol, verificar en la base de datos
      const user = findUserById(decoded.userId);
      if (!user) {
        // eslint-disable-next-line no-console
        console.log('Usuario no encontrado para el ID:', decoded.userId);
        return false;
      }
      
      const isAdminUser = user.role === 'ADMIN';
      // eslint-disable-next-line no-console
      console.log('¿Es administrador?:', isAdminUser, 'Rol del usuario:', user.role);
      return isAdminUser;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al verificar token en isAdmin:', error);
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en isAdmin:', error);
    throw error;
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