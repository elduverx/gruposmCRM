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
    const skipped = 0;
    let imported = 0;

    for (const record of records) {
      try {
        // Crear la dirección completa
        const address = `${record['Tipo de vía']} ${record['Nombre de vía']}, ${record['Numero']}`.trim();
        
        // Determinar el tipo de propiedad
        let propertyType: PropertyType = PropertyType.CASA;
        if (record['Tipo'].toLowerCase().includes('colectiva')) {
          propertyType = PropertyType.PISO;
        }

        // Crear la propiedad
        await prisma.property.create({
          data: {
            address: address,
            population: 'Valencia', // Valor por defecto
            ownerName: 'Catastro', // Valor por defecto
            ownerPhone: '', // Valor por defecto
            type: propertyType,
            metrosCuadrados: parseInt(record['Superficie construida']) || null,
            isLocated: false,
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
          console.log(`Procesadas ${imported} propiedades...`);
        }
      } catch (error) {
        console.error(`Error al procesar propiedad ${record['Referencia Catastral']}:`, error);
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