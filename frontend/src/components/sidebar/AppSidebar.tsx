import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Home,
  History,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Lock,
} from 'lucide-react';

interface AppSidebarProps {
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-[#FAF8F5] border-r border-[#EAE5DF] h-screen sticky top-0 flex flex-col justify-between select-none shrink-0 transition-all duration-300 z-20 ${
        collapsed ? 'w-16 p-3' : 'w-60 p-4'
      } ${className}`}
    >
      {/* Top Branding & Primary Actions */}
      <div className="flex flex-col gap-5">
        {/* Brand header */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-1.5 pt-1'}`}>
          {!collapsed && (
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#E78B55]/10 border border-[#E78B55]/20 flex items-center justify-center p-0.5 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                <img src="/favicon.png" alt="RAPIT" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif-heading font-normal tracking-wider text-xl text-[#242424]">
                  RAPIT
                </span>
                <span className="text-[10px] font-sans-ui text-[#92908C] -mt-1 tracking-tight">
                  Privacy Layer
                </span>
              </div>
            </div>
          )}

          {collapsed && (
            <div
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-lg bg-[#E78B55]/10 border border-[#E78B55]/20 flex items-center justify-center p-1 cursor-pointer hover:scale-105 transition-transform"
              title="RAPIT Privacy Layer"
            >
              <img src="/favicon.png" alt="RAPIT" className="w-full h-full object-contain" />
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 text-[#92908C] hover:text-[#242424] rounded-lg hover:bg-[#EFECE6] transition-colors cursor-pointer"
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Action Button: New Scan */}
        <button
          onClick={() => navigate('/scan')}
          className={`w-full bg-[#242424] hover:bg-black active:scale-[0.98] text-white text-xs font-sans-ui font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
            collapsed ? 'p-2.5' : 'py-2.5 px-3'
          }`}
          title="Start New Scan"
        >
          <PlusCircle className="w-4 h-4 text-[#E78B55] shrink-0" />
          {!collapsed && <span>New Scan</span>}
        </button>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 mt-1 font-sans-ui">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2'
              } ${
                isActive
                  ? 'bg-[#EFECE6] text-[#242424] font-semibold'
                  : 'text-[#6B6560] hover:bg-[#F3EFEA] hover:text-[#242424]'
              }`
            }
            title="Home"
          >
            <Home className="w-4 h-4 shrink-0 text-[#92908C]" />
            {!collapsed && <span>Home</span>}
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2'
              } ${
                isActive
                  ? 'bg-[#EFECE6] text-[#242424] font-semibold'
                  : 'text-[#6B6560] hover:bg-[#F3EFEA] hover:text-[#242424]'
              }`
            }
            title="Scan History"
          >
            <History className="w-4 h-4 shrink-0 text-[#92908C]" />
            {!collapsed && <span>History</span>}
          </NavLink>
        </nav>
      </div>

      {/* Bottom Section: Privacy Status, Settings & User Profile */}
      <div className="flex flex-col gap-2 pt-3 border-t border-[#EAE5DF] font-sans-ui">
        {!collapsed && (
          <div className="px-2 py-1.5 rounded-lg bg-[#F3EFEA] flex items-center gap-2 text-[11px] text-[#6B6560]">
            <Lock className="w-3 h-3 text-[#E78B55] shrink-0" />
            <span className="truncate">Local Privacy Active</span>
          </div>
        )}

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2'
            } ${
              isActive
                ? 'bg-[#EFECE6] text-[#242424] font-semibold'
                : 'text-[#6B6560] hover:bg-[#F3EFEA] hover:text-[#242424]'
            }`
          }
          title="Settings"
        >
          <Settings className="w-4 h-4 shrink-0 text-[#92908C]" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {/* User Workspace Info */}
        <div
          className={`flex items-center rounded-xl transition-colors ${
            collapsed ? 'justify-center py-2' : 'gap-2.5 px-2.5 py-2'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-[#E78B55]/15 text-[#E78B55] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#E78B55]/30">
            A
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-medium text-[#242424] truncate">
                Workspace
              </span>
              <span className="text-[10px] text-[#92908C]">
                Private Sandbox
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
