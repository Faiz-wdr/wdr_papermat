import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    id,
    label,
    type = 'text',
    error,
    helperText,
    required = false,
    className = '',
    inputClassName = '',
    icon: Icon,
    ...props
  },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[#222222] tracking-wide flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-[#6B7280]">
            <Icon size={18} aria-hidden="true" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
          className={`w-full h-10 px-3 ${Icon ? 'pl-10' : ''} bg-white text-[#222222] text-sm border rounded-lg transition-colors placeholder:text-[#9CA3AF] focus:outline-none ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-[#E5E7EB] focus:border-[#358FFF] focus:ring-1 focus:ring-[#358FFF]'
          } disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${inputClassName}`}
          {...props}
        />
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-600 mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-desc`} className="text-xs text-[#6B7280] mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
