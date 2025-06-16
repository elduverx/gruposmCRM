const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBuilding() {
  try {
    console.log('Testing Prisma Building model...');
    
    // Intentar obtener todos los buildings
    const buildings = await prisma.building.findMany();
    console.log('Buildings found:', buildings.length);
    
    // Intentar obtener propiedades con buildingId
    const properties = await prisma.property.findMany({
      where: {
        buildingId: null
      },
      take: 5
    });
    console.log('Properties without building:', properties.length);
    
    console.log('✅ Prisma Building model works correctly!');
  } catch (error) {
    console.error('❌ Error testing Prisma:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBuilding();
