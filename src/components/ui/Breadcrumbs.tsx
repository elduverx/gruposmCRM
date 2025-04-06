import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

export default function Breadcrumbs({
  items,
  className,
  separator = <ChevronRightIcon className="h-4 w-4 text-gray-400" />,
}: BreadcrumbsProps) {
  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <div>
            <Link
              href="/"
              className="text-gray-400 hover:text-gray-500"
            >
              <HomeIcon className="h-5 w-5" />
              <span className="sr-only">Inicio</span>
            </Link>
          </div>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <div className="flex items-center">
              {separator}
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    'ml-2 text-sm font-medium',
                    index === items.length - 1
                      ? 'text-gray-500'
                      : 'text-gray-400 hover:text-gray-500'
                  )}
                >
                  {item.icon && (
                    <span className="mr-2 h-4 w-4">{item.icon}</span>
                  )}
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'ml-2 text-sm font-medium text-gray-500',
                    item.icon && 'flex items-center'
                  )}
                >
                  {item.icon && (
                    <span className="mr-2 h-4 w-4">{item.icon}</span>
                  )}
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
} 