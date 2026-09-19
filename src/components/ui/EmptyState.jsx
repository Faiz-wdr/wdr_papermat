import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#E5E7EB] rounded-xl bg-white ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#358FFF] flex items-center justify-center mb-4">
          <Icon size={24} aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[#222222] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#6B7280] max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="primary"
          onClick={onAction}
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
