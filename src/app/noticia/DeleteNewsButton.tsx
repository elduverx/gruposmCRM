'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { deleteNews } from './actions';
import { useRouter } from 'next/navigation';

interface DeleteNewsButtonProps {
  id: string;
}

export default function DeleteNewsButton({ id }: DeleteNewsButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta noticia?')) {
      setIsDeleting(true);
      try {
        await deleteNews(id);
        router.refresh();
      } catch (error) {
        console.error('Error al eliminar la noticia:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-900 disabled:opacity-50"
    >
      <TrashIcon className="h-5 w-5" />
    </button>
  );
} 