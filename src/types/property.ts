import { Prisma, PropertyStatus, PropertyAction, PropertyType } from '@prisma/client';
import { Client } from './client';

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
  title: string;
  description: string;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  propertyId: string;
  clientId: string;
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
  type: PropertyType;
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

export interface PropertyUpdateInput {
  address?: string;
  population?: string;
  status?: PropertyStatus;
  action?: PropertyAction;
  type?: PropertyType;
  ownerName?: string;
  ownerPhone?: string;
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

export interface DPV {
  id: string;
  links: string[];
  realEstate: string;
  phone: string;
  currentPrice: number;
  estimatedValue: number;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
} 