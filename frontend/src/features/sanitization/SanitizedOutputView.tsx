import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ExternalLink,
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
  const navigate = useNavigate();
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
    <div className="w-full flex flex-col gap-5">
      {/* ── Status Banner ── */}
      {sanitizeResult.has_unredacted_credentials ? (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-rose-900">
              Warning: Unredacted Credentials!
            </span>
            <p className="text-rose-700 leading-relaxed">
              One or more high-risk credentials were intentionally left unmasked. Do not share this content externally.
            </p>
          </div>
        </div>
      ) : !sanitizeResult.all_sanitized ? (
        <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2.5 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Partially sanitized: {sanitizeResult.skipped_count} finding(s) were excluded from redaction.
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">
              All selected sensitive entities were sanitized and verified successfully.
            </span>
          </div>

          <button
            onClick={() => {
              if (fileType === 'text') navigate('/text-output');
              else navigate('/document-output');
            }}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer underline underline-offset-2"
          >
            <span>Open in Canvas</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Artifact Download Banner for Images and PDFs ── */}
      {artifactUrl && (
        <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 text-xs text-indigo-950">
            {fileType === 'pdf' ? (
              <FileText className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <ImageIcon className="w-5 h-5 text-indigo-600 shrink-0" />
            )}
            <div>
              <span className="font-bold block text-gray-900">
                {fileType === 'pdf' ? 'Redacted PDF Document Ready' : 'Redacted Image Artifact Ready'}
              </span>
              <span className="text-gray-500">
                {fileType === 'pdf'
                  ? 'Approved text & vector elements were permanently purged and verified.'
                  : 'Pixels were permanently masked with Pillow; EXIF metadata stripped.'}
              </span>
            </div>
          </div>
          <a
            href={artifactUrl}
            download={fileType === 'pdf' ? 'sanitized_document.pdf' : 'sanitized_image.png'}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {fileType === 'pdf' ? 'Download Redacted PDF' : 'Download Masked Image'}
          </a>
        </div>
      )}

      {/* ── Header & Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200/80 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('sanitized')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'sanitized'
                ? 'bg-white text-gray-900 font-bold shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sanitized Output
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-white text-gray-900 font-bold shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Comparison
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditSelection}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Edit Findings
          </button>
          {sanitizeResult.sanitized_text && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Content Area ── */}
      {activeTab === 'sanitized' ? (
        <div className="relative rounded-2xl border border-gray-200 bg-white p-5 font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[140px] max-h-96 overflow-y-auto shadow-2xs">
          {sanitizeResult.sanitized_text ||
            (artifactUrl
              ? 'File redaction complete. See download button above or view canvas.'
              : '')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-500">
              {fileType === 'image' ? 'Original OCR Text' : 'Original Text'}
            </span>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-600 whitespace-pre-wrap leading-relaxed min-h-[140px] max-h-96 overflow-y-auto">
              {originalText || '(No text extracted)'}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-indigo-700">
              Sanitized Text
            </span>
            <div className="rounded-2xl border border-indigo-200 bg-white p-4 font-mono text-xs text-gray-900 whitespace-pre-wrap leading-relaxed min-h-[140px] max-h-96 overflow-y-auto shadow-2xs">
              {sanitizeResult.sanitized_text || '(Artifact pixels redacted)'}
            </div>
          </div>
        </div>
      )}

      {/* ── M8 Demo Handoff Section ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-gray-900">
              AI Handoff (M8 Demo)
            </span>
          </div>
          <span className="text-[11px] text-gray-400">
            Manual copy or confirmed dispatch to a simulated AI provider
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {sanitizeResult.sanitized_text && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition-colors flex items-center gap-1.5 border border-gray-200 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              {copied ? 'Copied to Clipboard!' : 'Manual Copy (All Providers)'}
            </button>
          )}

          {sessionId && sanitizeResult.sanitized_text && (
            <>
              <button
                type="button"
                onClick={() => handlePrepareHandoff('mock-chatgpt')}
                disabled={isHandoffLoading}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-600" />
                Mock ChatGPT
              </button>
              <button
                type="button"
                onClick={() => handlePrepareHandoff('mock-claude')}
                disabled={isHandoffLoading}
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-amber-600" />
                Mock Claude
              </button>
              <button
                type="button"
                onClick={() => handlePrepareHandoff('mock-cursor')}
                disabled={isHandoffLoading}
                className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-sky-600" />
                Mock Cursor
              </button>
            </>
          )}
        </div>

        {/* Handoff Error */}
        {handoffError && (
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{handoffError}</span>
          </div>
        )}

        {/* Confirmation Modal / Drawer */}
        {handoffPreview && (
          <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 flex flex-col gap-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-indigo-600" />
                Confirm External Handoff: {handoffPreview.destination_name}
              </span>
              <button
                type="button"
                onClick={() => setHandoffPreview(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {handoffPreview.warning && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{handoffPreview.warning}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-gray-600">
                Exact payload to be transmitted:
              </span>
              <div className="p-3.5 rounded-xl border border-gray-200 bg-white font-mono text-[11px] text-gray-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {handoffPreview.sanitized_content}
              </div>
              <span className="text-[10px] text-gray-400">
                Payload Size: {handoffPreview.char_count} characters (0 unmasked raw text)
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={handoffConfirmed}
                onChange={(e) => setHandoffConfirmed(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">
                I confirm that only the sanitized content shown above will be dispatched.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setHandoffPreview(null)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 text-xs bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendHandoff}
                disabled={!handoffConfirmed || isHandoffLoading}
                className="px-4 py-1.5 rounded-xl bg-[#18181b] hover:bg-black disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Response from {handoffResult.provider_name}
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                {new Date(handoffResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-xl border border-gray-200">
              {handoffResult.simulated_response}
            </div>
          </div>
        )}
      </div>

      {/* Footer action */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onNewScan}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Start New Analysis
        </button>
      </div>
    </div>
  );
}
