import { Property } from './property';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  hasRequest: boolean;
  createdAt: Date;
  updatedAt: Date;
  properties: Property[];
  assignments?: Assignment[];
}

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

export interface ClientFormData {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  relatedProperties: string[];
  hasRequest: boolean;
} 