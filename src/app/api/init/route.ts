import { NextResponse } from 'next/server';
import { initializeDb } from '@/lib/db';

export async function GET() {
  try {
    await initializeDb();
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    // Log error internally without exposing details to client
    return NextResponse.json(
      { message: 'Error initializing database' },
      { status: 500 }
    );
  }
} 