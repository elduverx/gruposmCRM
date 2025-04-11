import { NextResponse } from 'next/server';
import { initializeDb } from '@/lib/db';

export async function GET() {
  try {
    await initializeDb();
    return NextResponse.json({ 
      success: true, 
      message: 'Base de datos inicializada correctamente' 
    });
  } catch (error) {
    // Log error internally without exposing details to client
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al inicializar la base de datos' 
      },
      { status: 500 }
    );
  }
} 