import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import SalesClient from './SalesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Modern Header */}
      <div className="mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                💰 Finalizar Ventas
              </h1>
              <p className="text-slate-600 mt-1">
                Gestiona y completa los procesos de venta de propiedades
              </p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex justify-center items-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="text-center">
            <div className="relative mb-6">
              <Spinner />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 opacity-20 animate-pulse"></div>
            </div>
            <p className="text-slate-700 text-lg font-medium">💰 Cargando ventas...</p>
            <p className="text-slate-500 text-sm mt-2">Preparando el panel de ventas</p>
          </div>
        </div>
      }>
        <SalesClient />
      </Suspense>
    </div>
  );
} 