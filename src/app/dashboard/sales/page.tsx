import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import SalesClient from './SalesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SalesPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 font-audiowide">Finalizar Ventas</h1>
      <Suspense fallback={<div className="flex justify-center p-8"><Spinner /></div>}>
        <SalesClient />
      </Suspense>
    </div>
  );
} 