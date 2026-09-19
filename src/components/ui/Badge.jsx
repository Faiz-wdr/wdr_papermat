import React from 'react';

export function Badge({
  children,
  variant = 'default',
  size = 'normal',
  className = '',
}) {
  const baseClasses = 'inline-flex items-center font-medium rounded-md tracking-wide';

  const sizeClasses = {
    normal: 'text-xs px-2.5 py-1',
    compact: 'text-[11px] px-2 py-0.5',
  }[size] || 'text-xs px-2.5 py-1';

  const variantClasses = {
    active: 'bg-green-50 text-green-700 border border-green-200',
    inactive: 'bg-gray-100 text-gray-600 border border-gray-200',
    issued: 'bg-blue-50 text-blue-700 border border-blue-200',
    paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    draft: 'bg-amber-50 text-amber-700 border border-amber-200',
    default: 'bg-gray-50 text-gray-700 border border-gray-200',
  }[variant] || 'bg-gray-50 text-gray-700 border border-gray-200';

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}
