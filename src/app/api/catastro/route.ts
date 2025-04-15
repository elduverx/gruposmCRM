import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { CatastroProperty } from '@/types/property';

// Helper function to convert address to approximate coordinates
// In a real implementation, this would use a geocoding service
function getApproximateCoordinates(address: string) {
  // This is a simplified version that returns random coordinates near Catarroja
  // Center coordinates for Catarroja
  const centerLat = 39.4;
  const centerLng = -0.4;
  
  // Add some randomness (within ~1km)
  const lat = centerLat + (Math.random() - 0.5) * 0.02;
  const lng = centerLng + (Math.random() - 0.5) * 0.02;
  
  return { lat, lng };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se ha proporcionado ningún archivo' }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const content = buffer.toString();
    
    // Parse CSV content
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ',', // Adjust based on your CSV format
    });
    
    // Process and transform the records to the required format
    const processedRecords = records.map((record: any): CatastroProperty => {
      // Construct address from the CSV fields
      const address = `${record['Tipo de vía'] || ''} ${record['Nombre de vía'] || ''}, ${record['Numero'] || ''}`;
      
      // Get coordinates (simulated in this example)
      const { lat, lng } = getApproximateCoordinates(address);
      
      return {
        reference: record['Referencia Catastral'] || '',
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
        lat,
        lng,
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Se han procesado ${processedRecords.length} registros del catastro`,
      data: processedRecords 
    });
  } catch (error) {
    console.error('Error processing CSV file:', error);
    return NextResponse.json({ 
      error: 'Error al procesar el archivo CSV', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

// GET method to provide data from the CSV file
export async function GET() {
  try {
    // Intenta diferentes rutas para encontrar el archivo CSV
    let csvFilePath = '';
    const possiblePaths = [
      path.join(process.cwd(), 'src/app/dashboard/catarroja/residencial_catastro_from_user_area_2965256 - Residencial.csv'),
      path.join(process.cwd(), 'public/data/residencial_catastro_from_user_area_2965256 - Residencial.csv'),
      './public/data/residencial_catastro_from_user_area_2965256 - Residencial.csv',
      './src/app/dashboard/catarroja/residencial_catastro_from_user_area_2965256 - Residencial.csv'
    ];
    
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          csvFilePath = p;
          console.log(`CSV file found at: ${csvFilePath}`);
          break;
        }
      } catch (e) {
        console.log(`Path not found: ${p}`);
      }
    }
    
    if (!csvFilePath) {
      // Como última opción, intentar cargar el CSV desde una URL pública
      try {
        console.log("Attempting to fetch CSV from public URL");
        const response = await fetch('/data/residencial_catastro_from_user_area_2965256 - Residencial.csv');
        if (response.ok) {
          const text = await response.text();
          console.log(`Successfully fetched CSV (${text.length} chars)`);
          
          // Parse content directly without saving to file
          const records = parse(text, {
            columns: true,
            skip_empty_lines: true,
            delimiter: ',',
            to: Infinity,
            relaxColumnCount: true,
            relaxQuotes: true,
            trim: true
          });
          
          console.log(`Found ${records.length} records in fetched CSV`);
          
          // Process records
          const processedRecords: CatastroProperty[] = [];
          for (let i = 0; i < records.length; i++) {
            const record = records[i];
            try {
              if (!record['Referencia Catastral']) continue;
              
              const address = `${record['Tipo de vía'] || ''} ${record['Nombre de vía'] || ''}, ${record['Numero'] || ''}`;
              const { lat, lng } = getApproximateCoordinates(address);
              
              processedRecords.push({
                reference: record['Referencia Catastral'] || '',
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
                lat,
                lng,
              });
            } catch (e) {
              console.log(`Error processing record ${i}:`, e);
            }
          }
          
          console.log(`Processed ${processedRecords.length} cadastral records from URL fetch`);
          
          return NextResponse.json({ 
            success: true,
            message: `Se han cargado ${processedRecords.length} registros del catastro (URL)`,
            data: processedRecords
          });
        }
      } catch (fetchError) {
        console.error("Error fetching CSV from public URL:", fetchError);
      }
      
      throw new Error('No se pudo encontrar el archivo CSV');
    }
    
    console.log(`Reading CSV file from: ${csvFilePath}`);
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    console.log(`File content length: ${fileContent.length} characters`);
    
    // Parse CSV content with no limits on records
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ',', // CSV format
      to: Infinity,
      relaxColumnCount: true, // Allow inconsistent column counts
      relaxQuotes: true, // Be more forgiving with quotes
      trim: true // Trim whitespace
    });
    
    console.log(`Found ${records.length} records in the CSV file`);
    
    // Process all records without limiting
    const processedRecords: CatastroProperty[] = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Check if record has the required fields
        if (!record['Referencia Catastral']) {
          console.log(`Skipping record ${i} - missing reference`);
          continue;
        }
        
        // Construct address from the CSV fields
        const address = `${record['Tipo de vía'] || ''} ${record['Nombre de vía'] || ''}, ${record['Numero'] || ''}`;
        
        // Get coordinates (simulated in this example)
        const { lat, lng } = getApproximateCoordinates(address);
        
        processedRecords.push({
          reference: record['Referencia Catastral'] || '',
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
          lat,
          lng,
        });
      } catch (e) {
        console.log(`Error processing record ${i}:`, e);
      }
    }
    
    console.log(`Processed ${processedRecords.length} cadastral records successfully`);
    
    return NextResponse.json({ 
      success: true,
      message: `Se han cargado ${processedRecords.length} registros del catastro`,
      data: processedRecords
    });
  } catch (error) {
    console.error('Error reading or processing CSV file:', error);
    
    // Return sample data as fallback
    return NextResponse.json({ 
      success: false,
      message: 'Error al cargar datos del catastro: ' + (error as Error).message,
      data: []
    });
  }
} 