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
  ExternalLink,
} from 'lucide-react';
import type { SanitizeResponse } from '../../types';

interface SanitizedOutputViewProps {
  sessionId?: string | null;
  originalText: string;
  sanitizeResult: SanitizeResponse;
  fileType?: string;
  onEditSelection: () => void;
  onNewScan: () => void;
}

export function SanitizedOutputView({
  originalText,
  sanitizeResult,
  fileType = 'text',
  onEditSelection,
  onNewScan,
}: SanitizedOutputViewProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sanitized' | 'comparison'>('sanitized');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sanitizeResult.sanitized_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([sanitizeResult.sanitized_text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'sanitized_content.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const artifactUrl = sanitizeResult.artifact_download_url
    ? `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}${sanitizeResult.artifact_download_url.replace('/api/v1', '')}`
    : null;

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* ── Status Banner ── */}
      {sanitizeResult.has_unredacted_credentials ? (
        <div className="p-4 rounded-2xl border border-[#F5C6C6] bg-[#FEF2F2] text-[#991B1B] text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#E05252] mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-[#991B1B]">
              Warning: Unredacted High-Risk Credentials
            </span>
            <p className="text-[#B91C1C] leading-relaxed">
              One or more credentials were intentionally left unredacted. Verify before copying or sharing.
            </p>
          </div>
        </div>
      ) : !sanitizeResult.all_sanitized ? (
        <div className="p-3.5 rounded-2xl border border-[#F6E3B8] bg-[#FFFBF0] text-[#92400E] text-xs flex items-center gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#E5A040]" />
          <span>
            Partially sanitized: {sanitizeResult.skipped_count} finding(s) were excluded from redaction.
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl border border-[#C6EBD3] bg-[#F0FAF4] text-[#166534] text-xs flex items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#4CAF7D]" />
            <span className="font-medium">
              Your content is sanitized. All approved sensitive entities were purged and verified.
            </span>
          </div>

          <button
            onClick={() => {
              if (fileType === 'text') navigate('/text-output');
              else navigate('/document-output');
            }}
            className="text-xs font-semibold text-[#166534] hover:text-[#14532D] flex items-center gap-1 cursor-pointer underline underline-offset-2"
          >
            <span>View Dedicated Canvas</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Artifact Download for Files / Images ── */}
      {artifactUrl && (
        <div className="p-4 rounded-2xl border border-[#EAE6DF] bg-white flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 text-xs text-[#242424]">
            {fileType === 'pdf' ? (
              <FileText className="w-5 h-5 text-[#E78B55] shrink-0" />
            ) : (
              <ImageIcon className="w-5 h-5 text-[#E78B55] shrink-0" />
            )}
            <div>
              <span className="font-semibold block text-[#242424]">
                {fileType === 'pdf' ? 'Sanitized PDF Document' : 'Sanitized Image File'}
              </span>
              <span className="text-[#6B6560]">
                {fileType === 'pdf'
                  ? 'Vector text streams purged permanently.'
                  : 'Destructive black pixel masks applied; EXIF stripped.'}
              </span>
            </div>
          </div>
          <a
            href={artifactUrl}
            download={fileType === 'pdf' ? 'sanitized_document.pdf' : 'sanitized_image.png'}
            className="px-4 py-2 rounded-xl bg-[#242424] hover:bg-[#181818] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#E78B55]" />
            <span>{fileType === 'pdf' ? 'Download PDF' : 'Download Image'}</span>
          </a>
        </div>
      )}

      {/* ── Toolbar & Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE6DF] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EFECE6] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('sanitized')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'sanitized'
                ? 'bg-white text-[#242424] font-semibold shadow-2xs'
                : 'text-[#6B6560] hover:text-[#242424]'
            }`}
          >
            Sanitized Output
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-white text-[#242424] font-semibold shadow-2xs'
                : 'text-[#6B6560] hover:text-[#242424]'
            }`}
          >
            Comparison
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditSelection}
            className="px-3 py-1.5 rounded-xl border border-[#EAE6DF] text-[#6B6560] hover:text-[#242424] hover:bg-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit Findings</span>
          </button>

          {sanitizeResult.sanitized_text && (
            <>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-3 py-1.5 rounded-xl border border-[#EAE6DF] text-[#6B6560] hover:text-[#242424] hover:bg-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download TXT</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-xl bg-[#E78B55] hover:bg-[#D47A47] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Content View ── */}
      {activeTab === 'sanitized' ? (
        <div className="relative rounded-2xl border border-[#EAE6DF] bg-white p-6 font-mono text-xs text-[#242424] whitespace-pre-wrap leading-relaxed min-h-[160px] max-h-[460px] overflow-y-auto shadow-xs">
          {sanitizeResult.sanitized_text ||
            (artifactUrl
              ? 'Sanitized document artifact generated. Click download button above to retrieve.'
              : 'Sanitization completed.')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[#6B6560]">
              {fileType === 'image' ? 'Original OCR Text' : 'Original Text'}
            </span>
            <div className="rounded-2xl border border-[#EAE6DF] bg-[#FAF8F5] p-5 font-mono text-xs text-[#6B6560] whitespace-pre-wrap leading-relaxed min-h-[160px] max-h-[460px] overflow-y-auto">
              {originalText || '(No text extracted)'}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[#E78B55]">
              Sanitized Text
            </span>
            <div className="rounded-2xl border border-[#F6D5C2] bg-white p-5 font-mono text-xs text-[#242424] whitespace-pre-wrap leading-relaxed min-h-[160px] max-h-[460px] overflow-y-auto shadow-xs">
              {sanitizeResult.sanitized_text || '(Artifact pixels redacted)'}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer Actions ── */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => {
            if (fileType === 'text') navigate('/text-output');
            else navigate('/document-output');
          }}
          className="text-xs text-[#6B6560] hover:text-[#242424] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#E78B55]" />
          <span>View Anonymization Report Panel</span>
        </button>

        <button
          type="button"
          onClick={onNewScan}
          className="px-4 py-2 rounded-xl bg-[#242424] hover:bg-[#181818] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#E78B55]" />
          <span>Start New Scan</span>
        </button>
      </div>
    </div>
  );
}
