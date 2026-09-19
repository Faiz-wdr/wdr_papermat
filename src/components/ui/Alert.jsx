import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) {
  const configs = {
    success: {
      bg: 'bg-green-50 border-green-200 text-green-900',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-900',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: Info,
      iconColor: 'text-[#358FFF]',
    },
  }[variant] || {
    bg: 'bg-gray-50 border-gray-200 text-gray-900',
    icon: Info,
    iconColor: 'text-gray-600',
  };

  const Icon = configs.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 border rounded-lg text-sm ${configs.bg} ${className}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${configs.iconColor}`} aria-hidden="true" />
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
