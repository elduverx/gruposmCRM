import { NextResponse } from 'next/server';
import { PrismaClient, Property } from '@prisma/client';

const prisma = new PrismaClient();

// GET a specific property
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const property = await prisma.property.findUnique({
      where: {
        id: params.id,
      },
      include: {
        zone: true
      }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(property);
  } catch (error) {
    // Log error to server logs instead of console
    // eslint-disable-next-line no-console
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Error fetching property' },
      { status: 500 }
    );
  }
}

// PATCH to update a property
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json() as Partial<Property>;
    
    // Validate property exists
    const existingProperty = await prisma.property.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Update the property
    const updatedProperty = await prisma.property.update({
      where: {
        id: params.id,
      },
      data: {
        ...data,
      },
    });

    return NextResponse.json(updatedProperty);
  } catch (error) {
    // Log error to server logs instead of console
    // eslint-disable-next-line no-console
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Error updating property' },
      { status: 500 }
    );
  }
}

// DELETE a property
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    return NextResponse.json(
      { error: 'No está permitido eliminar inmuebles' },
      { status: 403 }
    );
  } catch (error) {
    // Log error to server logs instead of console
    // eslint-disable-next-line no-console
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Error deleting property' },
      { status: 500 }
    );
  }
} 
