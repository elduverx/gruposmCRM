'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropertyTable from '@/components/properties/PropertyTable';
import { Property } from '@/types/property';
import { Activity } from '@/types/property';
import { ActivityType } from '@/types/activity';
import { Zone } from '@/types/zone';
import { useRouter } from 'next/navigation';
import { PropertyType, OperationType, PropertyAction } from '@/types/property';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { logActivity } from '@/lib/client/activityLogger';

// Función para normalizar texto (eliminar acentos, espacios extras, minúsculas)
const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/\s+/g, ' ') // Eliminar espacios extras
    .trim();
};

// Función para normalizar números (eliminar separadores de miles)
const normalizeNumber = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/[.,\s]/g, '');
};

// Función de similitud de Levenshtein (distancia de edición)
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

// Función para verificar si hay coincidencia fuzzy
const fuzzyMatch = (searchTerm: string, targetText: string, threshold: number = 2): boolean => {
  const normalizedSearch = normalizeText(searchTerm);
  const normalizedTarget = normalizeText(targetText);

  // Coincidencia exacta (después de normalizar)
  if (normalizedTarget.includes(normalizedSearch)) {
    return true;
  }

  // Búsqueda fuzzy por palabras
  const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
  const targetWords = normalizedTarget.split(' ');

  for (const searchWord of searchWords) {
    for (const targetWord of targetWords) {
      // Si la palabra tiene más de 4 caracteres, permitir más tolerancia
      const maxDistance = searchWord.length > 4 ? threshold : 1;
      const distance = levenshteinDistance(searchWord, targetWord);

      if (distance <= maxDistance) {
        return true;
      }
    }
  }

  return false;
};

export default function PropertiesClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activitiesMap, setActivitiesMap] = useState<Record<string, Activity[]>>({});
  const [zones, setZones] = useState<Zone[]>([]);
  const [clients, setClients] = useState<any[]>([]);
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
        
        // Fetch clients para mostrar nombres en lugar de IDs
        const clientsResponse = await fetch('/api/clients');
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData);
        }
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

      // Si se marcó como localizado, registrar la actividad
      if (updatedProperty.isLocated) {
        await logActivity({
          type: ActivityType.OTROS,
          description: `Propiedad marcada como localizada: ${property.address}`,
          relatedId: property.id,
          relatedType: 'PROPERTY_LOCATED',
          metadata: {
            propertyId: property.id,
            address: property.address,
            action: 'mark_as_located'
          },
          points: 1
        });
      }
      
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
      // Búsqueda avanzada mejorada con fuzzy matching y normalización
      if (searchQuery === '') {
        // Si no hay búsqueda, no aplicar filtro de búsqueda
      } else {
        const normalizedQuery = normalizeText(searchQuery);
        const normalizedQueryNumber = normalizeNumber(searchQuery);

        // Campos de texto para búsqueda fuzzy
        const textFields = [
          property.address,
          property.population,
          property.ownerName,
          property.ownerPhone,
          property.ownerEmail,
          property.occupiedByName,
          property.tenantName,
          property.tenantPhone,
          property.tenantEmail,
          property.description,
          property.notes,
          property.zone?.name,
          property.responsibleUser?.name,
          property.responsibleUser?.email,
        ];

        // Búsqueda fuzzy en campos de texto
        const matchesTextField = textFields.some(field => {
          if (!field) return false;
          return fuzzyMatch(searchQuery, field, 2);
        });

        // Búsqueda en precio (normalizado sin comas/puntos)
        const normalizedPrice = normalizeNumber(property.price);
        const matchesPrice = normalizedPrice.includes(normalizedQueryNumber);

        // Búsqueda en números (habitaciones, baños, metros)
        const matchesNumbers =
          property.habitaciones?.toString().includes(searchQuery) ||
          property.banos?.toString().includes(searchQuery) ||
          property.metrosCuadrados?.toString().includes(normalizedQueryNumber);

        // Búsqueda en clientes asociados
        const matchesClients = property.clients?.some(client =>
          fuzzyMatch(searchQuery, client.name || '', 2) ||
          normalizeText(client.phone || '').includes(normalizedQuery) ||
          normalizeText(client.email || '').includes(normalizedQuery)
        );

        // Búsqueda en asignaciones (assignments)
        const matchesAssignments = property.assignments?.some(assignment => {
          const clientName = assignment.client?.name || '';
          const clientPhone = assignment.client?.phone || '';
          return fuzzyMatch(searchQuery, clientName, 2) ||
                 normalizeText(clientPhone).includes(normalizedQuery);
        });

        const matchesSearch = matchesTextField || matchesPrice || matchesNumbers ||
                             matchesClients || matchesAssignments;

        if (!matchesSearch) return false;
      }

      const matchesType = filters.type === '' || property.type === filters.type;
      const matchesStatus = filters.status === '' || property.status === filters.status;
      const matchesAction = filters.action === '' || property.action === filters.action;
      const matchesIsOccupied = filters.isOccupied === null || property.isOccupied === filters.isOccupied;
      const matchesZone = filters.zoneId === '' || property.zoneId === filters.zoneId;

      return matchesType && matchesStatus && matchesAction && matchesIsOccupied && matchesZone;
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
      {/* Header modernizado */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">🏠</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Gestión de Inmuebles
                </h1>
                <p className="text-gray-600 mt-1">Administra propiedades y actividades</p>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/dashboard/buildings')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Edificio
              </button>
              
              <button
                onClick={() => router.push('/dashboard/complexes')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Complejo
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add a visual indicator if the user has zone restrictions */}
      {hasZoneRestriction && (
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-sm"></div>
          <div className="relative bg-yellow-50/90 backdrop-blur-sm border border-yellow-200/50 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-yellow-500 text-xl mr-3">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-medium">
                  Solo puedes ver inmuebles de las zonas que tienes asignadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and Filters modernizados */}
      <div className="mb-8 space-y-6">
        {/* Search Bar modernizada */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl blur-sm group-focus-within:blur-md transition-all duration-300"></div>
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Búsqueda inteligente: dirección, propietario, inquilino, responsable, precio, zona... (tolera errores de escritura)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-12 text-sm bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Filters modernizados */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 to-blue-100/50 rounded-2xl blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Type Filter */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">🏘️</span>
                  Tipo de Inmueble
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200 group-hover:shadow-md"
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
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">📊</span>
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200 group-hover:shadow-md"
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
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">⚡</span>
                  Acción
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200 group-hover:shadow-md"
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
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">🔐</span>
                  Ocupación
                </label>
                <select
                  value={filters.isOccupied === null ? '' : filters.isOccupied.toString()}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : e.target.value === 'true';
                    handleFilterChange('isOccupied', value);
                  }}
                  className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200 group-hover:shadow-md"
                >
                  <option value="">Todos</option>
                  <option value="true">Ocupado</option>
                  <option value="false">Desocupado</option>
                </select>
              </div>
              
              {/* Zone Filter - update to respect zone restrictions */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">📍</span>
                  Zona
                </label>
                <select
                  value={filters.zoneId}
                  onChange={(e) => handleFilterChange('zoneId', e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200 group-hover:shadow-md"
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
                  <p className="mt-1 text-xs text-gray-500 flex items-center">
                    <span className="mr-1">🔒</span>
                    Solo puedes ver zonas asignadas
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results count modernizado */}
      <div className="mb-6 px-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 border border-blue-200/30">
            📊 Mostrando {paginatedProperties.length} de {totalItems} propiedades
          </span>
          <div className="text-sm text-gray-500">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      </div>
      
      {/* Property Table */}
      <PropertyTable
        properties={paginatedProperties}
        activitiesMap={activitiesMap}
        zones={zones}
        clients={clients}
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
      
      {/* Pagination Carousel modernizada */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-2xl blur-sm"></div>
            <nav className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`group relative px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:shadow-lg transform hover:scale-105'
                  }`}
                  aria-label="Página anterior"
                >
                  {currentPage !== 1 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                  <span className="relative flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Anterior
                  </span>
                </button>
                
                {/* Primera página siempre visible */}
                {currentPage > 2 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="px-4 py-2 rounded-xl bg-white/70 text-gray-700 hover:bg-gradient-to-r hover:from-blue-100 hover:to-green-100 border border-gray-200 transition-all duration-300 hover:shadow-md"
                    >
                      1
                    </button>
                    {currentPage > 3 && (
                      <span className="px-2 text-gray-500 font-medium">...</span>
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
                      className={`group relative px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                          : 'bg-white/70 text-gray-700 hover:bg-gradient-to-r hover:from-blue-100 hover:to-green-100 border border-gray-200 hover:shadow-md'
                      }`}
                    >
                      {currentPage === page && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl blur-sm opacity-60"></div>
                      )}
                      <span className="relative">{page}</span>
                    </button>
                  ))}
                
                {/* Última página siempre visible */}
                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && (
                      <span className="px-2 text-gray-500 font-medium">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="px-4 py-2 rounded-xl bg-white/70 text-gray-700 hover:bg-gradient-to-r hover:from-blue-100 hover:to-green-100 border border-gray-200 transition-all duration-300 hover:shadow-md"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`group relative px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:shadow-lg transform hover:scale-105'
                  }`}
                  aria-label="Página siguiente"
                >
                  {currentPage !== totalPages && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                  <span className="relative flex items-center">
                    Siguiente
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}