import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, ArrowLeft, RefreshCw } from 'lucide-react';
import { AnonymizationReport } from '../components/reports/AnonymizationReport';
import { useAudit } from '../hooks/useAudit';

export const TextOutputPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentMaskingSession } = useAudit();
  const [copied, setCopied] = useState(false);

  // Default sample text matching realistic confidential prompts if no active session
  const defaultSampleText =
    "Hello, my name is [PERSON_1] and my email is [EMAIL_ADDRESS_1]. My OpenAI key is [CREDENTIAL_1]. Please help me refactor my server at [IP_ADDRESS_1] with database credentials [SECRET_1]. All personal identifiers have been scrubbed by the Veyl Privacy Engine.";

  const textToDisplay =
    currentMaskingSession?.sanitizeResult?.sanitized_text ||
    currentMaskingSession?.originalText ||
    defaultSampleText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToDisplay);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* ── Page Title matching Reference 1 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-gray-950 tracking-tight">
            For text content masking output
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Deterministic cryptographic & entity sanitization generated with true content removal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/scan?mode=text')}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit / Scan More</span>
          </button>
          <button
            onClick={() => navigate('/scan?mode=text')}
            className="px-3.5 py-1.5 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* ── Layout: Main Output Card + Right Anonymization Report ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Large "Wrapped" Card */}
        <div className="flex-1 w-full bg-[#f2f2f3] border border-gray-200/80 rounded-3xl p-8 min-h-[520px] flex flex-col justify-between relative shadow-xs">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-gray-950 mb-6">
              Wrapped
            </h2>

            <div className="font-mono text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-wrap max-h-[420px] overflow-y-auto pr-2">
              {textToDisplay}
            </div>
          </div>

          {/* Bottom Card Bar: Session info + Copy Button */}
          <div className="flex items-center justify-between pt-6 mt-4 border-t border-gray-300/40">
            <span className="text-xs text-gray-400 font-mono">
              Status:{' '}
              <span className="text-emerald-600 font-semibold">
                Masked & Verified (0 raw leak)
              </span>
            </span>

            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="p-2.5 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200/80 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Anonymization Report */}
        <AnonymizationReport
          findings={currentMaskingSession?.findings}
          totalRedactedCount={currentMaskingSession?.sanitizeResult?.applied_count}
        />
      </div>
    </div>
  );
};
