import { useState, useEffect } from 'react';
import { Client } from '@/types/client';
import { getClients } from '@/app/dashboard/clients/actions';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getClients();
        setClients(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar los clientes'));
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  return { clients, loading, error };
} 