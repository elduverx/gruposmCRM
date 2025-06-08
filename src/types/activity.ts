import { Property } from './property';

export enum ActivityType {
  DPV = "DPV",
  NOTICIA = "NOTICIA",
  ENCARGO = "ENCARGO",
  VISITA = "VISITA",
  LLAMADA = "LLAMADA",
  EMAIL = "EMAIL",
  OTROS = "OTROS"
}

export interface Activity {
  id: string;
  propertyId: string;
  type: ActivityType;
  status: string;
  client: string | null;
  notes: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  property: Property | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
} 