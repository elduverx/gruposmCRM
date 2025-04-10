import { Client } from './client';
import { PropertyType } from '@/types/property';

export interface Order {
  id: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  operationType: 'SALE' | 'RENT';
  total: number;
  createdAt: string;
  updatedAt: string;
  bedrooms: number;
  bathrooms: number;
  minPrice: number;
  maxPrice: number;
  propertyType: string;
  features: string[];
}

export interface OrderCreateInput {
  clientId: string;
  operationType: 'SALE' | 'RENT';
  bedrooms: number;
  bathrooms: number;
  minPrice: number;
  maxPrice: number;
  propertyType: string;
  features: string[];
}

export interface OrderWithClient extends Order {
  client: {
    id: string;
    name: string;
    email: string;
  };
} 