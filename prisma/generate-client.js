const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Generando cliente de Prisma...');
try {
  // Ensure the prisma directory exists
  const prismaDir = path.join(process.cwd(), 'prisma');
  if (!fs.existsSync(prismaDir)) {
    console.log('Creando directorio prisma...');
    fs.mkdirSync(prismaDir, { recursive: true });
  }

  // Generate Prisma Client
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Cliente de Prisma generado correctamente.');
} catch (error) {
  console.error('Error al generar el cliente de Prisma:', error);
  process.exit(1);
} 