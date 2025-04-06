import jwt from 'jsonwebtoken';
import { findUserById } from './db';

// Clave secreta para JWT
export const JWT_SECRET = process.env.JWT_SECRET || 'gruposm_crm_secret_key_2024';

// Verificar que la clave secreta no sea la predeterminada
if (JWT_SECRET === 'your-secret-key') {
  console.warn('ADVERTENCIA: Se está utilizando una clave secreta predeterminada. Por favor, configure JWT_SECRET en las variables de entorno.');
}

// Verificar si el token es válido y devolver el usuario decodificado
export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    console.log('Token decodificado:', decoded);
    return decoded;
  } catch (error) {
    console.error('Error al verificar token:', error);
    // No devolvemos null, sino que lanzamos el error para que pueda ser manejado
    throw error;
  }
};

// Verificar si el usuario es administrador
export const isAdmin = async (request: Request) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No se encontró el encabezado de autorización o no es un token Bearer');
      return false;
    }

    const token = authHeader.split(' ')[1];
    console.log('Token recibido:', token.substring(0, 10) + '...');
    
    try {
      const decoded = verifyToken(token);
      console.log('Token verificado, userId:', decoded.userId, 'role:', decoded.role);
      
      // Primero verificar si el token incluye el rol
      if (decoded.role === 'ADMIN') {
        console.log('Usuario es administrador según el token');
        return true;
      }
      
      // Si el token no incluye el rol, verificar en la base de datos
      const user = findUserById(decoded.userId);
      if (!user) {
        console.log('Usuario no encontrado para el ID:', decoded.userId);
        return false;
      }
      
      const isAdminUser = user.role === 'ADMIN';
      console.log('¿Es administrador?:', isAdminUser, 'Rol del usuario:', user.role);
      return isAdminUser;
    } catch (error) {
      console.error('Error al verificar token en isAdmin:', error);
      // En lugar de devolver false, lanzamos el error para que pueda ser manejado
      throw error;
    }
  } catch (error) {
    console.error('Error en isAdmin:', error);
    // En lugar de devolver false, lanzamos el error para que pueda ser manejado
    throw error;
  }
};

// Generar un token JWT
export const generateToken = (userId: string, role: string) => {
  console.log('Generando token para usuario:', userId, 'con rol:', role);
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}; 