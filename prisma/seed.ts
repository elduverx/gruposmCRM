import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Verificar si ya existe un usuario administrador
  const adminExists = await prisma.user.findUnique({
    where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
  });

  if (!adminExists) {
    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'admin123',
      10
    );

    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: hashedPassword,
        role: Role.ADMIN,
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