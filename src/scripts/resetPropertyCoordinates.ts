// import { PrismaClient } from '@prisma/client';
// import * as dotenv from 'dotenv';

// // Cargar variables de entorno
// dotenv.config();

// const prisma = new PrismaClient();

// async function resetPropertyCoordinates() {
//   try {
//     console.log('Iniciando reinicio de coordenadas...');
    
//     // Actualizar todas las propiedades para establecer lat y lng como null
//     const result = await prisma.property.updateMany({
//       data: {
//         latitude: null,
//         longitude: null
//       }
//     });
    
//     console.log(`✅ Coordenadas reiniciadas para ${result.count} propiedades`);
    
//   } catch (error) {
//     console.error('Error al reiniciar coordenadas:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Ejecutar el script
// resetPropertyCoordinates(); 