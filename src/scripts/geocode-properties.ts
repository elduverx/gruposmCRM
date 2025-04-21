import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

// Función para extraer dirección y número
function extractAddressParts(fullAddress: string): { street: string; number: string } {
  const parts = fullAddress.split(',').map(part => part.trim());
  return {
    street: parts[0],
    number: parts[1] || ''
  };
}

// Función para geocodificar
async function geocodeAddress(street: string, number: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Añadir Catarroja a la búsqueda para mejorar la precisión
    const searchAddress = `${street} ${number}, Catarroja`;
    console.log(`Buscando: ${searchAddress}`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`,
      {
        headers: {
          'User-Agent': 'CRM-Property-Import/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error(`Error en la respuesta: ${response.status}`);
      return null;
    }

    const data = await response.json() as NominatimResponse[];
    
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      
      // Ajustar el rango de coordenadas para Catarroja
      if (lat >= 39.35 && lat <= 39.45 && lng >= -0.45 && lng <= -0.35) {
        console.log(`Coordenadas encontradas: ${lat}, ${lng}`);
        return { lat, lng };
      } else {
        console.log(`Coordenadas fuera de rango: ${lat}, ${lng}`);
      }
    } else {
      console.log('No se encontraron resultados');
    }
    
    return null;
  } catch (error) {
    console.error('Error en geocodificación:', error);
    return null;
  }
}

async function updateCoordinates() {
  try {
    // Primero, verificar cuántas propiedades necesitan actualización
    const count = await prisma.property.count({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    });

    console.log(`Propiedades que necesitan actualización: ${count}`);

    if (count === 0) {
      console.log('No hay propiedades que necesiten actualización');
      return;
    }

    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: {
        id: true,
        address: true
      }
    });

    console.log(`Procesando ${properties.length} propiedades...`);
    let updated = 0;
    let failed = 0;

    for (const property of properties) {
      try {
        console.log(`\nProcesando propiedad ID: ${property.id}`);
        console.log(`Dirección: ${property.address}`);

        const { street, number } = extractAddressParts(property.address);
        console.log(`Calle: ${street}, Número: ${number}`);

        const coordinates = await geocodeAddress(street, number);

        if (coordinates) {
          console.log(`Actualizando propiedad ${property.id} con coordenadas: ${coordinates.lat}, ${coordinates.lng}`);
          
          const result = await prisma.property.update({
            where: { id: property.id },
            data: {
              latitude: coordinates.lat,
              longitude: coordinates.lng
            }
          });

          console.log(`Propiedad actualizada: ${result.id}`);
          updated++;
        } else {
          console.log(`No se pudieron obtener coordenadas para: ${property.address}`);
          failed++;
        }

        if ((updated + failed) % 5 === 0) {
          console.log(`\nProgreso: ${updated + failed}/${properties.length}`);
          console.log(`Actualizadas: ${updated}, Fallidas: ${failed}`);
        }
      } catch (error) {
        console.error(`Error procesando propiedad ${property.id}:`, error);
        failed++;
      }
    }

    console.log(`
\nFinalizado:
- Total propiedades: ${properties.length}
- Actualizadas: ${updated}
- Fallidas: ${failed}
    `);

  } catch (error) {
    console.error('Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
console.log('Iniciando actualización de coordenadas...');
updateCoordinates(); 