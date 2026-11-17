import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  FileText,
  ImageIcon,
  FileCode,
  ShieldCheck,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { useAudit } from '../hooks/useAudit';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { recentSessions, setCurrentMaskingSession } = useAudit();

  const handleSelectSession = (session: (typeof recentSessions)[0]) => {
    setCurrentMaskingSession(session);
    if (session.fileType === 'text') {
      navigate('/text-output');
    } else {
      navigate('/document-output');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-[#E78B55]" />
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#242424] tracking-tight">
              Scan History
            </h1>
          </div>
          <p className="text-xs text-[#6B6560] mt-1">
            Review previous local privacy scans, redactions, and sanitized records.
          </p>
        </div>

        <button
          onClick={() => navigate('/scan')}
          className="px-4 py-2 rounded-xl bg-[#E78B55] hover:bg-[#D47A47] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Scan</span>
        </button>
      </div>

      {/* ── Sessions List or Empty State ── */}
      {recentSessions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-center text-[#9C9790]">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#242424]">
            No scans yet
          </h3>
          <p className="text-xs text-[#9C9790] max-w-xs">
            Start your first privacy scan by pasting a prompt or uploading a document.
          </p>
          <button
            onClick={() => navigate('/scan')}
            className="mt-2 px-4 py-2 rounded-xl bg-[#242424] hover:bg-[#181818] text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            Start Scan
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recentSessions.map((session) => {
            const isText = session.fileType === 'text';
            const isPdf = session.fileType === 'pdf';
            const title =
              session.originalFileName ||
              (session.originalText
                ? session.originalText.slice(0, 50) + (session.originalText.length > 50 ? '...' : '')
                : 'Masking Session');
            const appliedCount = session.sanitizeResult?.applied_count ?? session.findings.length;

            return (
              <div
                key={session.sessionId}
                onClick={() => handleSelectSession(session)}
                className="bg-white border border-[#EAE6DF] hover:border-[#D4CFC8] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-center text-[#E78B55] shrink-0 group-hover:scale-105 transition-transform">
                    {isPdf ? (
                      <FileText className="w-4 h-4" />
                    ) : isText ? (
                      <FileCode className="w-4 h-4" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[#242424] truncate group-hover:text-[#E78B55] transition-colors">
                      {title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#9C9790]">
                      <span className="capitalize">{session.fileType}</span>
                      <span>·</span>
                      <span>{session.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0FAF4] border border-[#C6EBD3] text-[#166534] text-[11px] font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4CAF7D]" />
                    <span>{appliedCount} masked</span>
                  </div>

                  <div className="p-1.5 rounded-lg text-[#9C9790] group-hover:text-[#242424] group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
