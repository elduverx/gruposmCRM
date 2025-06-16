const { PrismaClient } = require('@prisma/client');

async function testModels() {
  const prisma = new PrismaClient();
  
  console.log('Testing Prisma client...');
  console.log('Has building model:', 'building' in prisma);
  console.log('Has property model:', 'property' in prisma);
  console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));
  
  await prisma.$disconnect();
}

testModels().catch(console.error);
