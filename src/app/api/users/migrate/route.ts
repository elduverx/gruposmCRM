import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';
import { migrateUsersFromJson } from '@/lib/prisma-users';
import { isAdmin } from '@/lib/auth';

// POST /api/users/migrate - Migrar usuarios de JSON a MySQL
export async function POST(request: Request) {
  // eslint-disable-next-line no-console
  console.log('🔄 Iniciando proceso de migración de usuarios JSON a MySQL');
  
  try {
    // Verificar permisos de administrador
    const adminCheck = await isAdmin(request);
    if (!adminCheck) {
      // eslint-disable-next-line no-console
      console.error('⛔ Acceso denegado: Se requiere rol de administrador para migrar usuarios');
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener usuarios del archivo JSON
    // eslint-disable-next-line no-console
    console.log('📂 Obteniendo usuarios del archivo JSON');
    const jsonUsers = getUsers();
    // eslint-disable-next-line no-console
    console.log(`📊 Encontrados ${jsonUsers.length} usuarios en el archivo JSON`);

    if (!jsonUsers || jsonUsers.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ No se encontraron usuarios para migrar');
      return NextResponse.json({ message: 'No hay usuarios para migrar' }, { status: 200 });
    }

    // Migrar usuarios a MySQL
    // eslint-disable-next-line no-console
    console.log('🚀 Iniciando migración de usuarios a MySQL');
    const result = await migrateUsersFromJson(jsonUsers);
    
    // eslint-disable-next-line no-console
    console.log(`✅ Migración completada. Migrados: ${result.success}, Errores: ${result.failed}`);
    return NextResponse.json({ 
      message: 'Migración completada', 
      migrated: result.success,
      errors: result.failed,
      details: result.errors
    }, { status: 200 });
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error durante la migración de usuarios:', error);
    return NextResponse.json(
      { error: 'Error durante la migración', details: (error as Error).message },
      { status: 500 }
    );
  }
} 