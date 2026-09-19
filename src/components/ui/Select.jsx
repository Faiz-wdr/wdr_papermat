import React, { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  {
    id,
    label,
    options = [],
    error,
    helperText,
    required = false,
    className = '',
    selectClassName = '',
    children,
    ...props
  },
  ref
) {
  const selectId = id || props.name;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-[#222222] tracking-wide flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-desc` : undefined}
          className={`w-full h-10 px-3 bg-white text-[#222222] text-sm border rounded-lg transition-colors appearance-none pr-9 focus:outline-none cursor-pointer ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-[#E5E7EB] focus:border-[#358FFF] focus:ring-1 focus:ring-[#358FFF]'
          } disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${selectClassName}`}
          {...props}
        >
          {children ||
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>

        {/* Chevron down icon */}
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#6B7280]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error ? (
        <p id={`${selectId}-error`} className="text-xs text-red-600 mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${selectId}-desc`} className="text-xs text-[#6B7280] mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
