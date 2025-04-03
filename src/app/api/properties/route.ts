import { NextResponse } from 'next/server';
import { PrismaClient, PropertyType, PropertyStatus, PropertyAction } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
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

    if (!Object.values(PropertyStatus).includes(data.status)) {
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
        status: data.status as PropertyStatus,
        action: data.action as PropertyAction,
        propertyType: data.type as PropertyType,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        isOccupied: data.isOccupied,
        occupantName: data.occupiedBy,
        lat: data.latitude,
        lng: data.longitude,
      },
    });

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Error al crear el inmueble' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Error fetching properties' },
      { status: 500 }
    );
  }
} 