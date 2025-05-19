import { getActivities } from '@/app/dashboard/activities/actions';
import { ActivityList } from '@/components/activities/ActivityList';

export default async function ActivitiesPage() {
  const activities = await getActivities();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Actividades</h1>
      <ActivityList activities={activities} />
    </div>
  );
} 