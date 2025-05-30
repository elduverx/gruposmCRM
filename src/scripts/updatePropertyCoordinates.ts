// import { PrismaClient } from '@prisma/client';
// import fetch from 'node-fetch';
// import { sleep } from '../utils/sleep';
// import * as dotenv from 'dotenv';

// // Cargar variables de entorno
// dotenv.config();

// const prisma = new PrismaClient();
// const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
// const BATCH_SIZE = 25; // Aumentado de 10 a 25 propiedades por lote
// const RATE_LIMIT_DELAY = 50; // Reducido de 100ms a 50ms

// if (!GOOGLE_MAPS_API_KEY) {
//   console.error('Error: GOOGLE_MAPS_API_KEY no está definida en el archivo .env');
//   process.exit(1);
// }

// function formatStreetName(streetName: string): string {
//   // Convertir a minúsculas para hacer la comparación más fácil
//   const lowerStreet = streetName.toLowerCase().trim();
  
//   // Caso especial para Joaquín Escrivá
//   if (lowerStreet.includes('joaquin esciba') || lowerStreet.includes('joaquin escriba')) {
//     return 'Calle Rector Joaquín Escrivá Peiró';
//   }

//   // Mapa de abreviaturas y sus expansiones
//   const abbreviations: { [key: string]: string } = {
//     'pz': 'plaza',
//     'pza': 'plaza',
//     'plz': 'plaza',
//     'cl': 'calle',
//     'c/': 'calle',
//     'c.': 'calle',
//     'rn': 'ronda',
//     'rda': 'ronda',
//     'av': 'avenida',
//     'avd': 'avenida',
//     'avda': 'avenida',
//     'ctra': 'carretera',
//     'ct': 'carretera',
//     'crta': 'carretera',
//     'ps': 'paseo',
//     'pº': 'paseo',
//     'paseo': 'paseo',
//     'pl': 'plaza',
//     'pl.': 'plaza',
//     'gr': 'grupo'
//   };

//   // Buscar y reemplazar abreviaturas al inicio de la calle
//   for (const [abbr, full] of Object.entries(abbreviations)) {
//     if (lowerStreet.startsWith(abbr + ' ') || lowerStreet.startsWith(abbr + '.')) {
//       return full + ' ' + streetName.substring(abbr.length).trim();
//     }
//   }

//   // Si no se encuentra ninguna abreviatura, asumir que es una calle
//   if (!lowerStreet.startsWith('calle ') && 
//       !lowerStreet.startsWith('plaza ') && 
//       !lowerStreet.startsWith('ronda ') &&
//       !lowerStreet.startsWith('avenida ') &&
//       !lowerStreet.startsWith('carretera ') &&
//       !lowerStreet.startsWith('paseo ') &&
//       !lowerStreet.startsWith('grupo ')) {
//     return 'calle ' + streetName;
//   }

//   return streetName;
// }

// async function getCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
//   try {
//     // Limpiar y formatear la dirección
//     const cleanAddress = address
//       .replace(/\s+/g, ' ')  // Reemplazar múltiples espacios con uno solo
//       .trim();               // Eliminar espacios al inicio y final
    
//     // Extraer el nombre de la calle y el número
//     const parts = cleanAddress.split(',');
//     if (parts.length < 2) {
//       console.log(`Formato de dirección inválido: ${cleanAddress}`);
//       return null;
//     }

//     // Obtener el nombre de la calle y el número
//     let streetName = parts[0].trim();
//     const streetNumber = parts[1].trim();
    
//     // Formatear el nombre de la calle
//     streetName = formatStreetName(streetName);
    
//     // Construir la dirección de búsqueda
//     const searchAddress = `${streetName} ${streetNumber}, Catarroja, Valencia, España`;
//     const encodedAddress = encodeURIComponent(searchAddress);
    
//     console.log(`Buscando coordenadas para: ${searchAddress}`);
    
//     // Hacer la petición a Google Maps Geocoding API
//     const response = await fetch(
//       `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}&region=es&components=country:ES|locality:Catarroja`,
//       {
//         headers: {
//           'User-Agent': 'GruposMCRM/1.0'
//         }
//       }
//     );
    
//     if (!response.ok) {
//       console.error(`Error al buscar coordenadas para ${searchAddress}: ${response.statusText}`);
//       return null;
//     }
    
//     const data = await response.json();
    
//     if (data.status === 'OK' && data.results && data.results.length > 0) {
//       const result = data.results[0];
//       console.log(`Coordenadas encontradas: ${result.formatted_address}`);
      
//       // Verificar que las coordenadas corresponden a Catarroja
//       if (result.formatted_address.toLowerCase().includes('catarroja')) {
//         return {
//           lat: result.geometry.location.lat,
//           lng: result.geometry.location.lng
//         };
//       }
//     }
    
//     // Si no se encuentra, intentar solo con el nombre de la calle
//     const streetSearch = `${streetName}, Catarroja, Valencia, España`;
//     const encodedStreetAddress = encodeURIComponent(streetSearch);
    
//     console.log(`Intentando búsqueda con calle: ${streetSearch}`);
    
//     const streetResponse = await fetch(
//       `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedStreetAddress}&key=${GOOGLE_MAPS_API_KEY}&region=es&components=country:ES|locality:Catarroja`,
//       {
//         headers: {
//           'User-Agent': 'GruposMCRM/1.0'
//         }
//       }
//     );
    
//     if (streetResponse.ok) {
//       const streetData = await streetResponse.json();
//       if (streetData.status === 'OK' && streetData.results && streetData.results.length > 0) {
//         const result = streetData.results[0];
//         console.log(`Coordenadas encontradas (búsqueda por calle): ${result.formatted_address}`);
        
//         // Verificar que las coordenadas corresponden a Catarroja
//         if (result.formatted_address.toLowerCase().includes('catarroja')) {
//           return {
//             lat: result.geometry.location.lat,
//             lng: result.geometry.location.lng
//           };
//         }
//       }
//     }
    
//     console.log(`No se encontraron coordenadas precisas para: ${searchAddress}`);
//     return null;
//   } catch (error) {
//     console.error(`Error al obtener coordenadas para ${address}:`, error);
//     return null;
//   }
// }

// async function updatePropertyCoordinates() {
//   try {
//     // Obtener todas las propiedades sin coordenadas
//     const properties = await prisma.property.findMany({
//       where: {
//         OR: [
//           { latitude: null },
//           { longitude: null }
//         ]
//       }
//     });
    
//     console.log(`Se encontraron ${properties.length} propiedades sin coordenadas en Catarroja`);
    
//     let successCount = 0;
//     let failCount = 0;
    
//     // Procesar propiedades en lotes más grandes
//     for (let i = 0; i < properties.length; i += BATCH_SIZE) {
//       const batch = properties.slice(i, i + BATCH_SIZE);
//       console.log(`\nProcesando lote ${Math.floor(i/BATCH_SIZE) + 1} de ${Math.ceil(properties.length/BATCH_SIZE)}`);
      
//       // Procesar el lote en paralelo con manejo de errores mejorado
//       const results = await Promise.allSettled(
//         batch.map(async (property) => {
//           try {
//             console.log(`Procesando propiedad: ${property.address}`);
//             const coordinates = await getCoordinates(property.address);
            
//             if (coordinates) {
//               await prisma.property.update({
//                 where: { id: property.id },
//                 data: {
//                   latitude: coordinates.lat,
//                   longitude: coordinates.lng
//                 }
//               });
              
//               console.log(`✅ Coordenadas actualizadas: ${coordinates.lat}, ${coordinates.lng}`);
//               return { success: true };
//             } else {
//               console.log(`❌ No se pudieron encontrar coordenadas`);
//               return { success: false };
//             }
//           } catch (error) {
//             console.error(`Error procesando propiedad ${property.address}:`, error);
//             return { success: false };
//           }
//         })
//       );
      
//       // Actualizar contadores considerando los resultados de Promise.allSettled
//       results.forEach(result => {
//         if (result.status === 'fulfilled' && result.value.success) {
//           successCount++;
//         } else {
//           failCount++;
//         }
//       });
      
//       // Esperar entre lotes para respetar el rate limit
//       if (i + BATCH_SIZE < properties.length) {
//         await sleep(RATE_LIMIT_DELAY);
//       }
      
//       // Mostrar progreso
//       console.log(`\nProgreso: ${i + batch.length}/${properties.length}`);
//       console.log(`Éxitos: ${successCount}, Fallos: ${failCount}`);
//     }
    
//     console.log('\n=== Resumen Final ===');
//     console.log(`Total de propiedades procesadas: ${properties.length}`);
//     console.log(`Coordenadas actualizadas con éxito: ${successCount}`);
//     console.log(`Propiedades sin coordenadas: ${failCount}`);
    
//   } catch (error) {
//     console.error('Error al actualizar coordenadas:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Ejecutar el script
// updatePropertyCoordinates(); 