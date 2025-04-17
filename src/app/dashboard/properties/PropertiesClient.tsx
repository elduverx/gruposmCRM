'use client';

import React, { useState, useEffect } from 'react';
import PropertyTable from '@/components/properties/PropertyTable';
import { Property } from '@/types/property';
import { Activity } from '@/types/property';
import { Zone } from '@/types/zone';
import { useRouter } from 'next/navigation';

export default function PropertiesClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activitiesMap, setActivitiesMap] = useState<Record<string, Activity[]>>({});
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('address');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Fetch properties, activities, and zones
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch properties
        const propertiesResponse = await fetch('/api/properties');
        if (!propertiesResponse.ok) {
          throw new Error('Failed to fetch properties');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const propertiesData = await propertiesResponse.json();
        setProperties(propertiesData);
        
        // Fetch activities
        const activitiesResponse = await fetch('/api/activities');
        if (!activitiesResponse.ok) {
          throw new Error('Failed to fetch activities');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const activitiesData = await activitiesResponse.json();
        
        // Group activities by property ID
        const activitiesByProperty: Record<string, Activity[]> = {};
        
        // Type guard for Activity
        const isActivity = (obj: unknown): obj is Activity => {
          return obj !== null && 
            typeof obj === 'object' && 
            'propertyId' in obj && 
            'date' in obj;
        };
        
        // Safely process activities
        if (Array.isArray(activitiesData)) {
          activitiesData.forEach((item) => {
            if (isActivity(item)) {
              if (!activitiesByProperty[item.propertyId]) {
                activitiesByProperty[item.propertyId] = [];
              }
              activitiesByProperty[item.propertyId].push(item);
            }
          });
        }
        
        // Sort activities by date (newest first)
        Object.keys(activitiesByProperty).forEach(propertyId => {
          activitiesByProperty[propertyId].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });
        
        setActivitiesMap(activitiesByProperty);
        
        // Fetch zones
        const zonesResponse = await fetch('/api/zones');
        if (!zonesResponse.ok) {
          throw new Error('Failed to fetch zones');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const zonesData = await zonesResponse.json();
        setZones(zonesData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle property click
  const handlePropertyClick = (property: Property) => {
    if (!property || typeof property !== 'object') {
      // eslint-disable-next-line no-console
      console.error('Invalid property data');
      return;
    }

    const propertyData = {
      id: property.id,
      address: property.address,
      population: property.population,
      status: property.status,
      action: property.action,
      type: property.type,
      price: property.price,
      latitude: property.latitude,
      longitude: property.longitude,
      zone: property.zone,
      responsible: property.responsible,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      description: property.description,
      ownerName: property.ownerName,
      ownerPhone: property.ownerPhone,
      ownerEmail: property.ownerEmail,
      tenantName: property.tenantName,
      tenantPhone: property.tenantPhone,
      tenantEmail: property.tenantEmail,
      habitaciones: property.habitaciones,
      banos: property.banos,
      metrosCuadrados: property.metrosCuadrados,
      parking: property.parking,
      ascensor: property.ascensor,
      piscina: property.piscina,
      yearBuilt: property.yearBuilt,
      isFurnished: property.isFurnished,
      notes: property.notes
    };

    router.push(`/dashboard/properties/${propertyData.id}`);
  };

  // Handle edit property
  const handleEditProperty = (property: Property) => {
    // Navigate to property edit page
    window.location.href = `/dashboard/properties/${property.id}/edit`;
  };

  // Handle delete property
  const handleDeleteProperty = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) {
      return;
    }
    
    try {
      setIsDeleting(id);
      
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete property');
      }
      
      // Remove the property from the state
      setProperties(properties.filter(property => property.id !== id));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting property:', error);
      alert('Error al eliminar la propiedad. Por favor, inténtalo de nuevo.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sort properties based on current sort criteria
  const sortedProperties = [...properties].sort((a, b) => {
    const aValue = a[sortBy as keyof Property];
    const bValue = b[sortBy as keyof Property];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // For numbers or other types
    return sortOrder === 'asc'
      ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
      : (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Propiedades</h1>
      <PropertyTable
        properties={sortedProperties}
        activitiesMap={activitiesMap}
        zones={zones}
        onPropertyClick={handlePropertyClick}
        onEditProperty={handleEditProperty}
        onDeleteProperty={handleDeleteProperty}
        isDeleting={isDeleting}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        isLoading={isLoading}
      />
    </div>
  );
} 