// @ts-nocheck
'use server';

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Custom error class for database operations
class DatabaseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

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
    }
    return true;
  } catch (error) {
    throw new DatabaseError('Error al crear el directorio de datos', error);
  }
};

// Initialize the database with a default admin user if it doesn't exist
export const initializeDb = async () => {
  try {
    if (!ensureDataDir()) {
      throw new DatabaseError('No se pudo crear el directorio de datos');
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
      }
    }
    
    return true;
  } catch (error) {
    throw new DatabaseError('Error al inicializar la base de datos', error);
  }
};

// Get all users
export const getUsers = (): User[] => {
  ensureDataDir();
  
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const users = JSON.parse(data) as User[];
    if (!Array.isArray(users)) {
      throw new DatabaseError('El archivo users.json no contiene un array');
    }
    return users;
  } catch (error) {
    throw new DatabaseError('Error al leer usuarios', error);
  }
};

// Save all users
export const saveUsers = (users: User[]) => {
  ensureDataDir();
  
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    throw new DatabaseError('Error al guardar usuarios', error);
  }
};

// Add a new user
export const addUser = (user: User) => {
  const users = getUsers();
  
  // Check if user with the same email already exists
  if (users.some(u => u.email === user.email)) {
    throw new DatabaseError('Ya existe un usuario con este email');
  }
  
  // Generate a new ID if not provided
  const newUser = {
    ...user,
    id: user.id || Date.now().toString(),
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  return newUser;
};

// Update a user
export const updateUser = (id: string, userData: Partial<User>) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new DatabaseError('Usuario no encontrado');
  }
  
  // Check if email is being changed and if it already exists
  if (userData.email && userData.email !== users[index].email) {
    if (users.some(u => u.email === userData.email && u.id !== id)) {
      throw new DatabaseError('Ya existe un usuario con este email');
    }
  }
  
  users[index] = {
    ...users[index],
    ...userData,
    updatedAt: new Date().toISOString()
  };
  
  saveUsers(users);
  
  return users[index];
};

// Delete a user
export const deleteUser = (id: string) => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== id);
  
  if (filteredUsers.length === users.length) {
    throw new DatabaseError('Usuario no encontrado');
  }
  
  saveUsers(filteredUsers);
  
  return true;
};

// Find a user by email
export const findUserByEmail = (email: string): User | undefined => {
  const users = getUsers();
  return users.find(u => u.email === email);
};

// Find a user by ID
export const findUserById = (id: string): User | undefined => {
  try {
    const users = getUsers();
    if (!Array.isArray(users)) {
      throw new DatabaseError('getUsers no devolvió un array');
    }
    return users.find(u => u.id === id);
  } catch (error) {
    throw new DatabaseError('Error al buscar usuario por ID', error);
  }
}; 