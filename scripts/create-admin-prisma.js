const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser(name, email, password) {
  try {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('El correo electrónico ya está en uso');
      return;
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('Usuario administrador creado con éxito:');
    console.log('ID:', newUser.id);
    console.log('Nombre:', newUser.name);
    console.log('Email:', newUser.email);
    console.log('Rol:', newUser.role);
  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener los argumentos de la línea de comandos
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Uso: node scripts/create-admin-prisma.js <nombre> <email> <contraseña>');
  process.exit(1);
}

const [name, email, password] = args;
createAdminUser(name, email, password); 