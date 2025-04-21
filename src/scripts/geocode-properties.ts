import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para geocodificar una dirección
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Añadir un delay aleatorio entre 1 y 2 segundos para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', 46470 Catarroja, Valencia, España')}&limit=1`,
      {
        headers: {
          'User-Agent': 'CRM-Property-Import/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error(`Error en la respuesta de Nominatim: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      
      // Verificar que las coordenadas están dentro de un rango razonable para Catarroja
      if (lat >= 39.38 && lat <= 39.42 && lng >= -0.41 && lng <= -0.39) {
        return { lat, lng };
      } else {
        console.log(`Coordenadas fuera de rango para ${address}: ${lat}, ${lng}`);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error geocodificando dirección:', error);
    return null;
  }
}

async function geocodeProperties() {
  try {
    // Obtener propiedades sin coordenadas
    const properties = await prisma.property.findMany({
      where: {
        isLocated: false,
        latitude: null,
        longitude: null
      },
      select: {
        id: true,
        address: true
      }
    });

    console.log(`Encontradas ${properties.length} propiedades para geocodificar`);

    let geocoded = 0;
    let failed = 0;

    // Procesar propiedades en lotes de 100
    const batchSize = 100;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      
      for (const property of batch) {
        try {
          const coordinates = await geocodeAddress(property.address);
          
          if (coordinates) {
            await prisma.property.update({
              where: { id: property.id },
              data: {
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                isLocated: true
              }
            });
            geocoded++;
          } else {
            failed++;
          }

          // Mostrar progreso cada 10 propiedades
          if ((geocoded + failed) % 10 === 0) {
            console.log(`Procesadas ${geocoded + failed} propiedades... (${geocoded} geocodificadas)`);
          }
        } catch (error) {
          console.error(`Error al geocodificar propiedad ${property.id}:`, error);
          failed++;
        }
      }

      // Pausa entre lotes para evitar sobrecarga
      if (i + batchSize < properties.length) {
        console.log('Pausa de 5 segundos entre lotes...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log(`
Geocodificación completada:
- Total propiedades procesadas: ${properties.length}
- Propiedades geocodificadas: ${geocoded}
- Propiedades fallidas: ${failed}
    `);

  } catch (error) {
    console.error('Error durante la geocodificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la geocodificación
geocodeProperties(); 