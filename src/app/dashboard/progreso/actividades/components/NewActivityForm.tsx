import { useState, useEffect } from 'react';
import { createUserActivity, getUserGoals } from '../../../metas/actions';
import { UserGoal } from '@/types/user';
import { PlusIcon } from '@heroicons/react/24/outline';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Dialog } from '@/components/ui/dialog';

const ACTIVITY_TYPES = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTOMATIC', label: 'Automática' }
];

interface NewActivityFormProps {
  onSuccess?: () => void;
}

export default function NewActivityForm({ onSuccess }: NewActivityFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    type: 'MANUAL',
    goalId: ''
  });

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const userGoals = await getUserGoals();
        setGoals(userGoals);
      } catch (error) {
        alert('Error al cargar las metas. Por favor, inténtalo de nuevo.');
      }
    };

    if (isOpen) {
      loadGoals();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createUserActivity({
        goalId: formData.goalId,
        type: formData.type,
        description: formData.description,
      });

      setFormData({
        description: '',
        type: 'MANUAL',
        goalId: ''
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      alert('Error al crear la actividad. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const goalOptions = goals.map(goal => ({
    value: goal.id,
    label: goal.title
  }));

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Nueva Actividad
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Nueva Actividad"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Select
              label="Meta"
              value={formData.goalId}
              onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
              options={goalOptions}
              required
            />
          </div>

          <div>
            <Select
              label="Tipo"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={ACTIVITY_TYPES}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isLoading ? (
                <Spinner size="sm" color="white" />
              ) : (
                'Crear Actividad'
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
} 