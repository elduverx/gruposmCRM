import { Suspense } from 'react';
import { getUserGoals, getUserActivities } from './actions';
import MetasClient from './MetasClient';
import { Spinner } from '@/components/ui/Spinner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MetasPage() {
  const goals = await getUserGoals();
  const activities = await getUserActivities(15);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis Metas y Progreso</h1>
        <p className="text-gray-600">
          Realiza actividades, completa tus metas y visualiza tu progreso
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Spinner /></div>}>
        <MetasClient initialGoals={goals} initialActivities={activities} />
      </Suspense>
    </div>
  );
} 