'use client';

import { PlusIcon } from '@heroicons/react/24/outline';

interface AddOrderButtonProps {
  onClick: () => void;
}

export default function AddOrderButton({ onClick }: AddOrderButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Botón de nuevo pedido clickeado");
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      type="button"
    >
      <PlusIcon className="h-5 w-5 mr-2" />
      Nuevo Pedido
    </button>
  );
}
