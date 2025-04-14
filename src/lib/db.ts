import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Define the User interface
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

// Define the path to the database file
const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

// Ensure the data directory exists
const ensureDataDir = () => {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      // eslint-disable-next-line no-console
      console.log('Directorio de datos creado:', dataDir);
    }
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al crear el directorio de datos:', error);
    return false;
  }
};

// Initialize the database with a default admin user if it doesn't exist
export const initializeDb = async () => {
  try {
    if (!ensureDataDir()) {
      throw new Error('No se pudo crear el directorio de datos');
    }
    
    if (!fs.existsSync(DB_PATH)) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const now = new Date().toISOString();
      const defaultUsers: User[] = [
        {
          id: '1',
          name: 'Admin',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'ADMIN',
          createdAt: now,
          updatedAt: now
        }
      ];
      
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultUsers, null, 2));
      // eslint-disable-next-line no-console
      console.log('Base de datos inicializada con usuario admin por defecto');
    } else {
      // Verificar y corregir usuarios existentes
      const users = getUsers();
      let needsUpdate = false;
      
      const updatedUsers = users.map(user => {
        if (!user.role || !user.createdAt || !user.updatedAt) {
          needsUpdate = true;
          return {
            ...user,
            role: user.role || 'USER',
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: user.updatedAt || new Date().toISOString()
          };
        }
        return user;
      });
      
      if (needsUpdate) {
        saveUsers(updatedUsers);
        // eslint-disable-next-line no-console
        console.log('Usuarios actualizados con campos faltantes');
      }
    }
    
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al inicializar la base de datos:', error);
    return false;
  }
};

// Get all users
export const getUsers = (): User[] => {
  ensureDataDir();
  
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return JSON.parse(data);
};

// Save users
export const saveUsers = (users: User[]) => {
  try {
    console.log(`Intentando guardar ${users.length} usuarios en ${DB_PATH}`);
    ensureDataDir();
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
    console.log('Usuarios guardados exitosamente');
    return true;
  } catch (error) {
    console.error('Error al guardar usuarios:', error);
    throw new Error(`Error al guardar usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Add a new user
export const addUser = (user: User) => {
  try {
    console.log('Iniciando proceso de añadir usuario:', user.email);
    const users = getUsers();
    console.log(`Usuarios actuales: ${users.length}`);
    
    const now = new Date().toISOString();
    const newUser = {
      ...user,
      createdAt: now,
      updatedAt: now
    };
    
    users.push(newUser);
    console.log('Usuario agregado a la lista, intentando guardar...');
    
    saveUsers(users);
    console.log('Usuario añadido exitosamente a la base de datos:', newUser.id);
    
    return newUser;
  } catch (error) {
    console.error('Error al añadir usuario:', error);
    throw new Error(`Error al añadir usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Update a user
export const updateUser = (id: string, userData: Partial<User>) => {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return null;
  }
  
  const updatedUser = {
    ...users[userIndex],
    ...userData,
    updatedAt: new Date().toISOString()
  };
  
  users[userIndex] = updatedUser;
  saveUsers(users);
  return updatedUser;
};

// Delete a user
export const deleteUser = (id: string) => {
  const users = getUsers();
  const filteredUsers = users.filter(user => user.id !== id);
  
  if (filteredUsers.length === users.length) {
    return false;
  }
  
  saveUsers(filteredUsers);
  return true;
};

// Find a user by email
export const findUserByEmail = (email: string): User | undefined => {
  const users = getUsers();
  return users.find(user => user.email === email);
};

// Find a user by ID
export const findUserById = (id: string): User | undefined => {
  const users = getUsers();
  return users.find(user => user.id === id);
}; 