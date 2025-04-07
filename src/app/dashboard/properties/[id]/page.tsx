import { Property, Activity } from '@/types/property';
import { getPropertyById, updateProperty, getActivitiesByPropertyId, createActivity, getDPVByPropertyId, createOrUpdateDPV, getPropertyNews, getAssignmentsByPropertyId } from '../actions';
import PropertyDetailClient from './PropertyDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Server component that handles async operations
export default async function PropertyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const propertyId = resolvedParams.id;
  
  // Fetch initial data on the server
  const [property, activities, dpv, news, assignments] = await Promise.all([
    getPropertyById(propertyId),
    getActivitiesByPropertyId(propertyId),
    getDPVByPropertyId(propertyId),
    getPropertyNews(propertyId),
    getAssignmentsByPropertyId(propertyId)
  ]);

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Inmueble no encontrado</h1>
          <p className="mt-2 text-gray-600">El inmueble que buscas no existe o ha sido eliminado.</p>
        </div>
      </div>
    );
  }
  
  // Convertir el tipo de priority de string a 'HIGH' | 'LOW' y las fechas a Date
  const typedNews = news.map(item => ({
    ...item,
    priority: item.priority as 'HIGH' | 'LOW',
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    property: {
      ...item.property,
      id: item.propertyId
    }
  }));
  
  return <PropertyDetailClient 
    propertyId={propertyId} 
    initialProperty={property} 
    initialActivities={activities} 
    initialDPV={dpv}
    initialNews={typedNews}
    initialAssignments={assignments}
  />;
} 