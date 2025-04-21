import { PrismaClient } from '@prisma/client';
import { isPointInPolygon } from '@/utils/zoneUtils';

const prisma = new PrismaClient();

async function updatePropertiesZones() {
  try {
    console.log('Iniciando actualización de propiedades en zonas...');
    
    // Obtener todas las zonas
    const zones = await prisma.zone.findMany();
    console.log(`Se encontraron ${zones.length} zonas`);
    
    // Obtener todas las propiedades con coordenadas
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      }
    });
    console.log(`Se encontraron ${properties.length} propiedades con coordenadas`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Para cada propiedad, verificar si está dentro de alguna zona
    for (const property of properties) {
      if (!property.latitude || !property.longitude) {
        skippedCount++;
        continue;
      }
      
      const point = { lat: property.latitude, lng: property.longitude };
      let foundZone = false;
      
      // Verificar cada zona
      for (const zone of zones) {
        // Convertir las coordenadas de la zona a un formato que pueda usar isPointInPolygon
        const zoneCoordinates = JSON.parse(zone.coordinates as string);
        const formattedCoordinates = zoneCoordinates.map((coord: any) => ({
          lat: coord.lat,
          lng: coord.lng
        }));
        
        // Verificar si la propiedad está dentro de la zona
        if (isPointInPolygon(point, formattedCoordinates)) {
          // Actualizar la propiedad con el ID de la zona
          await prisma.property.update({
            where: { id: property.id },
            data: { zoneId: zone.id }
          });
          
          console.log(`Propiedad ${property.id} (${property.address}) asignada a zona ${zone.name}`);
          updatedCount++;
          foundZone = true;
          break; // Salir del bucle de zonas una vez que se encuentra una coincidencia
        }
      }
      
      // Si la propiedad no está en ninguna zona y tiene una zona asignada, eliminar la asignación
      if (!foundZone && property.zoneId) {
        await prisma.property.update({
          where: { id: property.id },
          data: { zoneId: null }
        });
        
        console.log(`Propiedad ${property.id} (${property.address}) eliminada de zona ${property.zoneId}`);
        updatedCount++;
      }
    }
    
    console.log(`Actualización completada: ${updatedCount} propiedades actualizadas, ${skippedCount} omitidas`);
    
  } catch (error) {
    console.error('Error al actualizar propiedades en zonas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
updatePropertiesZones()
  .then(() => console.log('Proceso completado'))
  .catch(error => console.error('Error en el proceso:', error)); 