// "use strict";
// var __importDefault = (this && this.__importDefault) || function (mod) {
//     return (mod && mod.__esModule) ? mod : { "default": mod };
// };
// Object.defineProperty(exports, "__esModule", { value: true });
// const client_1 = require("@prisma/client");
// const fs_1 = __importDefault(require("fs"));
// const path_1 = __importDefault(require("path"));
// const csv_parse_1 = require("csv-parse");
// const prisma = new client_1.PrismaClient();
// // You can adjust these values to optimize performance
// const BATCH_SIZE = 500; // Number of records to process in a single batch
// const LOG_FREQUENCY = 1000; // How often to log progress
// async function importProperties() {
//     var _a, _b;
//     console.time('Total import time');
//     try {
//         // 1. Limpiar la tabla Property
//         console.log('Limpiando tabla Property...');
//         await prisma.property.deleteMany({});
//         console.log('Tabla Property limpiada');
//         // 2. Importar en Property
//         const csvPath = path_1.default.join(process.cwd(), 'public', 'data', 'residencial_catastro_from_user_area_2965256 - Residencial.csv');
//         console.time('CSV parsing');
//         const fileContent = fs_1.default.readFileSync(csvPath, 'utf-8');
//         // Parsear el CSV de manera más eficiente
//         const records = await new Promise((resolve, reject) => {
//             (0, csv_parse_1.parse)(fileContent, {
//                 columns: true,
//                 skip_empty_lines: true,
//                 delimiter: ',',
//                 cast: true, // Enable automatic type casting
//             }, (err, records) => {
//                 if (err)
//                     reject(err);
//                 else
//                     resolve(records);
//             });
//         });
//         console.timeEnd('CSV parsing');
//         console.log(`Encontradas ${records.length} propiedades para importar`);
//         // 3. Procesar en lotes para mejor rendimiento
//         let imported = 0;
//         let skipped = 0;
//         const batchStartTime = Date.now();
//         // Preparar los datos para inserción en lotes
//         for (let i = 0; i < records.length; i += BATCH_SIZE) {
//             const batch = records.slice(i, i + BATCH_SIZE);
//             const batchData = [];
//             // Preparar los datos de cada propiedad
//             for (const record of batch) {
//                 try {
//                     // Construir el número completo
//                     const number = `${record.Numero}${record.Puerta ? `, ${record.Puerta}` : ''}`;
//                     // Crear la dirección completa
//                     const address = `${record['Tipo de vía']} ${record['Nombre de vía']}, ${number}`.trim();
//                     // Determinar el tipo de propiedad
//                     const propertyType = ((_b = (_a = record['Tipo']) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.includes('colectiva'))
//                         ? client_1.PropertyType.PISO
//                         : client_1.PropertyType.CASA;
//                     // Preparar los datos para esta propiedad
//                     batchData.push({
//                         address,
//                         population: 'Catarroja',
//                         ownerName: 'Catastro',
//                         ownerPhone: '',
//                         type: propertyType,
//                         metrosCuadrados: parseInt(record['Superficie construida']) || null,
//                         isLocated: false,
//                         latitude: null,
//                         longitude: null,
//                         status: 'SIN_EMPEZAR',
//                         action: 'IR_A_DIRECCION',
//                         hasSimpleNote: false,
//                         isOccupied: false,
//                         parking: false,
//                         ascensor: false,
//                         piscina: false,
//                     });
//                 }
//                 catch (error) {
//                     console.error(`Error al procesar propiedad ${record['Referencia Catastral']}:`, error);
//                     skipped++;
//                 }
//             }
//             // Crear propiedades en bloque usando createMany
//             if (batchData.length > 0) {
//                 console.time(`Batch ${i}-${i + batchData.length}`);
//                 try {
//                     const result = await prisma.property.createMany({
//                         data: batchData,
//                         skipDuplicates: true, // Opcional: omitir duplicados si hay alguna restricción única
//                     });
//                     imported += result.count;
//                     // Mostrar progreso periódicamente
//                     if (imported % LOG_FREQUENCY === 0 || i + BATCH_SIZE >= records.length) {
//                         const elapsedSeconds = (Date.now() - batchStartTime) / 1000;
//                         const rate = imported / elapsedSeconds;
//                         console.log(`Importadas ${imported}/${records.length} propiedades (${Math.round(imported / records.length * 100)}%)... ` +
//                             `Velocidad: ${Math.round(rate)} propiedades/segundo`);
//                     }
//                 }
//                 catch (error) {
//                     console.error(`Error al importar lote ${i}-${i + batchData.length}:`, error);
//                     skipped += batchData.length;
//                 }
//                 console.timeEnd(`Batch ${i}-${i + batchData.length}`);
//             }
//         }
//         // Calcular estadísticas finales
//         const totalTime = (Date.now() - batchStartTime) / 1000;
//         const rate = imported / totalTime;
//         console.log(`
// Importación completada:
// - Total propiedades procesadas: ${records.length}
// - Propiedades importadas: ${imported}
// - Propiedades omitidas: ${skipped}
// - Tiempo total: ${totalTime.toFixed(2)} segundos
// - Velocidad media: ${rate.toFixed(2)} propiedades/segundo
//     `);
//     }
//     catch (error) {
//         console.error('Error durante la importación:', error);
//     }
//     finally {
//         await prisma.$disconnect();
//         console.timeEnd('Total import time');
//     }
// }
// // Ejecutar la importación
// importProperties();
