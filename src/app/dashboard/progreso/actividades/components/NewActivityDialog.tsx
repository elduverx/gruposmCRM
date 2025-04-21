'use client';

import { useState } from 'react';
import { Activity } from '@/types/property';
import ActivityForm from '@/components/ActivityForm';
import { Dialog } from '@/components/ui/dialog';
import Button from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';

interface NewActivityDialogProps {
  onSubmit: (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function NewActivityDialog({ onSubmit }: NewActivityDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    onSubmit(activity);
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <PlusIcon className="h-4 w-4" />
        Nueva Actividad
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Crear Nueva Actividad"
      >
        <ActivityForm
          propertyId="default"
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
} 