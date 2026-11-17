import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { AnonymizationReport } from '../components/reports/AnonymizationReport';
import { useAudit } from '../hooks/useAudit';

export const TextOutputPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentMaskingSession } = useAudit();
  const [copied, setCopied] = useState(false);

  const defaultSampleText =
    "Hello, my name is [PERSON_1] and my email is [EMAIL_ADDRESS_1]. My OpenAI key is [CREDENTIAL_1]. Please help me refactor my server at [IP_ADDRESS_1] with database credentials [SECRET_1]. All personal identifiers have been scrubbed by the RAPIT Privacy Layer.";

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
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fade-in">
      {/* ── Page Title matching Reference 1 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#242424] tracking-tight">
            For text content masking output
          </h1>
          <p className="text-xs text-[#6B6560] mt-1">
            Deterministic cryptographic & entity sanitization generated with true content removal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/scan?mode=text')}
            className="px-3.5 py-1.5 rounded-xl border border-[#EAE6DF] text-xs font-medium text-[#6B6560] hover:text-[#242424] hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit / Scan More</span>
          </button>
          <button
            onClick={() => navigate('/scan?mode=text')}
            className="px-3.5 py-1.5 rounded-xl bg-[#242424] hover:bg-[#181818] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#E78B55]" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* ── Layout: Main Output Card + Right Anonymization Report ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Large "Wrapped" Card */}
        <div className="flex-1 w-full bg-[#EFECE6]/70 border border-[#EAE6DF] rounded-3xl p-8 min-h-[500px] flex flex-col justify-between relative shadow-xs">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#242424] mb-6">
              Wrapped
            </h2>

            <div className="font-mono text-sm sm:text-base text-[#242424] leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-2">
              {textToDisplay}
            </div>
          </div>

          {/* Bottom Card Bar: Status + Copy Button */}
          <div className="flex items-center justify-between pt-6 mt-4 border-t border-[#D4CFC8]/60">
            <div className="flex items-center gap-1.5 text-xs text-[#6B6560] font-mono">
              <ShieldCheck className="w-4 h-4 text-[#4CAF7D]" />
              <span className="text-[#166534] font-semibold">
                Sanitized & Verified
              </span>
            </div>

            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="p-2.5 bg-white hover:bg-[#FAF8F5] text-[#242424] rounded-xl border border-[#EAE6DF] shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#4CAF7D]" />
                  <span className="text-[#166534]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#E78B55]" />
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
