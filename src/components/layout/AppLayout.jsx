import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-[#222222]">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Mobile Top Header & Bottom Nav */}
      <MobileNav />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8 focus:outline-none"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
