import { Prisma } from '@prisma/client';

export type PropertyNewsWithProperty = {
  id: string;
  type: string;
  action: string;
  valuation: string;
  priority: string;
  responsible: string;
  value: number;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
  precioCliente: number | null;
  precioSM: number | null;
  commissionType: string;
  commissionValue: number;
  property: {
    address: string;
    population: string;
  };
};

export type PropertyNewsCreateInput = {
  type: string;
  action: string;
  valuation: string;
  priority: string;
  responsible: string;
  value: number;
  propertyId: string;
  precioSM?: number | null;
  precioCliente?: number | null;
  commissionType?: string;
  commissionValue?: number;
};

export type PropertyNewsUpdateInput = {
  type?: string;
  action?: string;
  valuation?: string;
  priority?: string;
  responsible?: string;
  value?: number | null;
  precioSM?: number | null;
  precioCliente?: number | null;
  commissionType?: string;
  commissionValue?: number;
}; 