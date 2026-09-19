import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  Package,
  Settings,
  LogOut,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const { user, signOut } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', path: '/invoices', icon: ReceiptText },
    { name: 'Items', path: '/items', icon: Package },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-64 bg-white border-r border-[#E5E7EB] h-screen sticky top-0 shrink-0 select-none"
      aria-label="Sidebar navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB] gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#358FFF] text-white flex items-center justify-center shrink-0">
          <Store size={18} aria-hidden="true" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm text-[#222222] truncate">
            Wandoor Paper Mart
          </span>
          <span className="text-[11px] text-[#6B7280] font-normal truncate">
            School & Office Stationery
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#358FFF]'
                    : 'text-[#6B7280] hover:text-[#222222] hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={isActive ? 'text-[#358FFF]' : 'text-[#6B7280]'}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User / Sign Out Footer */}
      <div className="p-3 border-t border-[#E5E7EB]">
        <div className="px-3 py-2 flex items-center justify-between rounded-lg bg-gray-50">
          <div className="flex flex-col min-w-0 mr-2">
            <span className="text-xs font-semibold text-[#222222] truncate">
              Shop Staff
            </span>
            <span className="text-[11px] text-[#6B7280] truncate" title={user?.email}>
              {user?.email || 'Logged in'}
            </span>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out of application"
            className="w-8 h-8 flex items-center justify-center rounded-md text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
