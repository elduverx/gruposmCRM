import { Property } from './property';

export interface Activity {
  id: string;
  propertyId: string;
  type: string;
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