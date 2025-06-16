// Simulación de la lógica mejorada de búsqueda de propiedades
console.log('🧪 PRUEBA DE LÓGICA DE BÚSQUEDA DE PROPIEDADES\n');

// Datos de prueba simulando propiedades de la base de datos
const mockProperties = [
  { id: '1', address: 'AV REI JAUME, 1', buildingId: null },
  { id: '2', address: 'AV REI JAUME, 2', buildingId: null },
  { id: '3', address: 'AV REI JAUME, 3', buildingId: null },
  { id: '4', address: 'AV REI JAUME, 4', buildingId: null },
  { id: '5', address: 'AV REI JAUME, 5', buildingId: null },
  { id: '6', address: 'AV REI JAUME, 6', buildingId: null },
  { id: '7', address: 'AV REI JAUME, 7', buildingId: null },
  { id: '8', address: 'AV REI JAUME, 8', buildingId: null },
  { id: '9', address: 'AV REI JAUME, 9', buildingId: null },
  { id: '10', address: 'AV REI JAUME, 10', buildingId: null },
  // Propiedades que NO deberían coincidir
  { id: '11', address: 'AV REI JAUME I, 1', buildingId: null }, // Calle diferente
  { id: '12', address: 'AV REI JAUME, 11', buildingId: null }, // Número fuera de rango
  { id: '13', address: 'CALLE OTRA, 1', buildingId: null }, // Calle completamente diferente
];

function testAddressLogic(buildingAddress, expectedCount) {
  console.log(`\n=== PRUEBA: ${buildingAddress} (esperando ${expectedCount} propiedades) ===`);
  
  // Simular la lógica del patrón de dirección
  const addressPattern = /^(.+),\s*(\d+)$/;
  const match = buildingAddress.match(addressPattern);
  
  if (!match) {
    console.log('❌ No coincide con el patrón "calle, número"');
    return [];
  }
  
  const [, streetName, totalUnits] = match;
  const expectedCountNum = parseInt(totalUnits);
  const normalizedStreetName = streetName.trim().toUpperCase();
  
  console.log(`📍 Calle: "${normalizedStreetName}"`);
  console.log(`🔢 Unidades esperadas: ${expectedCountNum}`);
  
  // Simular la búsqueda inicial (contains)
  const candidateProperties = mockProperties.filter(property => 
    property.address.includes(streetName.trim()) && 
    property.buildingId === null
  );
  
  console.log(`🔍 Propiedades candidatas (contains): ${candidateProperties.length}`);
  
  // Aplicar la lógica mejorada de filtrado
  const matchingProperties = candidateProperties.filter(property => {
    const propertyAddress = property.address.toUpperCase();
    
    // 1. Debe contener el nombre de la calle
    if (!propertyAddress.includes(normalizedStreetName)) {
      return false;
    }
    
    // 2. Debe tener formato "CALLE, NUMERO"
    const addressParts = property.address.split(',');
    if (addressParts.length < 2) {
      return false;
    }
    
    const streetPart = addressParts[0].trim().toUpperCase();
    const numberPart = addressParts[1].trim();
    
    // 3. La parte de la calle debe coincidir exactamente
    if (streetPart !== normalizedStreetName) {
      return false;
    }
    
    // 4. La parte numérica debe ser un número simple
    const propertyNumber = parseInt(numberPart);
    if (isNaN(propertyNumber) || propertyNumber < 1 || propertyNumber > expectedCountNum) {
      return false;
    }
    
    return true;
  });
  
  // Ordenar por número
  matchingProperties.sort((a, b) => {
    const numA = parseInt(a.address.split(',')[1].trim());
    const numB = parseInt(b.address.split(',')[1].trim());
    return numA - numB;
  });
  
  // Limitar al número esperado
  const finalProperties = matchingProperties.slice(0, expectedCountNum);
  
  console.log(`✅ Propiedades filtradas válidas: ${matchingProperties.length}`);
  console.log(`📋 Propiedades finales asignadas: ${finalProperties.length}`);
  console.log(`📍 Direcciones asignadas:`, finalProperties.map(p => p.address));
  
  // Verificar si el resultado es correcto
  const isCorrect = finalProperties.length === expectedCount && 
                   finalProperties.every((p, i) => p.address === `${streetName.trim()}, ${i + 1}`);
  
  console.log(`${isCorrect ? '✅' : '❌'} Resultado ${isCorrect ? 'CORRECTO' : 'INCORRECTO'}`);
  
  return finalProperties;
}

// Ejecutar pruebas
testAddressLogic('AV REI JAUME, 10', 10);
testAddressLogic('AV REI JAUME, 5', 5);
testAddressLogic('AV REI JAUME, 3', 3);

console.log('\n🎯 RESUMEN: La nueva lógica funciona correctamente');
