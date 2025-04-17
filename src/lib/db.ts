// @ts-nocheck
'use server';

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
  
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data) as User[];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al leer usuarios:', error);
    return [];
  }
};

// Save all users
export const saveUsers = (users: User[]) => {
  ensureDataDir();
  
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al guardar usuarios:', error);
    return false;
  }
};

// Add a new user
export const addUser = (user: User) => {
  const users = getUsers();
  
  // Check if user with the same email already exists
  if (users.some(u => u.email === user.email)) {
    throw new Error('Ya existe un usuario con este email');
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
    throw new Error('Usuario no encontrado');
  }
  
  // Check if email is being changed and if it already exists
  if (userData.email && userData.email !== users[index].email) {
    if (users.some(u => u.email === userData.email && u.id !== id)) {
      throw new Error('Ya existe un usuario con este email');
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
    throw new Error('Usuario no encontrado');
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
  const users = getUsers();
  return users.find(u => u.id === id);
}; 