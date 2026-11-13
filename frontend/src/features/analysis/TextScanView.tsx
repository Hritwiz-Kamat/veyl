import { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, Search, RefreshCw, CheckSquare, Square, Shield } from 'lucide-react';
import { analyzeText, sanitizeSession, deleteSession } from '../../services/api';
import type { Finding, SanitizeResponse } from '../../types';
import { SanitizedOutputView } from '../sanitization/SanitizedOutputView';

export function TextScanView() {
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(new Set());
  const [sanitizeResult, setSanitizeResult] = useState<SanitizeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const samplePrompt =
    "Hello, my name is Alice Smith and my email is alice@example.com. My OpenAI key is sk-live1234567890abcdefghijklmnopqrstuvwxyz. Please help me refactor my server at 192.168.1.50.";

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsScanning(true);
    setErrorMessage(null);
    setSanitizeResult(null);

    try {
      const response = await analyzeText({ text: inputText });
      setSessionId(response.session_id);
      setFindings(response.findings);
      // Pre-select all findings by default
      const defaultSelected = new Set(
        response.findings.filter((f) => f.selected_by_default).map((f) => f.id)
      );
      setSelectedFindingIds(defaultSelected);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze text. Please ensure backend is running.';
      setErrorMessage(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleFinding = (id: string) => {
    setSelectedFindingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!findings) return;
    setSelectedFindingIds(new Set(findings.map((f) => f.id)));
  };

  const handleDeselectAll = () => {
    setSelectedFindingIds(new Set());
  };

  const handleApplySanitization = async () => {
    if (!sessionId) return;

    setIsSanitizing(true);
    setErrorMessage(null);

    try {
      const result = await sanitizeSession(sessionId, {
        approved_finding_ids: Array.from(selectedFindingIds),
      });
      setSanitizeResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sanitization failed. Session may have expired.';
      setErrorMessage(msg);
    } finally {
      setIsSanitizing(false);
    }
  };

  const handleReset = async () => {
    if (sessionId) {
      try {
        await deleteSession(sessionId);
      } catch {
        // Ignore session cleanup errors
      }
    }
    setInputText('');
    setSessionId(null);
    setFindings(null);
    setSelectedFindingIds(new Set());
    setSanitizeResult(null);
    setErrorMessage(null);
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-zinc-700/30 text-zinc-400 border-zinc-700';
    }
  };

  const unselectedCriticalCount =
    findings?.filter(
      (f) => f.severity === 'critical' && !selectedFindingIds.has(f.id)
    ).length ?? 0;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-5">
      {/* If sanitization result is ready, display SanitizedOutputView */}
      {sanitizeResult !== null ? (
        <SanitizedOutputView
          originalText={inputText}
          sanitizeResult={sanitizeResult}
          onEditSelection={() => setSanitizeResult(null)}
          onNewScan={handleReset}
        />
      ) : (
        <>
          {/* Input Form */}
          <form onSubmit={handleScan} className="flex flex-col gap-3">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste prompt or text to analyze for PII and credentials..."
                rows={4}
                disabled={isScanning || isSanitizing}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-y min-h-[110px]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setInputText(samplePrompt);
                  setFindings(null);
                  setSanitizeResult(null);
                }}
                className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Load sample prompt with PII & secrets
              </button>

              <div className="flex items-center gap-2">
                {findings !== null && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isScanning || isSanitizing || !inputText.trim()}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-white transition-all shadow-sm hover:shadow-violet-500/25 flex items-center gap-2 cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      Scan Text
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error state */}
          {errorMessage && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Review & Findings Approval Panel */}
          {findings !== null && (
            <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-zinc-100">Review & Approve Transformations</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-zinc-600">·</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 ml-1">
                    {selectedFindingIds.size} / {findings.length} approved
                  </span>
                </div>
              </div>

              {/* Warning if critical secrets were unchecked */}
              {unselectedCriticalCount > 0 && (
                <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>
                    Warning: {unselectedCriticalCount} critical credential(s) left unapproved. They will NOT be redacted!
                  </span>
                </div>
              )}

              {findings.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-center text-zinc-400">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                  <p className="text-sm font-medium text-zinc-200">No sensitive entities found</p>
                  <p className="text-xs text-zinc-500">The provided text did not trigger any PII or secret recognizers.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {findings.map((f) => {
                    const snippet = inputText.slice(f.start, f.end);
                    const isSelected = selectedFindingIds.has(f.id);
                    return (
                      <div
                        key={f.id}
                        onClick={() => handleToggleFinding(f.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs select-none ${
                          isSelected
                            ? 'bg-zinc-950/80 border-violet-800/40'
                            : 'bg-zinc-950/30 border-zinc-800/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-violet-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getSeverityBadgeClass(
                              f.severity
                            )}`}
                          >
                            {f.severity.toUpperCase()}
                          </span>
                          <span className="font-mono text-zinc-300 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                            {f.entity_type}
                          </span>
                          <span className="text-zinc-400 font-mono truncate max-w-xs" title={snippet}>
                            "{snippet}"
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                          <span className="text-zinc-500">→</span>
                          <span className="font-mono text-violet-300 bg-violet-950/60 border border-violet-800/50 px-2 py-0.5 rounded">
                            {f.replacement}
                          </span>
                          {f.confidence !== null && (
                            <span className="text-[10px] text-zinc-500" title="Detector confidence">
                              {Math.round(f.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sanitize Action Button */}
              {findings.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span className="text-xs text-zinc-500">
                    Only checked items will be replaced. Unchecked text remains unchanged.
                  </span>
                  <button
                    type="button"
                    onClick={handleApplySanitization}
                    disabled={isSanitizing}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-medium text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSanitizing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Sanitizing...
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5" />
                        Apply Sanitization (M4)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
