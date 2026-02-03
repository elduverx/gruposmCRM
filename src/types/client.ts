import { Property } from './property';
import { Assignment } from './property';

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  hasRequest: boolean;
  isTenant: boolean;
  createdAt: Date;
  updatedAt: Date;
  properties: Property[];
  assignments?: Assignment[];
}

export interface ClientFormData {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  relatedProperties: string[];
  hasRequest: boolean;
  isTenant?: boolean;
  orderRequest?: {
    desiredLocation: string;
  };
}
