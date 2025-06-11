const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSalesData() {
  try {
    console.log('🔍 Verificando datos para el módulo de ventas...\n');

    // 1. Verificar propiedades
    const totalProperties = await prisma.property.count();
    const soldProperties = await prisma.property.count({
      where: { isSold: true }
    });
    const availableProperties = totalProperties - soldProperties;

    console.log('📊 ESTADÍSTICAS DE PROPIEDADES:');
    console.log(`Total de propiedades: ${totalProperties}`);
    console.log(`Propiedades vendidas: ${soldProperties}`);
    console.log(`Propiedades disponibles: ${availableProperties}\n`);

    // 2. Verificar clientes
    const totalClients = await prisma.client.count();
    const clientsWithRequests = await prisma.client.count({
      where: { hasRequest: true }
    });

    console.log('👥 ESTADÍSTICAS DE CLIENTES:');
    console.log(`Total de clientes: ${totalClients}`);
    console.log(`Clientes con pedidos: ${clientsWithRequests}\n`);

    // 3. Verificar encargos
    const totalAssignments = await prisma.assignment.count();
    const assignmentsWithDetails = await prisma.assignment.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            hasRequest: true
          }
        },
        property: {
          select: {
            id: true,
            address: true,
            population: true,
            isSold: true
          }
        }
      },
      take: 5
    });

    console.log('📋 ESTADÍSTICAS DE ENCARGOS:');
    console.log(`Total de encargos: ${totalAssignments}`);
    
    if (assignmentsWithDetails.length > 0) {
      console.log('\n📝 MUESTRA DE ENCARGOS:');
      assignmentsWithDetails.forEach((assignment, index) => {
        console.log(`${index + 1}. Cliente: ${assignment.client?.name || 'Sin nombre'}`);
        console.log(`   Propiedad: ${assignment.property?.address || 'Sin dirección'}`);
        console.log(`   Propiedad vendida: ${assignment.property?.isSold ? 'Sí' : 'No'}`);
        console.log(`   Cliente con pedido: ${assignment.client?.hasRequest ? 'Sí' : 'No'}`);
        console.log(`   Tipo: ${assignment.type}`);
        console.log(`   Precio: €${assignment.price.toLocaleString()}\n`);
      });
    }

    // 4. Verificar encargos elegibles para ventas pendientes
    const eligibleAssignments = await prisma.assignment.count({
      where: {
        property: {
          isSold: false
        },
        client: {
          isNot: null
        }
      }
    });

    console.log('✅ ENCARGOS ELEGIBLES PARA FINALIZAR VENTAS:');
    console.log(`Encargos con propiedades no vendidas: ${eligibleAssignments}`);

    // 5. Crear datos de prueba si no existen
    if (totalClients === 0 || totalProperties === 0 || totalAssignments === 0) {
      console.log('\n🚀 CREANDO DATOS DE PRUEBA...\n');
      await createTestData();
    }

  } catch (error) {
    console.error('❌ Error al verificar datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestData() {
  try {
    // Crear cliente de prueba
    const testClient = await prisma.client.upsert({
      where: { email: 'juan.perez@test.com' },
      update: {},
      create: {
        name: 'Juan Pérez',
        email: 'juan.perez@test.com',
        phone: '+34 600 123 456',
        address: 'Calle Mayor 123, Valencia',
        hasRequest: true
      }
    });

    console.log('✅ Cliente de prueba creado:', testClient.name);

    // Crear propiedad de prueba
    const testProperty = await prisma.property.upsert({
      where: { 
        address_population: {
          address: 'Avenida del Puerto 45',
          population: 'Valencia'
        }
      },
      update: {},
      create: {
        address: 'Avenida del Puerto 45',
        population: 'Valencia',
        type: 'PISO',
        ownerName: 'María García',
        ownerPhone: '+34 600 654 321',
        status: 'SIN_EMPEZAR',
        action: 'IR_A_DIRECCION',
        isSold: false,
        isLocated: true,
        habitaciones: 3,
        banos: 2,
        metrosCuadrados: 95,
        parking: true,
        ascensor: true
      }
    });

    console.log('✅ Propiedad de prueba creada:', testProperty.address);

    // Crear encargo de prueba
    const testAssignment = await prisma.assignment.create({
      data: {
        type: 'SALE',
        price: 285000,
        exclusiveUntil: new Date('2025-12-31'),
        origin: 'Referencia',
        clientId: testClient.id,
        propertyId: testProperty.id,
        sellerFeeType: 'PERCENTAGE',
        sellerFeeValue: 8550, // 3% de 285,000
        buyerFeeType: 'PERCENTAGE',
        buyerFeeValue: 8550, // 3% de 285,000
        status: 'PENDING'
      }
    });

    console.log('✅ Encargo de prueba creado');

    // Crear segundo cliente sin pedido para comparar
    const testClient2 = await prisma.client.upsert({
      where: { email: 'ana.martinez@test.com' },
      update: {},
      create: {
        name: 'Ana Martínez',
        email: 'ana.martinez@test.com',
        phone: '+34 600 789 012',
        address: 'Plaza España 10, Valencia',
        hasRequest: false
      }
    });

    console.log('✅ Segundo cliente de prueba creado:', testClient2.name);

  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
  }
}

// Ejecutar el script
checkSalesData();
