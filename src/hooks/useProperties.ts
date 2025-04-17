import { useState, useEffect, useCallback } from 'react';
import { Property } from '@/types/property';
import { getProperties } from '@/app/dashboard/properties/actions';

interface UsePropertiesOptions {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useProperties(options: UsePropertiesOptions = {}) {
  const {
    page = 1,
    limit = 20,
    searchTerm = '',
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = options;

  const [properties, setProperties] = useState<Property[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(page);
  const [currentSearchTerm, setCurrentSearchTerm] = useState(searchTerm);
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);
  const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc'>(sortOrder);

  // Función para cargar propiedades
  const fetchProperties = useCallback(async (
    pageNum: number,
    search: string,
    sort: string,
    order: 'asc' | 'desc'
  ) => {
    try {
      setLoading(true);
      const { properties: propertiesData, total } = await getProperties(
        pageNum,
        limit,
        search,
        sort,
        order
      );
      setProperties(propertiesData);
      setTotalProperties(total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar las propiedades'));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Efecto para cargar propiedades cuando cambian los parámetros
  useEffect(() => {
    fetchProperties(currentPage, currentSearchTerm, currentSortBy, currentSortOrder);
  }, [fetchProperties, currentPage, currentSearchTerm, currentSortBy, currentSortOrder]);

  // Función para cambiar de página
  const changePage = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
  }, []);

  // Función para cambiar el término de búsqueda con debounce
  const debouncedSearch = useCallback((term: string) => {
    setCurrentSearchTerm(term);
    setCurrentPage(1); // Resetear a la primera página al buscar
  }, [setCurrentSearchTerm, setCurrentPage]);

  // Función para cambiar el orden de clasificación
  const changeSort = useCallback((field: string) => {
    const newOrder = field === currentSortBy && currentSortOrder === 'asc' ? 'desc' : 'asc';
    setCurrentSortBy(field);
    setCurrentSortOrder(newOrder);
  }, [currentSortBy, currentSortOrder]);

  return {
    properties,
    totalProperties,
    loading,
    error,
    currentPage,
    currentSearchTerm,
    currentSortBy,
    currentSortOrder,
    changePage,
    debouncedSearch,
    changeSort,
    totalPages: Math.ceil(totalProperties / limit)
  };
} 