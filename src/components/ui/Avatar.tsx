import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
  className?: string;
}

export default function Avatar({
  src,
  alt = '',
  size = 'md',
  fallback,
  className,
}: AvatarProps) {
  const sizeStyles = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderContent = () => {
    if (src) {
      return (
        <img
          src={src}
          alt={alt}
          className="h-full w-full rounded-full object-cover"
        />
      );
    }

    if (fallback) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary-100 text-primary-600">
          {getInitials(fallback)}
        </div>
      );
    }

    return (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600">
        <svg
          className="h-1/2 w-1/2"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
    );
  };

  return (
    <div className={cn('relative inline-block', sizeStyles[size], className)}>
      {renderContent()}
    </div>
  );
} 