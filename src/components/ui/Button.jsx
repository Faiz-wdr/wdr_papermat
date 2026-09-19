import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'normal',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  'aria-label': ariaLabel,
  ...props
}) {
  // Base classes: 8px border radius, transition, accessible focus outline
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#358FFF] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none rounded-lg text-sm';

  // Sizing
  const sizeClasses = {
    normal: 'h-10 px-4 gap-2',
    compact: 'h-9 px-3 gap-1.5 text-xs',
    large: 'h-11 px-5 gap-2 text-base',
    icon: 'w-10 h-10 p-0',
    iconCompact: 'w-9 h-9 p-0',
  }[size] || 'h-10 px-4 gap-2';

  // Variants
  const variantClasses = {
    primary: 'bg-[#358FFF] hover:bg-[#2572D6] text-white active:bg-[#1E6FD9] border border-transparent shadow-xs',
    secondary: 'bg-white hover:bg-gray-50 text-[#222222] border border-[#E5E7EB] active:bg-gray-100',
    danger: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 active:bg-red-200',
    ghost: 'bg-transparent hover:bg-gray-100 text-[#222222] active:bg-gray-200',
  }[variant] || 'bg-[#358FFF] text-white';

  const iconSize = size === 'compact' || size === 'iconCompact' ? 16 : 18;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={iconSize} aria-hidden="true" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={iconSize} aria-hidden="true" />}
        </>
      )}
    </button>
  );
}
