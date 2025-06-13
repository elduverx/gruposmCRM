import { Property } from './property';
import { Complex } from './complex';

export interface Building {
  id: string;
  name: string;
  address: string;
  population: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  totalFloors?: number | null;
  totalUnits?: number | null;
  complexId?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  complex?: Complex | null;
  properties?: Property[];
}

export interface BuildingCreateInput {
  name: string;
  address: string;
  population: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  totalFloors?: number | null;
  totalUnits?: number | null;
  complexId?: string | null;
}

export interface BuildingUpdateInput {
  name?: string;
  address?: string;
  population?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  totalFloors?: number | null;
  totalUnits?: number | null;
  complexId?: string | null;
}
