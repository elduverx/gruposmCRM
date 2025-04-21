import { Prisma } from '@prisma/client';
import { Client } from './client';

export const PropertyStatus = {
  SIN_EMPEZAR: 'SIN_EMPEZAR',
  EMPEZADA: 'EMPEZADA'
} as const;

export const OperationType = {
  SALE: 'SALE',
  RENT: 'RENT'
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
  exclusiveUntil: string;
  origin: string;
  clientId: string | null;
  sellerFeeType: string; // PERCENTAGE o FIXED
  sellerFeeValue: number;
  buyerFeeType: string; // PERCENTAGE o FIXED
  buyerFeeValue: number;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
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
  client: string | null;
  notes: string | null;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  address: string;
  population: string;
  status: typeof OperationType[keyof typeof OperationType];
  action: PropertyAction;
  type: PropertyType;
  ownerName: string;
  ownerPhone: string;
  captureDate: string;
  responsibleId: string | null;
  hasSimpleNote: boolean;
  isOccupied: boolean;
  clientId: string | null;
  zoneId: string | null;
  createdAt: string;
  updatedAt: string;
  latitude: number | null;
  longitude: number | null;
  occupiedBy: string | null;
  isLocated: boolean;
  responsible: string | null;
  activities: Activity[];
  zone: {
    id: string;
    name: string;
  } | null;
  assignments: Assignment[];
  dpv: DPV | null;
  clients: Client[];
  responsibleUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  habitaciones: number | null;
  banos: number | null;
  metrosCuadrados: number | null;
  parking: boolean;
  ascensor: boolean;
  piscina: boolean;
  price: string;
  description: string;
  yearBuilt: string;
  isFurnished: boolean;
  ownerEmail: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  notes: string;
}

export interface PropertyCreateInput {
  address: string;
  population: string;
  status?: typeof OperationType[keyof typeof OperationType];
  action?: PropertyAction;
  type?: PropertyType;
  ownerName: string;
  ownerPhone: string;
  captureDate?: Date | null;
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
  habitaciones?: number | null;
  banos?: number | null;
  metrosCuadrados?: number | null;
  parking?: boolean;
  ascensor?: boolean;
  piscina?: boolean;
  zone?: {
    id: string;
    name: string;
  } | null;
}

export type PropertyUpdateInput = Partial<PropertyCreateInput>;

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
  valuation: string;
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
    zoneId: string;
  };
}

export interface CatastroProperty {
  id: string;
  reference: string;
  streetName: string;
  number: string;
  door: string | null;
  floor: string | null;
  lat: number;
  lng: number;
  createdAt: Date;
  updatedAt: Date;
} 