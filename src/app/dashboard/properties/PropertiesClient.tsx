'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropertyTable from '@/components/properties/PropertyTable';
import { Property } from '@/types/property';
import { Activity } from '@/types/property';
import { Zone } from '@/types/zone';
import { useRouter } from 'next/navigation';
import { PropertyType, OperationType, PropertyAction } from '@/types/property';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function PropertiesClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activitiesMap, setActivitiesMap] = useState<Record<string, Activity[]>>({});
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    action: '',
    isOccupied: null as boolean | null,
    zoneId: ''
  });
  const router = useRouter();
  const [userZones, setUserZones] = useState<Zone[]>([]);
  const [hasZoneRestriction, setHasZoneRestriction] = useState(false);
  const initialLoadRef = React.useRef(false);

  // Fetch properties, activities, and zones
  useEffect(() => {
    // Solo ejecutar si no se ha cargado inicialmente
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // First, check if the user has assigned zones
        const userZonesResponse = await fetch('/api/users/zones');
        if (userZonesResponse.ok) {
          const userZonesData = await userZonesResponse.json() as Zone[];
          setUserZones(userZonesData);
          
          // If user has assigned zones, enable zone restriction
          if (userZonesData.length > 0) {
            setHasZoneRestriction(true);
            
            // Set the first user zone as the initial filter
            if (userZonesData.length > 0) {
              setFilters(prevFilters => ({
                ...prevFilters,
                zoneId: userZonesData[0].id
              }));
            }
            
            // Fetch properties for this zone
            const propertiesUrl = `/api/properties?zoneId=${userZonesData[0].id}`;
            const propertiesResponse = await fetch(propertiesUrl);
            if (!propertiesResponse.ok) {
              throw new Error('Failed to fetch properties');
            }
            
            const propertiesData = await propertiesResponse.json() as Property[];
            setProperties(propertiesData);
            
            // Fetch zones but only show assigned zones
            const zonesResponse = await fetch('/api/zones');
            if (!zonesResponse.ok) {
              throw new Error('Failed to fetch zones');
            }
            // Only show assigned zones in the filter
            setZones(userZonesData);
          } else {
            // No zone restrictions, fetch all properties
            const propertiesResponse = await fetch('/api/properties');
            if (!propertiesResponse.ok) {
              throw new Error('Failed to fetch properties');
            }
            
            const propertiesData = await propertiesResponse.json() as Property[];
            setProperties(propertiesData);
            
            // Fetch all zones
            const zonesResponse = await fetch('/api/zones');
            if (!zonesResponse.ok) {
              throw new Error('Failed to fetch zones');
            }
            const zonesData = await zonesResponse.json() as Zone[];
            setZones(zonesData);
          }
        } else {
          // Error fetching user zones, try to fetch all data
          const propertiesResponse = await fetch('/api/properties');
          if (!propertiesResponse.ok) {
            throw new Error('Failed to fetch properties');
          }
          
          const propertiesData = await propertiesResponse.json() as Property[];
          setProperties(propertiesData);
          
          // Fetch all zones
          const zonesResponse = await fetch('/api/zones');
          if (!zonesResponse.ok) {
            throw new Error('Failed to fetch zones');
          }
          const zonesData = await zonesResponse.json() as Zone[];
          setZones(zonesData);
        }
        
        // Fetch activities
        const activitiesResponse = await fetch('/api/activities');
        if (!activitiesResponse.ok) {
          throw new Error('Failed to fetch activities');
        }
        
        const activitiesData = await activitiesResponse.json() as Activity[];
        
        // Create a mapping of property ID to activities
        const activitiesMapping: Record<string, Activity[]> = {};
        activitiesData.forEach((activity: Activity) => {
          if (!activitiesMapping[activity.propertyId]) {
            activitiesMapping[activity.propertyId] = [];
          }
          activitiesMapping[activity.propertyId].push(activity);
        });
        
        setActivitiesMap(activitiesMapping);
      } catch (error) {
        toast.error('Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle property click
  const handlePropertyClick = useCallback((property: Property) => {
    if (!property || typeof property !== 'object') {
      toast.error('Datos de propiedad inválidos');
      return;
    }

    router.push(`/dashboard/properties/${property.id}`);
  }, [router]);

  // Handle delete property
  const handleDeleteProperty = useCallback(async (id: string) => {
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
      setProperties(prevProperties => prevProperties.filter(property => property.id !== id));
      toast.success('Propiedad eliminada correctamente');
    } catch (error) {
      toast.error('Error al eliminar la propiedad');
    } finally {
      setIsDeleting(null);
    }
  }, []);

  // Handle toggle located status
  const handleToggleLocated = useCallback(async (property: Property) => {
    try {
      setIsUpdating(property.id);
      
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isLocated: !property.isLocated,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update property');
      }
      
      const updatedProperty = await response.json() as Property;
      
      // Update the property in the state
      setProperties(prevProperties => 
        prevProperties.map(p => 
          p.id === property.id ? updatedProperty : p
        )
      );
      toast.success('Estado de localización actualizado');
    } catch (error) {
      toast.error('Error al actualizar la propiedad');
    } finally {
      setIsUpdating(null);
    }
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((field: string) => {
    setSortBy(field);
    setSortOrder(prevOrder => 
      sortBy === field ? (prevOrder === 'asc' ? 'desc' : 'asc') : 'asc'
    );
  }, [sortBy]);

  // Handle filter change
  const handleFilterChange = useCallback((filterType: string, value: string | boolean | null) => {
    // If we're changing the zone and there are zone restrictions, 
    // only allow selecting from assigned zones
    if (filterType === 'zoneId' && hasZoneRestriction && value === '') {
      // If user tries to select "All zones" but has restrictions,
      // set it to their first assigned zone instead
      if (userZones.length > 0) {
        value = userZones[0].id;
      }
    }
    
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  }, [hasZoneRestriction, userZones]);

  // Memoized filtered and sorted properties
  const filteredAndSortedProperties = useMemo(() => {
    // Apply filters
    const filtered = properties.filter(property => {
      const matchesSearch = searchQuery === '' || 
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.population.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filters.type === '' || property.type === filters.type;
      const matchesStatus = filters.status === '' || property.status === filters.status;
      const matchesAction = filters.action === '' || property.action === filters.action;
      const matchesIsOccupied = filters.isOccupied === null || property.isOccupied === filters.isOccupied;
      const matchesZone = filters.zoneId === '' || property.zoneId === filters.zoneId;
      
      return matchesSearch && matchesType && matchesStatus && matchesAction && matchesIsOccupied && matchesZone;
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Property];
      const bValue = b[sortBy as keyof Property];
      
      if (sortBy === 'isLocated') {
        const aBool = aValue === true ? 1 : 0;
        const bBool = bValue === true ? 1 : 0;
        return sortOrder === 'asc' ? aBool - bBool : bBool - aBool;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      return 0;
    });
    
    return filtered;
  }, [properties, searchQuery, filters, sortBy, sortOrder]);

  // Calculate pagination
  const totalItems = filteredAndSortedProperties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProperties = filteredAndSortedProperties.slice(
    startIndex, 
    startIndex + itemsPerPage
  );

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Inmuebles</h1>
        <button
          onClick={() => router.push('/dashboard/properties/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo inmueble
        </button>
      </div>
      
      {/* Add a visual indicator if the user has zone restrictions */}
      {hasZoneRestriction && (
        <div className="px-4 py-3 mb-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Solo puedes ver inmuebles de las zonas que tienes asignadas.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Buscar por dirección, propietario o población..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Inmueble
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {Object.values(PropertyType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {Object.values(OperationType).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          
          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acción
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {Object.values(PropertyAction).map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
          
          {/* Occupied Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ocupación
            </label>
            <select
              value={filters.isOccupied === null ? '' : filters.isOccupied.toString()}
              onChange={(e) => {
                const value = e.target.value === '' ? null : e.target.value === 'true';
                handleFilterChange('isOccupied', value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Ocupado</option>
              <option value="false">Desocupado</option>
            </select>
          </div>
          
          {/* Zone Filter - update to respect zone restrictions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zona
            </label>
            <select
              value={filters.zoneId}
              onChange={(e) => handleFilterChange('zoneId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={hasZoneRestriction && userZones.length <= 1}
            >
              {!hasZoneRestriction && <option value="">Todas</option>}
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
            {hasZoneRestriction && (
              <p className="mt-1 text-xs text-gray-500">Solo puedes ver zonas asignadas</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {paginatedProperties.length} de {totalItems} propiedades
      </div>
      
      {/* Property Table */}
      <PropertyTable
        properties={paginatedProperties}
        activitiesMap={activitiesMap}
        zones={zones}
        onPropertyClick={handlePropertyClick}
        onDeleteProperty={handleDeleteProperty}
        onToggleLocated={handleToggleLocated}
        isDeleting={isDeleting}
        isUpdating={isUpdating}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        isLoading={isLoading}
      />
      
      {/* Pagination Carousel */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
              aria-label="Página anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Primera página siempre visible */}
            {currentPage > 2 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                >
                  1
                </button>
                {currentPage > 3 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
              </>
            )}
            
            {/* Páginas alrededor de la página actual */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Mostrar la página actual y una página antes y después
                return Math.abs(page - currentPage) <= 1;
              })
              .map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            
            {/* Última página siempre visible */}
            {currentPage < totalPages - 1 && (
              <>
                {currentPage < totalPages - 2 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                >
                  {totalPages}
                </button>
              </>
            )}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
              aria-label="Página siguiente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
} 