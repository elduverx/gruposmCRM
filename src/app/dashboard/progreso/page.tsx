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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mi Progreso</h1>
      <Suspense fallback={<div>Cargando...</div>}>
        <ProgresoClient userId={userId} />
      </Suspense>
    </div>
  );
} 