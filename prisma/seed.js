const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Verificar si ya existe un usuario administrador
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminExists = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminExists) {
    // Crear usuario administrador
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'admin123',
      10
    );

    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('Usuario administrador creado');
  } else {
    console.log('El usuario administrador ya existe');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 