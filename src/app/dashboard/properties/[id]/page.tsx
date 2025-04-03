import { Property, Activity } from '@/types/property';
import { getPropertyById, updateProperty, getActivitiesByPropertyId, createActivity, getDPVByPropertyId, createOrUpdateDPV } from '../actions';
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
  const [property, activities, dpv] = await Promise.all([
    getPropertyById(propertyId),
    getActivitiesByPropertyId(propertyId),
    getDPVByPropertyId(propertyId)
  ]);
  
  return <PropertyDetailClient 
    propertyId={propertyId} 
    initialProperty={property} 
    initialActivities={activities} 
    initialDPV={dpv} 
  />;
} 