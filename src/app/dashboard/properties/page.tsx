import React from 'react';
import { Metadata } from 'next';
import PropertiesClient from './PropertiesClient';

export const metadata: Metadata = {
  title: 'Propiedades | CRM Grupo SM',
  description: 'Gestión de propiedades'
};

export default async function PropertiesPage() {
  return (
    <div className="relative min-h-screen">
      {/* Efectos de fondo modernos */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/10 to-cyan-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative py-8">
        <PropertiesClient />
      </div>
    </div>
  );
} 