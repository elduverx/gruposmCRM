export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ProgresoClient from './ProgresoClient';
import { getCurrentUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProgresoPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect('/login');
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Modern Header */}
      <div className="mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                📈 Mi Progreso
              </h1>
              <p className="text-slate-600 mt-1">
                Visualiza tu rendimiento y evolución personal
              </p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex justify-center items-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-cyan-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-20 animate-pulse"></div>
            </div>
            <p className="text-slate-700 text-lg font-medium">📈 Cargando progreso...</p>
            <p className="text-slate-500 text-sm mt-2">Analizando tu rendimiento</p>
          </div>
        </div>
      }>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <ProgresoClient userId={userId} />
        </div>
      </Suspense>
    </div>
  );
} 