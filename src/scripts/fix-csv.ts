import fs from 'fs';
import path from 'path';

async function fixCsvFile() {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'data', 'residencial_catastro_from_user_area_2965256 - Residencial.csv');
    
    // Leer el archivo
    let content = fs.readFileSync(csvPath, 'utf8');
    
    // Reemplazar el texto manteniendo solo los números
    content = content.replace(/translation missing: es\.catastro\.reforms\.(\d+)/g, '$1');
    
    // Guardar el archivo modificado
    fs.writeFileSync(csvPath, content, 'utf8');
  } catch (error) {
    throw new Error(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Ejecutar la función
fixCsvFile().catch(error => {
  process.exitCode = 1;
  throw error;
}); 