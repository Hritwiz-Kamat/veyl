import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { AnonymizationReport } from '../components/reports/AnonymizationReport';
import { useAudit } from '../hooks/useAudit';

export const DocumentOutputPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentMaskingSession } = useAudit();

  const isImage = currentMaskingSession?.fileType === 'image';
  const isPdf = currentMaskingSession?.fileType === 'pdf';

  const defaultOriginalText = `CONFIDENTIAL PATIENT & EMPLOYEE RECORD
Date: 12/04/2024
Customer: Johnathan Vance
Email: j.vance@acmecorp.internal
Phone: +1 (555) 019-2834
Address: 742 Evergreen Terrace, Springfield, OR 97477
Social Security Number: 123-45-6789
Internal AWS Access Key: AKIAIOSFODNN7EXAMPLE
Private Server IP: 10.0.4.15`;

  const defaultWrappedText = `CONFIDENTIAL PATIENT & EMPLOYEE RECORD
Date: [DATE_TIME_1]
Customer: [PERSON_1]
Email: [EMAIL_ADDRESS_1]
Phone: [PHONE_NUMBER_1]
Address: [LOCATION_1], [LOCATION_2], [LOCATION_3]
Social Security Number: [US_SSN_1]
Internal AWS Access Key: [CREDENTIAL_1]
Private Server IP: [IP_ADDRESS_1]`;

  const originalContent =
    currentMaskingSession?.originalText || defaultOriginalText;

  const wrappedContent =
    currentMaskingSession?.sanitizeResult?.sanitized_text || defaultWrappedText;

  const artifactUrl = currentMaskingSession?.sanitizeResult?.artifact_download_url
    ? `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}${currentMaskingSession.sanitizeResult.artifact_download_url.replace('/api/v1', '')}`
    : null;

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fade-in">
      {/* ── Page Title matching Reference 2 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#242424] tracking-tight">
            For document and image content masking output
          </h1>
          <p className="text-xs text-[#6B6560] mt-1">
            Side-by-side verification: original inputs compared directly with unrecoverable redacted artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/scan?mode=image')}
            className="px-3.5 py-1.5 rounded-xl border border-[#EAE6DF] text-xs font-medium text-[#6B6560] hover:text-[#242424] hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit / Scan More</span>
          </button>
          {artifactUrl && (
            <a
              href={artifactUrl}
              download={isPdf ? 'redacted_document.pdf' : 'redacted_image.png'}
              className="px-3.5 py-1.5 rounded-xl bg-[#E78B55] hover:bg-[#D47A47] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Redacted File</span>
            </a>
          )}
          <button
            onClick={() => navigate('/scan?mode=image')}
            className="px-3.5 py-1.5 rounded-xl bg-[#242424] hover:bg-[#181818] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#E78B55]" />
            <span>New File</span>
          </button>
        </div>
      </div>

      {/* ── Layout: Dual-Panel Comparison + Right Anonymization Report ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        <div className="flex-1 w-full bg-[#EFECE6]/70 border border-[#EAE6DF] rounded-3xl min-h-[500px] flex flex-col md:flex-row shadow-xs overflow-hidden">
          {/* Left Panel: Original */}
          <div className="flex-1 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#D4CFC8]/60">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#242424]">
                  Original
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-[#6B6560] font-mono border border-[#EAE6DF]">
                  {isImage ? 'Raw Image OCR' : isPdf ? 'Source PDF' : 'Input Stream'}
                </span>
              </div>

              {currentMaskingSession?.originalFilePreviewUrl && isImage ? (
                <div className="rounded-2xl overflow-hidden border border-[#EAE6DF] bg-white p-2 mb-4 max-h-72 flex items-center justify-center">
                  <img
                    src={currentMaskingSession.originalFilePreviewUrl}
                    alt="Original preview"
                    className="max-h-64 object-contain rounded-xl"
                  />
                </div>
              ) : null}

              <div className="font-mono text-xs sm:text-sm text-[#6B6560] leading-relaxed whitespace-pre-wrap max-h-[360px] overflow-y-auto pr-2">
                {originalContent}
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-[#D4CFC8]/40 text-[11px] text-[#9C9790]">
              Preserved in isolated local workspace session
            </div>
          </div>

          {/* Right Panel: Wrapped */}
          <div className="flex-1 p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#242424]">
                  Wrapped
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F0FAF4] text-[#166534] font-medium border border-[#C6EBD3]">
                  Redacted & Purged
                </span>
              </div>

              {artifactUrl && isImage ? (
                <div className="rounded-2xl overflow-hidden border border-[#C6EBD3] bg-white p-2 mb-4 max-h-72 flex flex-col items-center justify-center gap-2">
                  <img
                    src={artifactUrl}
                    alt="Redacted artifact preview"
                    className="max-h-60 object-contain rounded-xl"
                  />
                </div>
              ) : null}

              <div className="font-mono text-xs sm:text-sm text-[#242424] leading-relaxed whitespace-pre-wrap max-h-[360px] overflow-y-auto pr-2">
                {wrappedContent}
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-[#D4CFC8]/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-[#166534] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4CAF7D]" />
                <span>Verified Content Purge</span>
              </div>
              {artifactUrl && (
                <a
                  href={artifactUrl}
                  download={isPdf ? 'redacted_document.pdf' : 'redacted_image.png'}
                  className="text-xs font-semibold text-[#E78B55] hover:text-[#D47A47] transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>
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
