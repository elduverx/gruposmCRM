import { Building } from './building';

export interface Complex {
  id: string;
  name: string;
  address: string;
  population: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  totalBuildings?: number | null;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  buildings?: Building[];
}

export interface ComplexCreateInput {
  name: string;
  address: string;
  population: string;
  description?: string | null;
  totalBuildings?: number | null;
}

export interface ComplexUpdateInput {
  name?: string;
  address?: string;
  population?: string;
  description?: string | null;
  totalBuildings?: number | null;
}
