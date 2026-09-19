import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  Package,
  Settings,
  Store,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function MobileNav() {
  const { signOut } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', path: '/invoices', icon: ReceiptText },
    { name: 'Items', path: '/items', icon: Package },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E5E7EB] h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#358FFF] text-white flex items-center justify-center">
            <Store size={16} aria-hidden="true" />
          </div>
          <span className="font-semibold text-sm text-[#222222]">
            Wandoor Paper Mart
          </span>
        </div>

        <button
          type="button"
          onClick={signOut}
          aria-label="Sign out"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-red-600 hover:bg-gray-50 cursor-pointer"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </header>

      {/* Mobile Bottom Fixed Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] h-16 flex items-center justify-around px-2 pb-safe"
        aria-label="Mobile bottom navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-[#358FFF]' : 'text-[#6B7280] hover:text-[#222222]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-md transition-colors ${
                      isActive ? 'bg-[#EFF6FF]' : ''
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <span className="mt-0.5">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
