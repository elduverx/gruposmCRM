import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/select');
        if (!response.ok) {
          throw new Error('Error al obtener usuarios');
        }
        const data = await response.json() as User[];
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar los usuarios'));
        toast.error('Error al cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
} 