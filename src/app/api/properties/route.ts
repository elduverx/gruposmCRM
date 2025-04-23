import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { OperationType, PropertyType, PropertyAction } from '@/types/property';

const prisma = new PrismaClient();

interface PropertyInput {
  address: string;
  population: string;
  ownerName: string;
  ownerPhone: string;
  type: typeof PropertyType[keyof typeof PropertyType];
  status: typeof OperationType[keyof typeof OperationType];
  action: typeof PropertyAction[keyof typeof PropertyAction];
  isOccupied?: boolean;
  occupiedBy?: string;
  latitude?: number;
  longitude?: number;
  isSold?: boolean;
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as PropertyInput;
    
    // Validar datos requeridos
    if (!data.address || !data.population || !data.ownerName || !data.ownerPhone) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar tipos de datos
    if (!Object.values(PropertyType).includes(data.type)) {
      return NextResponse.json(
        { error: 'Tipo de inmueble inválido' },
        { status: 400 }
      );
    }

    if (!Object.values(OperationType).includes(data.status)) {
      return NextResponse.json(
        { error: 'Estado de inmueble inválido' },
        { status: 400 }
      );
    }

    if (!Object.values(PropertyAction).includes(data.action)) {
      return NextResponse.json(
        { error: 'Acción de inmueble inválida' },
        { status: 400 }
      );
    }

    const property = await prisma.property.create({
      data: {
        address: data.address,
        population: data.population,
        status: data.status,
        action: data.action,
        type: data.type,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        isOccupied: data.isOccupied ?? false,
        occupiedBy: data.occupiedBy ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        isSold: data.isSold ?? false,
      },
    });

    return NextResponse.json(property);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear el inmueble' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        zone: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(properties);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching properties' },
      { status: 500 }
    );
  }
} 