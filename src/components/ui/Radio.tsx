import React from 'react';
import { cn } from '@/lib/utils';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: RadioOption[];
  fullWidth?: boolean;
  name: string;
}

export default function Radio({
  label,
  error,
  helperText,
  options,
  fullWidth = false,
  className,
  name,
  id,
  ...props
}: RadioProps) {
  const radioGroupId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('space-y-1', fullWidth && 'w-full')}>
      {label && (
        <label
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="mt-2 space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              id={`${radioGroupId}-${option.value}`}
              name={name}
              type="radio"
              value={option.value}
              className={cn(
                'h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500',
                error && 'border-red-300 text-red-600 focus:ring-red-500',
                className
              )}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? `${radioGroupId}-error` : helperText ? `${radioGroupId}-description` : undefined}
              {...props}
            />
            <label
              htmlFor={`${radioGroupId}-${option.value}`}
              className="ml-2 block text-sm text-gray-700"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {error ? (
        <p className="mt-1 text-sm text-red-600" id={`${radioGroupId}-error`}>
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-sm text-gray-500" id={`${radioGroupId}-description`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
} 