import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/sidebar/AppSidebar';
import { BackendStatus } from '../components/ui/BackendStatus';
import { RAPITCompanion } from '../components/mascot/RAPITCompanion';
import { Lock } from 'lucide-react';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-[#F8F6F2] text-[#242424] font-sans">
      {/* Persistent Left Sidebar */}
      <AppSidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Subtle Top Navigation / Status Header */}
        <header className="h-14 border-b border-[#EAE5DF] px-6 sm:px-8 flex items-center justify-between bg-[#FAF8F5]/80 backdrop-blur-md sticky top-0 z-10 shrink-0 font-sans-ui">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#92908C] uppercase tracking-wider">
              RAPIT
            </span>
            <span className="text-[#D4CFC8]">/</span>
            <span className="text-xs font-medium text-[#6B6560] flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[#E78B55]" />
              Local Privacy Layer
            </span>
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

      {/* Global Application-Wide Animated RAPIT Mascot Companion Overlay */}
      <RAPITCompanion />
    </div>
  );
};
