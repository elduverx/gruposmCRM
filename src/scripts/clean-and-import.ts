import { PrismaClient, PropertyType } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

const prisma = new PrismaClient();

interface CsvProperty {
  'Referencia Catastral': string;
  'Tipo de vía': string;
  'Nombre de vía': string;
  'Numero': string;
  'Bloque': string;
  'Escalera': string;
  'Planta': string;
  'Puerta': string;
  'Tipo reforma': string;
  'Antiguedad': string;
  'Calidad': string;
  'Superficie construida': string;
  'Tipo': string;
}

async function importProperties() {
  try {
    // 1. Limpiar la tabla Property
    console.log('Limpiando tabla Property...');
    await prisma.property.deleteMany({});
    console.log('Tabla Property limpiada');

    // 2. Importar en Property
    const csvPath = path.join(process.cwd(), 'public', 'data', 'residencial_catastro_from_user_area_2965256 - Residencial.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    // Parsear el CSV
    const records: CsvProperty[] = await new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });

    console.log(`Encontradas ${records.length} propiedades para importar`);

    // Procesar cada registro
    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      try {
        // Construir el número completo
        const number = `${record.Numero}${record.Puerta ? `, ${record.Puerta}` : ''}`;
        
        // Crear la dirección completa
        const address = `${record['Tipo de vía']} ${record['Nombre de vía']}, ${number}`.trim();
        
        // Determinar el tipo de propiedad
        let propertyType: PropertyType = PropertyType.CASA;
        if (record['Tipo'].toLowerCase().includes('colectiva')) {
          propertyType = PropertyType.PISO;
        }

        // Crear la propiedad
        await prisma.property.create({
          data: {
            address: address,
            population: 'Catarroja',
            ownerName: 'Catastro', // Valor por defecto
            ownerPhone: '', // Valor por defecto
            type: propertyType,
            metrosCuadrados: parseInt(record['Superficie construida']) || null,
            isLocated: false, // Inicialmente false, se actualizará con el script de geocodificación
            latitude: null, // Se actualizará con el script de geocodificación
            longitude: null, // Se actualizará con el script de geocodificación
            // Otros campos requeridos con valores por defecto
            status: 'SALE',
            action: 'IR_A_DIRECCION',
            hasSimpleNote: false,
            isOccupied: false,
            parking: false,
            ascensor: false,
            piscina: false,
          }
        });

        imported++;

        // Mostrar progreso cada 100 propiedades
        if (imported % 100 === 0) {
          console.log(`Importadas ${imported} propiedades...`);
        }
      } catch (error) {
        console.error(`Error al procesar propiedad ${record['Referencia Catastral']}:`, error);
        skipped++;
      }
    }

    console.log(`
Importación completada:
- Total propiedades procesadas: ${records.length}
- Propiedades importadas: ${imported}
- Propiedades omitidas: ${skipped}
    `);

  } catch (error) {
    console.error('Error durante la importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la importación
importProperties(); 