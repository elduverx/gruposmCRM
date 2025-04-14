import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';
import { migrateUsersFromJson } from '@/lib/prisma-users';
import { isAdmin } from '@/lib/auth';

// POST /api/users/migrate - Migrar usuarios de JSON a MySQL
export async function POST(request: Request) {
  console.log('🔄 Iniciando proceso de migración de usuarios JSON a MySQL');
  
  try {
    // Verificar permisos de administrador
    const adminCheck = await isAdmin(request);
    if (!adminCheck) {
      console.error('⛔ Acceso denegado: Se requiere rol de administrador para migrar usuarios');
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener usuarios del archivo JSON
    console.log('📂 Obteniendo usuarios del archivo JSON');
    const jsonUsers = getUsers();
    console.log(`📊 Encontrados ${jsonUsers.length} usuarios en el archivo JSON`);

    if (!jsonUsers || jsonUsers.length === 0) {
      console.warn('⚠️ No se encontraron usuarios para migrar');
      return NextResponse.json({ message: 'No hay usuarios para migrar' }, { status: 200 });
    }

    // Migrar usuarios a MySQL
    console.log('🚀 Iniciando migración de usuarios a MySQL');
    const result = await migrateUsersFromJson(jsonUsers);
    
    console.log(`✅ Migración completada. Migrados: ${result.success}, Errores: ${result.failed}`);
    return NextResponse.json({ 
      message: 'Migración completada', 
      migrated: result.success,
      errors: result.failed,
      details: result.errors
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error durante la migración de usuarios:', error);
    return NextResponse.json(
      { error: 'Error durante la migración', details: (error as Error).message },
      { status: 500 }
    );
  }
} 