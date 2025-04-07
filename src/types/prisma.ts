import { Prisma } from '@prisma/client';

export type PropertyNewsWithProperty = Omit<Prisma.PropertyNewsGetPayload<{
  include: {
    property: {
      select: {
        address: true;
        population: true;
      };
    };
  };
}>, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  valuation: string;
  precioSM: number | null;
  precioCliente: number | null;
};

export type PropertyNewsCreateInput = Omit<Prisma.PropertyNewsCreateInput, 'property'> & {
  propertyId: string;
  precioSM?: number | null;
  precioCliente?: number | null;
};

export type PropertyNewsUpdateInput = Omit<Prisma.PropertyNewsUpdateInput, 'property'> & {
  type?: string;
  action?: string;
  valuation?: boolean;
  priority?: string;
  responsible?: string;
  value?: number | null;
  precioSM?: number | null;
  precioCliente?: number | null;
}; 