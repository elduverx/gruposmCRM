import { Prisma } from '@prisma/client';
import { Client } from './client';

export const PropertyStatus = {
  SIN_EMPEZAR: 'SIN_EMPEZAR',
  EMPEZADA: 'EMPEZADA'
} as const;

export const PropertyAction = {
  IR_A_DIRECCION: 'IR_A_DIRECCION',
  REPETIR: 'REPETIR',
  LOCALIZAR_VERIFICADO: 'LOCALIZAR_VERIFICADO'
} as const;

export const PropertyType = {
  CHALET: 'CHALET',
  PISO: 'PISO',
  CASA: 'CASA',
  APARTAMENTO: 'APARTAMENTO',
  ATICO: 'ATICO',
  DUPLEX: 'DUPLEX',
  TERRENO: 'TERRENO',
  LOCAL_COMERCIAL: 'LOCAL_COMERCIAL',
  OFICINA: 'OFICINA',
  GARAJE: 'GARAJE',
  TRASTERO: 'TRASTERO'
} as const;

export type PropertyStatus = typeof PropertyStatus[keyof typeof PropertyStatus];
export type PropertyAction = typeof PropertyAction[keyof typeof PropertyAction];
export type PropertyType = typeof PropertyType[keyof typeof PropertyType];

// interface Zone {
//   id: string;
//   name: string;
//   description: string | null;
//   color: string;
//   coordinates: any;
//   createdAt: Date;
//   updatedAt: Date;
// }

export interface Assignment {
  id: string;
  type: string; // SALE o RENT
  price: number;
  exclusiveUntil: Date;
  origin: string;
  clientId: string;
  sellerFeeType: string; // PERCENTAGE o FIXED
  sellerFeeValue: number;
  buyerFeeType: string; // PERCENTAGE o FIXED
  buyerFeeValue: number;
  propertyId: string;
  createdAt: Date;
  updatedAt: Date;
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  property?: {
    id: string;
    address: string;
    population: string;
  };
}

export type PropertyWithRelations = Prisma.PropertyGetPayload<{
  include: {
    zone: true;
    activities: true;
    responsibleUser: true;
  }
}>;

export interface Activity {
  id: string;
  type: string;
  status: string;
  date: string;
  client?: string;
  notes?: string;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  address: string;
  population: string;
  status: PropertyStatus;
  action: PropertyAction;
  type: PropertyType;
  ownerName: string;
  ownerPhone: string;
  captureDate: string;
  responsibleId?: string;
  hasSimpleNote: boolean;
  isOccupied: boolean;
  clientId?: string;
  zoneId?: string;
  createdAt: string;
  updatedAt: string;
  latitude?: number;
  longitude?: number;
  occupiedBy?: string;
  isLocated: boolean;
  responsible?: string;
  activities?: Activity[];
  zone?: {
    id: string;
    name: string;
  };
  assignments?: Assignment[];
  dpv?: DPV;
  clients?: Client[];
  responsibleUser?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface PropertyCreateInput {
  address: string;
  population: string;
  status?: PropertyStatus;
  action?: PropertyAction;
  type?: PropertyType;
  ownerName: string;
  ownerPhone: string;
  captureDate?: Date;
  responsibleId?: string | null;
  hasSimpleNote?: boolean;
  isOccupied?: boolean;
  clientId?: string | null;
  zoneId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  occupiedBy?: string | null;
  isLocated?: boolean;
  responsible?: string | null;
}

export interface PropertyUpdateInput extends Partial<PropertyCreateInput> {}

export interface DPV {
  id: string;
  links: string[];
  realEstate: string | null;
  phone: string | null;
  currentPrice: number | null;
  estimatedValue: number | null;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyNews {
  id: string;
  propertyId: string;
  type: string;
  action: string;
  valuation: boolean;
  priority: 'HIGH' | 'LOW';
  responsible: string | null;
  value: number | null;
  precioSM: number | null;
  precioCliente: number | null;
  createdAt: Date;
  updatedAt: Date;
  property: {
    id: string;
    address: string;
    population: string;
  };
} 