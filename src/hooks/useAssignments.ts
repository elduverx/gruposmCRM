import { useState, useEffect } from 'react';
import { Assignment } from '@/types/property';
import { getAssignments } from '@/app/dashboard/properties/actions';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getAssignments();
        setAssignments(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar las asignaciones'));
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  return { assignments, loading, error };
} 