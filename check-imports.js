const fs = require('fs');
const path = require('path');

// Verificar archivos críticos
const filesToCheck = [
  'src/components/ClientForm.tsx',
  'src/components/common/SearchBar.tsx',
  'src/context/AuthContext.tsx'
];

console.log('Verificando archivos críticos...');

let allFilesExist = true;

filesToCheck.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const exists = fs.existsSync(fullPath);
  
  console.log(`${file}: ${exists ? 'EXISTE ✓' : 'FALTA ✗'}`);
  
  if (!exists) {
    allFilesExist = false;
  }
});

// Verificar configuración
console.log('\nVerificando configuración...');
const tsconfigExists = fs.existsSync(path.join(process.cwd(), 'tsconfig.json'));
console.log(`tsconfig.json: ${tsconfigExists ? 'EXISTE ✓' : 'FALTA ✗'}`);

const jsconfigExists = fs.existsSync(path.join(process.cwd(), 'jsconfig.json'));
console.log(`jsconfig.json: ${jsconfigExists ? 'EXISTE ✓' : 'FALTA ✗'}`);

const nextconfigExists = fs.existsSync(path.join(process.cwd(), 'next.config.js'));
console.log(`next.config.js: ${nextconfigExists ? 'EXISTE ✓' : 'FALTA ✗'}`);

console.log('\nEstado general:');
console.log(allFilesExist && tsconfigExists && (jsconfigExists || nextconfigExists) 
  ? 'Todo parece estar en orden. Si los problemas persisten, intenta ejecutar: npm cache clean --force' 
  : 'Hay archivos faltantes o problemas de configuración que deben corregirse.'); 