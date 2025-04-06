// Script para crear un usuario administrador
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Define the path to the database file
const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

// Ensure the data directory exists
const ensureDataDir = () => {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Directorio de datos creado:', dataDir);
    }
    return true;
  } catch (error) {
    console.error('Error al crear el directorio de datos:', error);
    return false;
  }
};

// Get all users
const getUsers = () => {
  ensureDataDir();
  
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

// Save users
const saveUsers = (users) => {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
};

// Find a user by email
const findUserByEmail = (email) => {
  const users = getUsers();
  return users.find(user => user.email === email);
};

// Add a new user
const addUser = (user) => {
  const users = getUsers();
  const now = new Date().toISOString();
  const newUser = {
    ...user,
    createdAt: now,
    updatedAt: now
  };
  users.push(newUser);
  saveUsers(users);
  console.log('Usuario añadido a la base de datos:', newUser);
  return newUser;
};

async function createAdminUser(name, email, password) {
  try {
    // Verificar si el email ya existe
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      console.log('El correo electrónico ya está en uso');
      return;
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Guardar el usuario
    const savedUser = addUser(newUser);
    console.log('Usuario administrador creado con éxito:');
    console.log('ID:', savedUser.id);
    console.log('Nombre:', savedUser.name);
    console.log('Email:', savedUser.email);
    console.log('Rol:', savedUser.role);
  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
  }
}

// Obtener los argumentos de la línea de comandos
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Uso: node scripts/create-admin.js <nombre> <email> <contraseña>');
  process.exit(1);
}

const [name, email, password] = args;
createAdminUser(name, email, password); 