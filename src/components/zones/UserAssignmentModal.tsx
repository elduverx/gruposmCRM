'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Zone {
  id: string;
  name: string;
}

interface UserAssignmentModalProps {
  zone: Zone;
  onClose: () => void;
  onSave: (selectedUserIds: string[]) => Promise<void>;
}

export default function UserAssignmentModal({ zone, onClose, onSave }: UserAssignmentModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': token ? `Bearer ${token}` : ''
        };
        
        // Fetch all users
        const usersResponse = await fetch('/api/users/select', {
          headers
        });
        if (!usersResponse.ok) {
          throw new Error('Error al cargar usuarios');
        }
        const usersData = await usersResponse.json() as User[];
        setUsers(usersData);
        
        // Fetch assigned users for this zone
        const assignedUsersResponse = await fetch(`/api/zones/${zone.id}/users`, {
          headers
        });
        if (!assignedUsersResponse.ok) {
          throw new Error('Error al cargar usuarios asignados');
        }
        const assignedUsersData = await assignedUsersResponse.json() as User[];
        
        // Set initial selected user ids
        setSelectedUserIds(assignedUsersData.map(user => user.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [zone.id]);
  
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(selectedUserIds);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar asignaciones');
    } finally {
      setSaving(false);
    }
  };
  
  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (user.name?.toLowerCase().includes(searchTermLower) || false) ||
      user.email.toLowerCase().includes(searchTermLower)
    );
  });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Asignar Usuarios a Zona: {zone.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto mb-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No se encontraron usuarios con esa búsqueda
                </p>
              ) : (
                filteredUsers.map(user => (
                  <div key={user.id} className="flex items-center p-2 border rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{user.name || 'Sin nombre'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </label>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {user.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
} 