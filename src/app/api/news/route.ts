import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

async function buildNewsVisibilityWhere(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) return {};

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { zones: true }
    });

    if (!user) return {};
    if (user.role === 'ADMIN') return {};

    const zoneIds = user.zones.map(zone => zone.id);
    if (zoneIds.length > 0) {
      return {
        property: {
          zoneId: { in: zoneIds }
        }
      };
    }

    const responsible = (user.name || user.email || '').trim();
    if (!responsible) {
      return { id: '__none__' };
    }

    return { responsible };
  } catch (error) {
    return {};
  }
}

export async function GET(request: Request) {
  try {
    const where = await buildNewsVisibilityWhere(request);
    const news = await prisma.propertyNews.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            address: true,
            population: true,
            zoneId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(
      news.map(item => ({
        ...item,
        property: {
          ...item.property,
          zoneId: item.property.zoneId || ''
        }
      }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener las noticias' },
      { status: 500 }
    );
  }
}
