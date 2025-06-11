import * as React from 'react';
import { Dialog as HeadlessDialog } from '@headlessui/react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

export function Dialog({ open, onClose, title, children, maxWidth = '2xl' }: DialogProps) {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };

  return (
    <HeadlessDialog
      open={open}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <HeadlessDialog.Panel className={`mx-auto ${maxWidthClasses[maxWidth]} w-full bg-white rounded-xl shadow-lg`}>
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