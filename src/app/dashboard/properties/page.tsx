import React from 'react';
import { Metadata } from 'next';
import PropertiesClient from './PropertiesClient';

export const metadata: Metadata = {
  title: 'Propiedades | CRM Grupo SM',
  description: 'Gestión de propiedades'
};

export default async function PropertiesPage() {
  return (
    <div className="py-10">
      <PropertiesClient />
    </div>
  );
} 