const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Asegurarse de que el directorio node_modules/@prisma/client existe
const prismaClientDir = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
if (!fs.existsSync(prismaClientDir)) {
  console.log('Creando directorio para @prisma/client...');
  fs.mkdirSync(prismaClientDir, { recursive: true });
}

// Ejecutar prisma generate
console.log('Generando cliente de Prisma...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Cliente de Prisma generado correctamente.');
} catch (error) {
  console.error('Error al generar el cliente de Prisma:', error);
  process.exit(1);
} 