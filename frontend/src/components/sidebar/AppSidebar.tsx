import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Folder,
  Settings,
  Sliders,
  Info,
  Sparkles,
  PanelLeftClose,
  FileText,
  FileCheck2,
  Scan,
  LogOut,
  FolderPlus,
} from 'lucide-react';

interface AppSidebarProps {
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  const workspaceProjects = [
    { name: 'New Project', path: '/', isPrimary: true },
    { name: 'Pricing Section', path: '/scan?mode=text' },
    { name: 'Design Guidelines', path: '/scan?mode=image' },
    { name: 'Design Brief', path: '/scan?mode=pdf' },
    { name: 'Marketing', path: '/document-output' },
  ];

  return (
    <aside
      className={`w-64 bg-[#fbfbfb] border-r border-gray-200/80 h-screen sticky top-0 flex flex-col justify-between p-4 select-none shrink-0 text-gray-700 ${className}`}
    >
      {/* Top Branding & Quick Actions */}
      <div className="flex flex-col gap-4">
        {/* Brand header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="font-extrabold tracking-widest text-xl text-gray-950 font-mono">
              RAPIT
            </span>
          </div>
          <button
            title="Toggle panel"
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* 3 small helper icons under brand */}
        <div className="flex items-center gap-1 px-1 text-gray-400">
          <button
            title="Adjust policies"
            onClick={() => navigate('/settings')}
            className="p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            title="Privacy Engine info"
            onClick={() => navigate('/settings')}
            className="p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <button
            title="AI Privacy Layer"
            onClick={() => navigate('/')}
            className="p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => navigate('/scan')}
          className="w-full bg-[#18181b] hover:bg-black text-white text-xs font-medium py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-zinc-300" />
          <span>New Chat</span>
        </button>

        {/* Workspace section */}
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-gray-400 tracking-wider">
            <span>Workspace</span>
            <FolderPlus className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700 cursor-pointer" />
          </div>

          <div className="flex flex-col gap-0.5 mt-1">
            {workspaceProjects.map((project) => (
              <NavLink
                key={project.name}
                to={project.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-gray-200/70 text-gray-950 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                  }`
                }
              >
                <Folder className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{project.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Views & Outputs Navigation */}
        <div className="flex flex-col gap-1 mt-3">
          <div className="px-2 text-[11px] font-semibold text-gray-400 tracking-wider">
            <span>Views & Outputs</span>
          </div>

          <div className="flex flex-col gap-0.5 mt-1">
            <NavLink
              to="/scan"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-gray-200/70 text-gray-950 font-semibold shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                }`
              }
            >
              <Scan className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Interactive Scanner</span>
            </NavLink>

            <NavLink
              to="/text-output"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-gray-200/70 text-gray-950 font-semibold shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                }`
              }
            >
              <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Text Masking Output</span>
            </NavLink>

            <NavLink
              to="/document-output"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-gray-200/70 text-gray-950 font-semibold shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                }`
              }
            >
              <FileCheck2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Doc & Image Output</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Bottom section: Settings & User Profile */}
      <div className="flex flex-col gap-2 pt-3 border-t border-gray-200/70">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
              isActive
                ? 'bg-gray-200/70 text-gray-950 font-semibold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
          }
        >
          <Settings className="w-4 h-4 text-gray-400" />
          <span>Settings</span>
        </NavLink>

        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-100 font-semibold text-xs flex items-center justify-center shrink-0">
              K
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-gray-800 truncate">
                Elizabeth Keen
              </span>
              <span className="text-[10px] text-gray-400">Workspace Owner</span>
            </div>
          </div>
          <button
            title="Log out"
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
