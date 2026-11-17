import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Trash2,
  HardDrive,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { useAudit } from '../hooks/useAudit';

export const SettingsPage: React.FC = () => {
  const { auditLogs } = useAudit();
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'audit'>('general');
  const [clearSuccess, setClearSuccess] = useState(false);

  const handleClearHistory = () => {
    localStorage.removeItem('rapit_recent_sessions');
    sessionStorage.removeItem('rapit_current_session');
    setClearSuccess(true);
    setTimeout(() => setClearSuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="border-b border-[#EAE6DF] pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#242424] tracking-tight">
          Settings
        </h1>
        <p className="text-xs text-[#6B6560] mt-1">
          Manage local privacy engine policies, storage, and redaction defaults.
        </p>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EFECE6] w-fit text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-white text-[#242424] font-semibold shadow-2xs'
              : 'text-[#6B6560] hover:text-[#242424]'
          }`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-white text-[#242424] font-semibold shadow-2xs'
              : 'text-[#6B6560] hover:text-[#242424]'
          }`}
        >
          Privacy & Storage
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-white text-[#242424] font-semibold shadow-2xs'
              : 'text-[#6B6560] hover:text-[#242424]'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* ── General Preferences ── */}
      {activeTab === 'general' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#242424]">
              <Sliders className="w-4 h-4 text-[#E78B55]" />
              <span>Redaction Format</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="p-3 rounded-xl border border-[#F6D5C2] bg-[#FEF7F2]/40 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="replacement_style"
                  defaultChecked
                  className="mt-0.5 text-[#E78B55] focus:ring-[#E78B55]"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-[#242424]">Semantic Tokens</span>
                  <span className="text-[#9C9790] text-[11px] mt-0.5">
                    e.g. [PERSON_1], [EMAIL_ADDRESS_1]
                  </span>
                </div>
              </label>

              <label className="p-3 rounded-xl border border-[#EAE6DF] hover:border-[#D4CFC8] flex items-start gap-2.5 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="replacement_style"
                  className="mt-0.5 text-[#E78B55] focus:ring-[#E78B55]"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-[#242424]">Solid Block Mask</span>
                  <span className="text-[#9C9790] text-[11px] mt-0.5">
                    e.g. ██████████
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#242424]">
                Strict Credential Redaction
              </span>
              <span className="text-[11px] text-[#9C9790] mt-0.5">
                Automatically mark OpenAI, AWS, and database tokens as non-optional.
              </span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-[#D4CFC8] text-[#E78B55] focus:ring-[#E78B55] w-4 h-4"
            />
          </div>
        </div>
      )}

      {/* ── Privacy & Storage ── */}
      {activeTab === 'privacy' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#242424]">
              <Shield className="w-4 h-4 text-[#4CAF7D]" />
              <span>Local Isolation Guarantee</span>
            </div>
            <p className="text-xs text-[#6B6560] leading-relaxed">
              RAPIT operates entirely in your browser and on your local machine backend (localhost).
              None of your unredacted prompts, OCR images, or sensitive documents are transmitted to
              third-party cloud services or telemetry databases.
            </p>
          </div>

          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-center text-[#9C9790]">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#242424]">
                  Clear Local Scan Cache
                </span>
                <span className="text-[11px] text-[#9C9790]">
                  Erase stored session records and cached redaction artifacts.
                </span>
              </div>
            </div>

            <button
              onClick={handleClearHistory}
              className="px-3.5 py-1.5 rounded-xl border border-[#EAE6DF] hover:border-[#E05252] text-[#E05252] hover:bg-[#FEF2F2] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {clearSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cleared!</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cache</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Audit Logs ── */}
      {activeTab === 'audit' && (
        <div className="border border-[#EAE6DF] rounded-2xl overflow-hidden shadow-xs bg-white">
          <div className="p-4 border-b border-[#F0EDE8] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#E78B55]" />
            <span className="text-xs font-semibold text-[#242424]">
              Audit Trail ({auditLogs.length} events)
            </span>
          </div>

          <div className="divide-y divide-[#F0EDE8]">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-[#FAF8F5] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[10px] text-[#E78B55] bg-[#FEF7F2] border border-[#F6D5C2] px-1.5 py-0.5 rounded font-semibold">
                    {log.action}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-[#242424] truncate">
                      {log.details || log.type}
                    </span>
                    <span className="text-[10px] text-[#9C9790] font-mono">
                      {log.entityId}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-[#9C9790] font-mono shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
