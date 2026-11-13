import React, { useState } from 'react';
import {
  ExternalLink,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sliders,
  CreditCard,
  Key,
  Globe,
  Layers,
  Users,
  FolderKanban,
  FileText,
} from 'lucide-react';
import { useAudit } from '../hooks/useAudit';

export const SettingsPage: React.FC = () => {
  const { auditLogs } = useAudit();
  const [activeTab, setActiveTab] = useState('Audit Logs');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const subNavItems = [
    { name: 'Project', icon: <FolderKanban className="w-4 h-4" /> },
    { name: 'API Access', icon: <Key className="w-4 h-4" /> },
    { name: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { name: 'Environments', icon: <Layers className="w-4 h-4" /> },
    { name: 'Content Stages', icon: <Sliders className="w-4 h-4" /> },
    { name: 'Locales', icon: <Globe className="w-4 h-4" /> },
    { name: 'Audit Logs', icon: <FileText className="w-4 h-4" /> },
    { name: 'Team Members', icon: <Users className="w-4 h-4" /> },
  ];

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.user.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.action.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.type.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'UPDATE':
      case 'SANITIZE':
        return 'text-blue-600 font-bold';
      case 'UNPUBLISH':
        return 'text-amber-600 font-bold';
      case 'PUBLISH':
      case 'CREATE':
        return 'text-emerald-600 font-bold';
      case 'DELETE':
      case 'REDACT':
        return 'text-rose-600 font-bold';
      default:
        return 'text-gray-600 font-bold';
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto w-full bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
      {/* ── Left Sub-Navigation (matching Reference 4) ── */}
      <aside className="w-full md:w-52 flex flex-col gap-1 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 pr-0 md:pr-6 pb-4 md:pb-0">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight px-3 mb-4">
          Settings
        </h2>

        {subNavItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setActiveTab(item.name)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-gray-100 text-gray-950 font-semibold'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </aside>

      {/* ── Main Settings Panel ── */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        {activeTab === 'Audit Logs' ? (
          <>
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Audit Logs
              </h1>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <span>
                  Monitor any changes made to your project, schema and content with audit logs.
                </span>
                <a
                  href="#learn-more"
                  onClick={(e) => e.preventDefault()}
                  className="text-indigo-600 hover:underline flex items-center gap-0.5 font-medium"
                >
                  Learn more <ExternalLink className="w-3 h-3 inline" />
                </a>
              </p>
            </div>

            {/* Filter Input */}
            <div className="relative max-w-md w-full">
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter logs by user, action, type..."
                className="w-full bg-gray-50 border border-gray-200/80 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Audit Table */}
            <div className="border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200/70 text-gray-500 font-medium">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Entity ID</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Environment</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                        onClick={() =>
                          setSelectedLogId(selectedLogId === log.id ? null : log.id)
                        }
                      >
                        {/* User */}
                        <td className="py-3.5 px-4 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-gray-300">
                            {log.user.initials}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="font-semibold text-gray-900 truncate">
                              {log.user.name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {log.user.role}
                            </span>
                          </div>
                        </td>

                        {/* Entity ID */}
                        <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">
                          {log.entityId}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4">
                          <span className={`text-[11px] tracking-wide ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4 text-gray-700 font-medium">
                          {log.type}
                        </td>

                        {/* Environment */}
                        <td className="py-3.5 px-4 text-gray-500">
                          {log.environment}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-right text-gray-500 font-mono text-[11px]">
                          {log.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer / Pagination matching Reference 4 */}
              <div className="bg-gray-50/60 border-t border-gray-200/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                <span>{filteredLogs.length} items</span>

                <div className="flex items-center gap-3">
                  <button
                    disabled
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <span className="font-medium text-gray-700">
                    Page <span className="font-bold">1</span> of 3
                  </span>
                  <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer font-medium">
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span>Show</span>
                  <select className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none">
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800">
              {activeTab} Management
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Local offline privacy engine active. Enterprise cloud synchronization and team administration can be configured in future releases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
