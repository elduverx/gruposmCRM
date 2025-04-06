'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export default function Tabs({
  tabs,
  defaultTab,
  onChange,
  className,
  variant = 'default',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const variantStyles = {
    default: {
      container: 'border-b border-gray-200',
      tab: (isActive: boolean) =>
        cn(
          'border-b-2 py-4 px-1 text-sm font-medium',
          isActive
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        ),
    },
    pills: {
      container: 'space-x-2',
      tab: (isActive: boolean) =>
        cn(
          'rounded-md px-3 py-2 text-sm font-medium',
          isActive
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
        ),
    },
    underline: {
      container: 'border-b border-gray-200',
      tab: (isActive: boolean) =>
        cn(
          'border-b-2 py-4 px-1 text-sm font-medium',
          isActive
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        ),
    },
  };

  return (
    <div className={className}>
      <div className={cn('flex', variantStyles[variant].container)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            className={cn(
              variantStyles[variant].tab(activeTab === tab.id),
              'flex items-center space-x-2 focus:outline-none',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={tab.disabled}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.icon && <span className="h-5 w-5">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`tabpanel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
} 