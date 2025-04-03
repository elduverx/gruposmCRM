import { PropertyStatus, PropertyAction, PropertyType } from '@prisma/client';

interface Zone {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface Property {
  id: string;
  address: string;
  population: string;
  zone?: Zone;
  zoneId?: string;
  latitude: number | null;
  longitude: number | null;
  status: PropertyStatus;
  action: PropertyAction;
  type: PropertyType;
  ownerName: string;
  ownerPhone: string;
  isOccupied: boolean;
  occupiedBy?: string;
  lastContact?: string;
  responsible?: string;
  isLocated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  propertyId: string;
  date: string;
  type: string;
  status: 'Realizada' | 'Programada';
  client?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
} 