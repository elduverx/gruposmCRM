import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Role, User } from '@prisma/client';

// Definir interfaz para usuarios de JSON
interface JsonUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// Inicializar Prisma Client
const prisma = new PrismaClient();

// Define the path to the database file
const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

// Obtener usuarios desde el archivo JSON
function getJsonUsers(): JsonUser[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.error(`No existe el archivo JSON de usuarios: ${DB_PATH}`);
      return [];
    }
    
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data) as JsonUser[];
  } catch (error) {
    console.error('Error al leer el archivo JSON:', error);
    return [];
  }
}

// Verificar conexión a la base de datos
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Intentar ejecutar un query simple
    await prisma.$queryRaw`SELECT 1`;
    console.log('Conexión a la base de datos: EXITOSA');
    return true;
  } catch (error) {
    console.error('Error de conexión a la base de datos:', error);
    return false;
  }
}

// Migrar usuarios desde JSON a la base de datos
async function migrateUsersFromJson(jsonUsers: JsonUser[]) {
  try {
    console.log(`Migrando ${jsonUsers.length} usuarios desde JSON...`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      skipped: 0
    };
    
    for (const user of jsonUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        
        if (!existingUser) {
          // Insertar nuevo usuario
          await prisma.user.create({
            data: {
              // Usar el ID existente del JSON o dejar que Prisma genere uno nuevo
              // id: user.id, // Comentamos esta línea para que Prisma genere un nuevo CUID
              name: user.name,
              email: user.email,
              password: user.password, // Asumimos que las contraseñas ya están hasheadas
              role: user.role,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt)
            }
          });
          console.log(`Usuario migrado con éxito: ${user.email}`);
          results.success++;
        } else {
          console.log(`El usuario ${user.email} ya existe, omitiendo...`);
          results.skipped++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`Error al migrar usuario ${user.email}:`, error);
        results.failed++;
        results.errors.push(`${user.email}: ${errorMessage}`);
      }
    }
    
    console.log(`Migración completada: ${results.success} exitosos, ${results.skipped} omitidos, ${results.failed} fallidos`);
    if (results.errors.length > 0) {
      console.log('Errores encontrados:');
      results.errors.forEach(err => console.log(`- ${err}`));
    }
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error durante la migración:', error);
    throw new Error(`Error durante la migración: ${errorMessage}`);
  } finally {
    // Cerrar la conexión a la base de datos
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
async function main() {
  try {
    console.log('Iniciando la migración de usuarios...');
    
    // Verificar conexión a la base de datos
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      console.error('ERROR: No se pudo conectar a la base de datos. Verifique que la base de datos esté funcionando y la URL de conexión sea correcta.');
      process.exit(1);
    }
    
    // Obtener usuarios desde JSON
    const jsonUsers = getJsonUsers();
    
    if (jsonUsers.length === 0) {
      console.log('No hay usuarios para migrar.');
      return;
    }
    
    console.log(`Se encontraron ${jsonUsers.length} usuarios en el archivo JSON.`);
    
    // Confirmar si se desea continuar
    const args = process.argv.slice(2);
    const forceOption = args.find(arg => arg === '--force' || arg === '-f');
    
    if (!forceOption) {
      console.log('ADVERTENCIA: Esta operación migrará los usuarios del archivo JSON a la base de datos MySQL.');
      console.log('Para continuar, ejecute el script con la opción --force:');
      console.log('npx ts-node scripts/migrate-users-typescript.ts --force');
      return;
    }
    
    // Migrar usuarios
    await migrateUsersFromJson(jsonUsers);
    
  } catch (error) {
    console.error('Error al ejecutar la migración:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main(); 