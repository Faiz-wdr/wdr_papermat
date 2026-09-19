import React from 'react';

export function StatCard({ label, value, subtext, icon: Icon, loading = false }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#358FFF] flex items-center justify-center">
            <Icon size={16} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-24 bg-gray-100 rounded animate-pulse"></div>
        ) : (
          <span className="text-2xl font-semibold text-[#222222] tracking-tight">
            {value}
          </span>
        )}
        {subtext && (
          <p className="text-xs text-[#6B7280] mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}
