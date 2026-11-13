import { useState } from 'react';
import { Copy, Check, AlertTriangle, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import type { SanitizeResponse } from '../../types';

interface SanitizedOutputViewProps {
  originalText: string;
  sanitizeResult: SanitizeResponse;
  onEditSelection: () => void;
  onNewScan: () => void;
}

export function SanitizedOutputView({
  originalText,
  sanitizeResult,
  onEditSelection,
  onNewScan,
}: SanitizedOutputViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sanitized' | 'comparison'>('sanitized');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sanitizeResult.sanitized_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Status banner */}
      {sanitizeResult.has_unredacted_credentials ? (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-200 text-xs flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-rose-300">Warning: Unredacted Credentials!</span>
            <p className="text-rose-200/80 leading-relaxed">
              One or more high-risk credentials were intentionally left unmasked. Do not copy this into an untrusted AI model.
            </p>
          </div>
        </div>
      ) : !sanitizeResult.all_sanitized ? (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Partially sanitized: {sanitizeResult.skipped_count} finding(s) were excluded from redaction.</span>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>All detected sensitive entities were sanitized successfully. Ready for external AI copy!</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('sanitized')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'sanitized'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sanitized Output
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Side-by-Side Comparison
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditSelection}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Edit Findings
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Sanitized Text
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'sanitized' ? (
        <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed min-h-[140px] max-h-96 overflow-y-auto">
          {sanitizeResult.sanitized_text}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400">Original Prompt</span>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 font-mono text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed min-h-[140px] max-h-96 overflow-y-auto">
              {originalText}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-violet-300">Sanitized Prompt</span>
            <div className="rounded-xl border border-violet-900/40 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed min-h-[140px] max-h-96 overflow-y-auto">
              {sanitizeResult.sanitized_text}
            </div>
          </div>
        </div>
      )}

      {/* Footer action */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNewScan}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Start New Analysis
        </button>
      </div>
    </div>
  );
}
