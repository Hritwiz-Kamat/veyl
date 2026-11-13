import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/sidebar/AppSidebar';
import { BackendStatus } from '../components/ui/BackendStatus';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-gray-900 font-sans">
      {/* Persistent Left Sidebar */}
      <AppSidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Subtle Top Navigation / Status Header */}
        <header className="h-14 border-b border-gray-200/80 px-6 sm:px-8 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              AI Privacy Layer
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-medium text-gray-600">Local Processing</span>
          </div>

          <div className="flex items-center gap-4">
            <BackendStatus />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 sm:p-8 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
