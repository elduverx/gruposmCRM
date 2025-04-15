import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

// Helper function to convert address to approximate coordinates
// In a real implementation, this would use a geocoding service
function getApproximateCoordinates(address: string) {
  // Center coordinates for Catarroja
  const centerLat = 39.4;
  const centerLng = -0.4;
  
  // Add some randomness (within ~1km)
  const lat = centerLat + (Math.random() - 0.5) * 0.02;
  const lng = centerLng + (Math.random() - 0.5) * 0.02;
  
  return { lat, lng };
}

// Function to find the CSV file
async function findCsvFile() {
  const possiblePaths = [
    path.join(process.cwd(), 'src/app/dashboard/catarroja/residencial_catastro_from_user_area_2965256 - Residencial.csv'),
    path.join(process.cwd(), 'public/data/residencial_catastro_from_user_area_2965256 - Residencial.csv'),
    './public/data/residencial_catastro_from_user_area_2965256 - Residencial.csv',
    './src/app/dashboard/catarroja/residencial_catastro_from_user_area_2965256 - Residencial.csv'
  ];
  
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch (e) {
      console.log(`Path not found: ${p}`);
    }
  }
  
  return null;
}

// POST endpoint to import data from CSV to database
export async function POST(request: NextRequest) {
  try {
    // Find the CSV file
    const csvFilePath = await findCsvFile();
    
    if (!csvFilePath) {
      return NextResponse.json({ 
        success: false, 
        message: 'No se pudo encontrar el archivo CSV' 
      }, { status: 404 });
    }
    
    console.log(`Reading CSV file from: ${csvFilePath}`);
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse CSV content
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ',',
      relaxColumnCount: true,
      relaxQuotes: true,
      trim: true
    });
    
    console.log(`Found ${records.length} records in the CSV file`);
    
    // Prepare data for batch import
    let successCount = 0;
    let errorCount = 0;
    
    // Process records in batches to avoid memory issues
    const batchSize = 100;
    const totalBatches = Math.ceil(records.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min((i + 1) * batchSize, records.length);
      const batch = records.slice(start, end);
      
      // Process each record in the batch
      const createPromises = batch.map(async (record: any) => {
        try {
          // Skip if no reference
          if (!record['Referencia Catastral']) {
            errorCount++;
            return null;
          }
          
          // Construct address
          const address = `${record['Tipo de vía'] || ''} ${record['Nombre de vía'] || ''}, ${record['Numero'] || ''}`;
          
          // Get coordinates
          const { lat, lng } = getApproximateCoordinates(address);
          
          // Create or update the record in the database
          await prisma.catastroProperty.upsert({
            where: { reference: record['Referencia Catastral'] },
            update: {
              streetType: record['Tipo de vía'] || '',
              streetName: record['Nombre de vía'] || '',
              number: record['Numero'] || '',
              block: record['Bloque'] || '',
              stairway: record['Escalera'] || '',
              floor: record['Planta'] || '',
              door: record['Puerta'] || '',
              reformType: record['Tipo reforma'] || '',
              age: record['Antiguedad'] || '',
              quality: record['Calidad'] || '',
              constructedArea: record['Superficie construida'] || '',
              propertyType: record['Tipo'] || '',
              address,
              latitude: lat,
              longitude: lng,
              updatedAt: new Date()
            },
            create: {
              reference: record['Referencia Catastral'],
              streetType: record['Tipo de vía'] || '',
              streetName: record['Nombre de vía'] || '',
              number: record['Numero'] || '',
              block: record['Bloque'] || '',
              stairway: record['Escalera'] || '',
              floor: record['Planta'] || '',
              door: record['Puerta'] || '',
              reformType: record['Tipo reforma'] || '',
              age: record['Antiguedad'] || '',
              quality: record['Calidad'] || '',
              constructedArea: record['Superficie construida'] || '',
              propertyType: record['Tipo'] || '',
              address,
              latitude: lat,
              longitude: lng
            }
          });
          
          successCount++;
        } catch (error) {
          console.error(`Error processing record: ${record['Referencia Catastral']}`, error);
          errorCount++;
          return null;
        }
      });
      
      // Wait for all promises in the batch to complete
      await Promise.all(createPromises);
      
      console.log(`Processed batch ${i + 1}/${totalBatches}`);
    }
    
    // Get the count of records in the database
    const totalRecords = await prisma.catastroProperty.count();
    
    return NextResponse.json({
      success: true,
      message: `Importación finalizada. ${successCount} registros importados correctamente, ${errorCount} errores.`,
      totalRecords
    });
  } catch (error) {
    console.error('Error importing cadastral data:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al importar datos del catastro', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

// GET endpoint to get count of catastro properties in database
export async function GET() {
  try {
    const count = await prisma.catastroProperty.count();
    
    return NextResponse.json({
      success: true,
      count,
      message: `Hay ${count} registros del catastro en la base de datos`
    });
  } catch (error) {
    console.error('Error getting catastro count:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al obtener el conteo de propiedades del catastro', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 