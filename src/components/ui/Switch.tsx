import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Switch({
  label,
  error,
  helperText,
  size = 'md',
  className,
  id,
  ...props
}: SwitchProps) {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  const sizeStyles = {
    sm: {
      switch: 'h-4 w-7',
      dot: 'h-3 w-3',
      translate: 'translate-x-3',
    },
    md: {
      switch: 'h-5 w-9',
      dot: 'h-4 w-4',
      translate: 'translate-x-4',
    },
    lg: {
      switch: 'h-6 w-11',
      dot: 'h-5 w-5',
      translate: 'translate-x-5',
    },
  };

  return (
    <div className={cn('space-y-1', className)}>
      <label className="flex items-center">
        <div className="relative inline-flex">
          <input
            type="checkbox"
            id={switchId}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'block rounded-full bg-gray-200 transition-colors peer-checked:bg-primary-600',
              sizeStyles[size].switch
            )}
          />
          <div
            className={cn(
              'absolute left-0.5 top-0.5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-full',
              sizeStyles[size].dot,
              sizeStyles[size].translate
            )}
          />
        </div>
        {label && (
          <span className="ml-3 text-sm font-medium text-gray-700">
            {label}
          </span>
        )}
      </label>
      {error ? (
        <p className="mt-1 text-sm text-red-600" id={`${switchId}-error`}>
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-sm text-gray-500" id={`${switchId}-description`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
} 