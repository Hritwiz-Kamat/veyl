import { useState } from 'react';
import {
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Download,
  ImageIcon,
  FileText,
  Bot,
  Send,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { SanitizeResponse, HandoffPrepareResponse, HandoffSendResponse } from '../../types';
import { prepareHandoff, sendHandoff } from '../../services/api';

interface SanitizedOutputViewProps {
  sessionId?: string | null;
  originalText: string;
  sanitizeResult: SanitizeResponse;
  fileType?: string;
  onEditSelection: () => void;
  onNewScan: () => void;
}

export function SanitizedOutputView({
  sessionId,
  originalText,
  sanitizeResult,
  fileType = 'text',
  onEditSelection,
  onNewScan,
}: SanitizedOutputViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sanitized' | 'comparison'>('sanitized');

  // M8 Handoff states
  const [targetDestination, setTargetDestination] = useState<string | null>(null);
  const [handoffPreview, setHandoffPreview] = useState<HandoffPrepareResponse | null>(null);
  const [handoffConfirmed, setHandoffConfirmed] = useState(false);
  const [isHandoffLoading, setIsHandoffLoading] = useState(false);
  const [handoffResult, setHandoffResult] = useState<HandoffSendResponse | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sanitizeResult.sanitized_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrepareHandoff = async (destination: string) => {
    if (!sessionId) return;
    setTargetDestination(destination);
    setIsHandoffLoading(true);
    setHandoffError(null);
    setHandoffResult(null);
    setHandoffConfirmed(false);

    try {
      const preview = await prepareHandoff({
        session_id: sessionId,
        destination,
      });
      setHandoffPreview(preview);
    } catch (err) {
      setHandoffError(err instanceof Error ? err.message : 'Failed to prepare handoff.');
    } finally {
      setIsHandoffLoading(false);
    }
  };

  const handleSendHandoff = async () => {
    if (!sessionId || !targetDestination) return;
    setIsHandoffLoading(true);
    setHandoffError(null);

    try {
      const result = await sendHandoff({
        session_id: sessionId,
        destination: targetDestination,
        confirmed: true,
      });
      setHandoffResult(result);
      setHandoffPreview(null);
    } catch (err) {
      setHandoffError(err instanceof Error ? err.message : 'Handoff dispatch failed.');
    } finally {
      setIsHandoffLoading(false);
    }
  };

  const artifactUrl = sanitizeResult.artifact_download_url
    ? `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}${sanitizeResult.artifact_download_url.replace('/api/v1', '')}`
    : null;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Status banner */}
      {sanitizeResult.has_unredacted_credentials ? (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-200 text-xs flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-rose-300">Warning: Unredacted Credentials!</span>
            <p className="text-rose-200/80 leading-relaxed">
              One or more high-risk credentials were intentionally left unmasked. Do not share this content externally.
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
          <span>All selected sensitive entities were sanitized successfully.</span>
        </div>
      )}

      {/* Artifact Download Banner for Images and PDFs */}
      {artifactUrl && (
        <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-950/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-violet-200">
            {fileType === 'pdf' ? (
              <FileText className="w-5 h-5 text-violet-400 shrink-0" />
            ) : (
              <ImageIcon className="w-5 h-5 text-violet-400 shrink-0" />
            )}
            <div>
              <span className="font-semibold block text-zinc-100">
                {fileType === 'pdf' ? 'Redacted PDF Document Ready' : 'Redacted Image Artifact Ready'}
              </span>
              <span className="text-zinc-400">
                {fileType === 'pdf'
                  ? 'Approved text & vector elements were permanently purged and verified.'
                  : 'Pixels were permanently masked with Pillow; EXIF metadata stripped.'}
              </span>
            </div>
          </div>
          <a
            href={artifactUrl}
            download={fileType === 'pdf' ? 'sanitized_document.pdf' : 'sanitized_image.png'}
            className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {fileType === 'pdf' ? 'Download Redacted PDF' : 'Download Masked Image'}
          </a>
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
            Comparison
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
          {sanitizeResult.sanitized_text && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border border-zinc-700"
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
          )}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'sanitized' ? (
        <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed min-h-[120px] max-h-96 overflow-y-auto">
          {sanitizeResult.sanitized_text || (artifactUrl ? 'Image redaction complete. See download button above.' : '')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400">
              {fileType === 'image' ? 'Original OCR Text' : 'Original Text'}
            </span>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 font-mono text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed min-h-[120px] max-h-96 overflow-y-auto">
              {originalText || '(No OCR text extracted)'}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-violet-300">Sanitized Text</span>
            <div className="rounded-xl border border-violet-900/40 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed min-h-[120px] max-h-96 overflow-y-auto">
              {sanitizeResult.sanitized_text || '(Image pixels redacted)'}
            </div>
          </div>
        </div>
      )}

      {/* ── M8 Demo Handoff Section ─────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-zinc-200">AI Handoff (M8 Demo)</span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Manual copy or confirmed dispatch to a mock provider
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {sanitizeResult.sanitized_text && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-violet-400" />
              {copied ? 'Copied to Clipboard!' : 'Manual Copy (All Providers)'}
            </button>
          )}

          {sessionId && sanitizeResult.sanitized_text && (
            <>
              <button
                type="button"
                onClick={() => handlePrepareHandoff('mock-chatgpt')}
                disabled={isHandoffLoading}
                className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                Mock ChatGPT
              </button>
              <button
                type="button"
                onClick={() => handlePrepareHandoff('mock-claude')}
                disabled={isHandoffLoading}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                Mock Claude
              </button>
              <button
                type="button"
                onClick={() => handlePrepareHandoff('mock-cursor')}
                disabled={isHandoffLoading}
                className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                Mock Cursor
              </button>
            </>
          )}
        </div>

        {/* Handoff Error */}
        {handoffError && (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{handoffError}</span>
          </div>
        )}

        {/* Confirmation Modal / Drawer */}
        {handoffPreview && (
          <div className="p-4 rounded-xl border border-violet-500/40 bg-zinc-950/90 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-violet-400" />
                Confirm External Handoff: {handoffPreview.destination_name}
              </span>
              <button
                type="button"
                onClick={() => setHandoffPreview(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>

            {handoffPreview.warning && (
              <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{handoffPreview.warning}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400">Exact payload to be transmitted:</span>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900 font-mono text-[11px] text-zinc-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {handoffPreview.sanitized_content}
              </div>
              <span className="text-[10px] text-zinc-500">
                Payload Size: {handoffPreview.char_count} characters (0 unmasked raw text)
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={handoffConfirmed}
                onChange={(e) => setHandoffConfirmed(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-violet-600 focus:ring-violet-500"
              />
              <span>I confirm that only the sanitized content shown above will be dispatched.</span>
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setHandoffPreview(null)}
                className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendHandoff}
                disabled={!handoffConfirmed || isHandoffLoading}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isHandoffLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Transmitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Confirm & Send to {handoffPreview.destination_name}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Simulated AI Provider Response Card */}
        {handoffResult && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Response from {handoffResult.provider_name}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {new Date(handoffResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
              {handoffResult.simulated_response}
            </div>
          </div>
        )}
      </div>

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
