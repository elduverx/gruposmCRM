'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Building, BuildingCreateInput, BuildingUpdateInput } from '@/types/building';

export async function getBuildings(): Promise<Building[]> {
  try {
    const buildings = await prisma.building.findMany({
      include: {
        complex: true,
        properties: {
          select: {
            id: true,
            address: true,
            population: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return buildings.map(building => ({
      id: building.id,
      name: building.name,
      address: building.address,
      population: building.population,
      description: building.description,
      totalFloors: building.totalFloors,
      totalUnits: building.totalUnits,
      complexId: building.complexId,
      createdAt: building.createdAt.toISOString(),
      updatedAt: building.updatedAt.toISOString(),
      complex: building.complex ? {
        id: building.complex.id,
        name: building.complex.name,
        address: building.complex.address,
        population: building.complex.population,
        description: building.complex.description,
        totalBuildings: building.complex.totalBuildings,
        createdAt: building.complex.createdAt.toISOString(),
        updatedAt: building.complex.updatedAt.toISOString(),
      } : null,
      properties: building.properties.map(property => ({
        id: property.id,
        address: property.address,
        population: property.population,
        type: property.type,
        status: '',
        action: 'IR_A_DIRECCION' as const,
        ownerName: '',
        ownerPhone: '',
        captureDate: '',
        responsibleId: null,
        hasSimpleNote: false,
        isOccupied: false,
        clientId: null,
        zoneId: null,
        createdAt: '',
        updatedAt: '',
        latitude: null,
        longitude: null,
        occupiedBy: null,
        occupiedByName: null,
        isLocated: false,
        responsible: null,
        activities: [],
        zone: null,
        assignments: [],
        dpv: null,
        clients: [],
        responsibleUser: null,
        habitaciones: null,
        banos: null,
        metrosCuadrados: null,
        parking: false,
        ascensor: false,
        piscina: false,
        basePropertyId: null,
        buildingId: null,
        isSold: false,
        price: '',
        description: '',
        yearBuilt: '',
        isFurnished: false,
        ownerEmail: '',
        tenantName: '',
        tenantPhone: '',
        tenantEmail: '',
        notes: '',
      })),
    }));
  } catch (error) {
    console.error('Error fetching buildings:', error);
    throw new Error('Error al obtener los edificios');
  }
}

export async function getBuildingById(id: string): Promise<Building | null> {
  try {
    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        complex: true,
        properties: {
          include: {
            zone: true,
            responsibleUser: true,
            activities: true,
          },
        },
      },
    });

    if (!building) return null;

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      population: building.population,
      description: building.description,
      totalFloors: building.totalFloors,
      totalUnits: building.totalUnits,
      complexId: building.complexId,
      createdAt: building.createdAt.toISOString(),
      updatedAt: building.updatedAt.toISOString(),
      complex: building.complex ? {
        id: building.complex.id,
        name: building.complex.name,
        address: building.complex.address,
        population: building.complex.population,
        description: building.complex.description,
        totalBuildings: building.complex.totalBuildings,
        createdAt: building.complex.createdAt.toISOString(),
        updatedAt: building.complex.updatedAt.toISOString(),
      } : null,
      properties: building.properties.map(property => ({
        id: property.id,
        address: property.address,
        population: property.population,
        type: property.type,
        status: property.status,
        action: property.action,
        ownerName: property.ownerName,
        ownerPhone: property.ownerPhone,
        captureDate: property.captureDate.toISOString(),
        responsibleId: property.responsibleId,
        hasSimpleNote: property.hasSimpleNote,
        isOccupied: property.isOccupied,
        clientId: property.clientId,
        zoneId: property.zoneId,
        createdAt: property.createdAt.toISOString(),
        updatedAt: property.updatedAt.toISOString(),
        latitude: property.latitude,
        longitude: property.longitude,
        occupiedBy: property.occupiedBy,
        occupiedByName: property.occupiedByName,
        isLocated: property.isLocated,
        responsible: property.responsible,
        activities: property.activities.map(activity => ({
          id: activity.id,
          type: activity.type,
          status: activity.status || '',
          date: activity.date.toISOString(),
          client: activity.client,
          notes: activity.notes,
          propertyId: activity.propertyId,
          createdAt: activity.createdAt.toISOString(),
          updatedAt: activity.updatedAt.toISOString(),
        })),
        zone: property.zone ? {
          id: property.zone.id,
          name: property.zone.name,
        } : null,
        assignments: [],
        dpv: null,
        clients: [],
        responsibleUser: property.responsibleUser ? {
          id: property.responsibleUser.id,
          name: property.responsibleUser.name,
          email: property.responsibleUser.email,
        } : null,
        habitaciones: property.habitaciones,
        banos: property.banos,
        metrosCuadrados: property.metrosCuadrados,
        parking: property.parking,
        ascensor: property.ascensor,
        piscina: property.piscina,
        basePropertyId: property.basePropertyId,
        buildingId: property.buildingId,
        isSold: property.isSold,
        price: '',
        description: '',
        yearBuilt: '',
        isFurnished: false,
        ownerEmail: '',
        tenantName: '',
        tenantPhone: '',
        tenantEmail: '',
        notes: '',
      })),
    };
  } catch (error) {
    console.error('Error fetching building:', error);
    throw new Error('Error al obtener el edificio');
  }
}

export async function createBuilding(data: BuildingCreateInput): Promise<Building> {
  console.log('🏗️ INICIANDO CREACIÓN DE EDIFICIO:', data);
  
  try {
    // Detectar diferentes patrones de dirección
    let matchingProperties: any[] = [];
    let logInfo = {
      streetName: '',
      buildingNumber: '',
      expectedCount: 0,
      candidatesFound: 0,
      validMatches: 0,
      finalAssigned: 0,
      pattern: ''
    };
    
    // Patrón 1: "CALLE, EDIFICIO" (buscar todas las unidades de ese edificio)
    const buildingPattern = /^(.+),\s*(\d+)$/;
    const buildingMatch = data.address.match(buildingPattern);
    
    // Patrón 2: "CALLE, NUMERO" (edificio simple con número de unidades)
    const simplePattern = /^(.+),\s*(\d+)$/;
    
    if (buildingMatch) {
      const [, streetName, buildingNumber] = buildingMatch;
      const normalizedStreetName = streetName.trim().toUpperCase();
      
      logInfo.streetName = normalizedStreetName;
      logInfo.buildingNumber = buildingNumber;
      logInfo.pattern = 'EDIFICIO_COMPLEJO';
      
      console.log(`🔍 ANÁLISIS DE DIRECCIÓN (EDIFICIO COMPLEJO):`);
      console.log(`   📍 Calle normalizada: "${normalizedStreetName}"`);
      console.log(`   🏢 Número de edificio: ${buildingNumber}`);
      
      // Buscar todas las propiedades de este edificio específico
      const candidateProperties = await prisma.property.findMany({
        where: {
          AND: [
            { buildingId: null }, // Solo propiedades sin edificio asignado
            { 
              address: { 
                startsWith: `${streetName.trim()}, ${buildingNumber},`
              } 
            }
          ]
        }
      });
      
      logInfo.candidatesFound = candidateProperties.length;
      console.log(`📋 CANDIDATOS PARA EDIFICIO ${buildingNumber}: ${candidateProperties.length} propiedades`);
      console.log(`   📝 Direcciones encontradas:`, candidateProperties.slice(0, 10).map(p => p.address));
      
      // Filtrar propiedades válidas para este edificio específico
      matchingProperties = candidateProperties.filter(property => {
        const addressParts = property.address.split(',').map(part => part.trim());
        
        // Debe tener formato: "CALLE, EDIFICIO, UNIDAD"
        if (addressParts.length !== 3) {
          console.log(`   ❌ "${property.address}" - No tiene formato "CALLE, EDIFICIO, UNIDAD"`);
          return false;
        }
        
        const streetPart = addressParts[0].trim().toUpperCase();
        const buildingPart = addressParts[1].trim();
        const unitPart = addressParts[2].trim();
        
        // La calle debe coincidir exactamente
        if (streetPart !== normalizedStreetName) {
          console.log(`   ❌ "${property.address}" - Calle "${streetPart}" no coincide con "${normalizedStreetName}"`);
          return false;
        }
        
        // El número de edificio debe coincidir exactamente
        if (buildingPart !== buildingNumber) {
          console.log(`   ❌ "${property.address}" - Edificio "${buildingPart}" no coincide con "${buildingNumber}"`);
          return false;
        }
        
        // La unidad debe ser un número válido
        const unitNumber = parseInt(unitPart);
        if (isNaN(unitNumber) || unitNumber < 1) {
          console.log(`   ❌ "${property.address}" - Unidad "${unitPart}" no es válida`);
          return false;
        }
        
        console.log(`   ✅ "${property.address}" - VÁLIDA (Edificio ${buildingNumber}, Unidad ${unitNumber})`);
        return true;
      });
      
      // Ordenar por número de unidad
      matchingProperties.sort((a, b) => {
        const unitA = parseInt(a.address.split(',')[2].trim());
        const unitB = parseInt(b.address.split(',')[2].trim());
        return unitA - unitB;
      });
      
      logInfo.validMatches = matchingProperties.length;
      logInfo.finalAssigned = matchingProperties.length;
      logInfo.expectedCount = matchingProperties.length; // Usar el número real de unidades encontradas
      
      console.log(`✅ FILTRADO COMPLETADO (EDIFICIO):`);
      console.log(`   🎯 PROPIEDADES válidas para edificio ${buildingNumber}: ${matchingProperties.length}`);
      console.log(`   📋 Propiedades a asignar:`, matchingProperties.map(p => {
        const unit = p.address.split(',')[2].trim();
        return `${p.address}`;
      }));
      
    } else {
      // Si no coincide con el patrón "calle, número", buscar de forma más conservadora
      const streetName = data.address.split(',')[0].trim();
      console.log(`🔍 BÚSQUEDA GENERAL para: "${streetName}" (sin patrón específico)`);
      
      matchingProperties = await prisma.property.findMany({
        where: {
          AND: [
            { address: { startsWith: streetName } },
            { buildingId: null }
          ]
        }
        // SIN LÍMITE - asignar todas las propiedades disponibles
      });
      
      console.log(`📋 Propiedades encontradas (búsqueda general): ${matchingProperties.length}`);
    }

    // Crear el edificio
    console.log(`🏗️ CREANDO EDIFICIO en la base de datos...`);
    const building = await prisma.building.create({
      data: {
        name: data.name,
        address: data.address,
        population: data.population,
        description: data.description,
        totalFloors: data.totalFloors,
        totalUnits: matchingProperties.length, // USAR SIEMPRE el número real de propiedades encontradas
        complexId: data.complexId,
      },
      include: {
        complex: true,
        properties: true,
      },
    });

    // Asignar automáticamente las propiedades encontradas al edificio
    if (matchingProperties.length > 0) {
      console.log(`🔗 ASIGNANDO ${matchingProperties.length} propiedades al edificio...`);
      await prisma.property.updateMany({
        where: {
          id: {
            in: matchingProperties.map(p => p.id)
          }
        },
        data: {
          buildingId: building.id
        }
      });
      console.log(`✅ ASIGNACIÓN COMPLETADA`);
    } else {
      console.log(`ℹ️ No se encontraron propiedades para asignar automáticamente`);
    }

    console.log(`🎉 EDIFICIO CREADO EXITOSAMENTE:`, {
      id: building.id,
      name: building.name,
      address: building.address,
      totalUnits: building.totalUnits,
      propertiesAssigned: matchingProperties.length,
      logInfo
    });

    revalidatePath('/dashboard/properties');
    revalidatePath('/dashboard/buildings');

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      population: building.population,
      description: building.description,
      totalFloors: building.totalFloors,
      totalUnits: building.totalUnits,
      complexId: building.complexId,
      createdAt: building.createdAt.toISOString(),
      updatedAt: building.updatedAt.toISOString(),
      complex: building.complex ? {
        id: building.complex.id,
        name: building.complex.name,
        address: building.complex.address,
        population: building.complex.population,
        description: building.complex.description,
        totalBuildings: building.complex.totalBuildings,
        createdAt: building.complex.createdAt.toISOString(),
        updatedAt: building.complex.updatedAt.toISOString(),
      } : null,
      properties: matchingProperties.map(property => ({
        id: property.id,
        address: property.address,
        population: property.population,
        type: property.type,
        status: '',
        action: 'IR_A_DIRECCION' as const,
        ownerName: '',
        ownerPhone: '',
        captureDate: '',
        responsibleId: null,
        hasSimpleNote: false,
        isOccupied: false,
        clientId: null,
        zoneId: null,
        createdAt: '',
        updatedAt: '',
        latitude: null,
        longitude: null,
        occupiedBy: null,
        occupiedByName: null,
        isLocated: false,
        responsible: null,
        activities: [],
        zone: null,
        assignments: [],
        clients: [],
        dpv: null,
        responsibleUser: null,
        habitaciones: null,
        banos: null,
        metrosCuadrados: null,
        parking: false,
        ascensor: false,
        piscina: false,
        basePropertyId: null,
        buildingId: building.id,
        isSold: false,
        price: '',
        description: '',
        yearBuilt: '',
        isFurnished: false,
        ownerEmail: '',
        tenantName: '',
        tenantPhone: '',
        tenantEmail: '',
        notes: '',
      })),
    };
  } catch (error) {
    console.error('Error creating building:', error);
    throw new Error('Error al crear el edificio');
  }
}

export async function updateBuilding(id: string, data: BuildingUpdateInput): Promise<Building> {
  try {
    const building = await prisma.building.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address && { address: data.address }),
        ...(data.population && { population: data.population }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.totalFloors !== undefined && { totalFloors: data.totalFloors }),
        ...(data.totalUnits !== undefined && { totalUnits: data.totalUnits }),
        ...(data.complexId !== undefined && { complexId: data.complexId }),
      },
      include: {
        complex: true,
        properties: true,
      },
    });

    revalidatePath('/dashboard/properties');

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      population: building.population,
      description: building.description,
      totalFloors: building.totalFloors,
      totalUnits: building.totalUnits,
      complexId: building.complexId,
      createdAt: building.createdAt.toISOString(),
      updatedAt: building.updatedAt.toISOString(),
      complex: building.complex ? {
        id: building.complex.id,
        name: building.complex.name,
        address: building.complex.address,
        population: building.complex.population,
        description: building.complex.description,
        totalBuildings: building.complex.totalBuildings,
        createdAt: building.complex.createdAt.toISOString(),
        updatedAt: building.complex.updatedAt.toISOString(),
      } : null,
      properties: [],
    };
  } catch (error) {
    console.error('Error updating building:', error);
    throw new Error('Error al actualizar el edificio');
  }
}

export async function deleteBuilding(id: string): Promise<void> {
  try {
    await prisma.building.delete({
      where: { id },
    });

    revalidatePath('/dashboard/properties');
  } catch (error) {
    console.error('Error deleting building:', error);
    throw new Error('Error al eliminar el edificio');
  }
}

export async function assignPropertyToBuilding(propertyId: string, buildingId: string): Promise<void> {
  try {
    await prisma.property.update({
      where: { id: propertyId },
      data: { buildingId },
    });

    revalidatePath('/dashboard/properties');
  } catch (error) {
    console.error('Error assigning property to building:', error);
    throw new Error('Error al asignar la propiedad al edificio');
  }
}

export async function removePropertyFromBuilding(propertyId: string): Promise<void> {
  try {
    await prisma.property.update({
      where: { id: propertyId },
      data: { buildingId: null },
    });

    revalidatePath('/dashboard/properties');
  } catch (error) {
    console.error('Error removing property from building:', error);
    throw new Error('Error al remover la propiedad del edificio');
  }
}
