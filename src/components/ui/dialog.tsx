import * as React from 'react';
import { Dialog as HeadlessDialog } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  return (
    <HeadlessDialog
      open={open}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <HeadlessDialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
          {title && (
            <div className="flex justify-between items-center p-6 border-b">
              <HeadlessDialog.Title className="text-lg font-medium">
                {title}
              </HeadlessDialog.Title>
            </div>
          )}
          
          <div className="p-6">
            {children}
          </div>
        </HeadlessDialog.Panel>
      </div>
    </HeadlessDialog>
  );
} 