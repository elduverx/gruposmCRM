import { PropertyStatus, PropertyAction, PropertyType, AssignmentStatus } from '@prisma/client';

interface Zone {
  id: string;
  name: string;
  description: string | null;
  color: string;
  coordinates: any;
  createdAt: Date;
  updatedAt: Date;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  status: AssignmentStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  propertyId: string;
  clientId: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
  population: string;
  zone?: {
    id: string;
    name: string;
  };
  address: string;
  occupiedBy?: string;
  ownerName: string;
  ownerPhone: string;
  responsible?: string;
  isLocated: boolean;
  createdAt: string;
  updatedAt: string;
  status: PropertyStatus;
  action: PropertyAction;
  type: PropertyType;
  captureDate: string;
  responsibleId?: string;
  hasSimpleNote: boolean;
  isOccupied: boolean;
  clientId?: string;
  zoneId?: string;
  latitude?: number;
  longitude?: number;
  activities?: Activity[];
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