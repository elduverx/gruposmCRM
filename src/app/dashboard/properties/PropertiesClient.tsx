'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropertyTable from '@/components/properties/PropertyTable';
import { Property } from '@/types/property';
import { Activity } from '@/types/property';
import { Zone } from '@/types/zone';
import { useRouter } from 'next/navigation';
import { PropertyType, OperationType, PropertyAction } from '@/types/property';

export default function PropertiesClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activitiesMap, setActivitiesMap] = useState<Record<string, Activity[]>>({});
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('address');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(30);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    action: '',
    isOccupied: null as boolean | null,
  });
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
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
        const propertiesData = await propertiesResponse.json() as Property[];
        setProperties(propertiesData);
        
        // Fetch activities
        const activitiesResponse = await fetch('/api/activities');
        if (!activitiesResponse.ok) {
          throw new Error('Failed to fetch activities');
        }
        const activitiesData = await activitiesResponse.json() as Activity[];
        
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
        const zonesData = await zonesResponse.json() as Zone[];
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
  const handlePropertyClick = useCallback((property: Property) => {
    if (!property || typeof property !== 'object') {
      // eslint-disable-next-line no-console
      console.error('Invalid property data');
      return;
    }

    router.push(`/dashboard/properties/${property.id}`);
  }, [router]);

  // Handle edit property
  const handleEditProperty = useCallback((property: Property) => {
    router.push(`/dashboard/properties/${property.id}/edit`);
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
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting property:', error);
      alert('Error al eliminar la propiedad. Por favor, inténtalo de nuevo.');
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
      
      const updatedProperty = await response.json();
      
      // Update the property in the state
      setProperties(prevProperties => 
        prevProperties.map(p => 
          p.id === property.id ? updatedProperty : p
        )
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating property:', error);
      alert('Error al actualizar la propiedad. Por favor, inténtalo de nuevo.');
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
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Memoized filtered and sorted properties
  const filteredAndSortedProperties = useMemo(() => {
    // First apply filters
    const filtered = properties.filter(property => {
      // Apply search query filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        property.address.toLowerCase().includes(searchLower) ||
        property.ownerName.toLowerCase().includes(searchLower) ||
        property.population.toLowerCase().includes(searchLower);
      
      // Apply type filter
      const matchesType = filters.type === '' || property.type === filters.type;
      
      // Apply status filter
      const matchesStatus = filters.status === '' || property.status === filters.status;
      
      // Apply action filter
      const matchesAction = filters.action === '' || property.action === filters.action;
      
      // Apply occupied filter
      const matchesOccupied = filters.isOccupied === null || 
        property.isOccupied === filters.isOccupied;
      
      return matchesSearch && matchesType && matchesStatus && 
             matchesAction && matchesOccupied;
    });
    
    // Then apply sorting
    return filtered.sort((a, b) => {
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
  }, [properties, searchQuery, sortBy, sortOrder, filters]);

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

  const handleSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    setCurrentPage(1);
    
    const filtered = properties.filter(property => {
      const searchLower = searchTerm.toLowerCase();
      
      // Manejo seguro de propiedades que pueden ser null o undefined
      const address = property.address?.toLowerCase() || '';
      const ownerName = property.ownerName?.toLowerCase() || '';
      const ownerPhone = property.ownerPhone?.toLowerCase() || '';
      const ownerEmail = property.ownerEmail?.toLowerCase() || '';
      const tenantName = property.tenantName?.toLowerCase() || '';
      const tenantPhone = property.tenantPhone?.toLowerCase() || '';
      const tenantEmail = property.tenantEmail?.toLowerCase() || '';
      const notes = property.notes?.toLowerCase() || '';
      const type = property.type?.toLowerCase() || '';
      const status = property.status?.toLowerCase() || '';
      const action = property.action?.toLowerCase() || '';
      const zoneName = property.zone?.name?.toLowerCase() || '';
      const description = property.description?.toLowerCase() || '';
      
      return (
        address.includes(searchLower) ||
        ownerName.includes(searchLower) ||
        ownerPhone.includes(searchLower) ||
        ownerEmail.includes(searchLower) ||
        tenantName.includes(searchLower) ||
        tenantPhone.includes(searchLower) ||
        tenantEmail.includes(searchLower) ||
        notes.includes(searchLower) ||
        type.includes(searchLower) ||
        status.includes(searchLower) ||
        action.includes(searchLower) ||
        zoneName.includes(searchLower) ||
        description.includes(searchLower)
      );
    });
    
    setFilteredProperties(filtered);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Propiedades</h1>
      
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        onEditProperty={handleEditProperty}
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