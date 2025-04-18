import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(zones);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching zones' },
      { status: 500 }
    );
  }
} 