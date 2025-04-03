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

export interface Property {
  id: string;
  address: string;
  population: string;
  status: PropertyStatus;
  action: PropertyAction;
  type: PropertyType;
  ownerName: string;
  ownerPhone: string;
  captureDate: Date;
  responsibleId: string | null;
  hasSimpleNote: boolean;
  isOccupied: boolean;
  clientId: string | null;
  zoneId: string | null;
  createdAt: Date;
  updatedAt: Date;
  latitude: number | null;
  longitude: number | null;
  occupiedBy: string | null;
  zone: Zone | null;
  isLocated: boolean;
  lastContact: Date | null;
  responsible: string | null;
  assignments: Assignment[];
  client: Client | null;
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
  lastContact?: Date | null;
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
  lastContact?: Date | null;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
  propertyId: string;
  userId: string;
} 