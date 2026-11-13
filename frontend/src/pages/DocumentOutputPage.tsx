import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, RefreshCw } from 'lucide-react';
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
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* ── Page Title matching Reference 2 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-gray-950 tracking-tight">
            For document and image content masking output
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Side-by-side verification: original input streams compared directly with unrecoverable redacted artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/scan?mode=image')}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit / Scan More</span>
          </button>
          {artifactUrl && (
            <a
              href={artifactUrl}
              download={isPdf ? 'redacted_document.pdf' : 'redacted_image.png'}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Artifact</span>
            </a>
          )}
          <button
            onClick={() => navigate('/scan?mode=image')}
            className="px-3.5 py-1.5 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New File</span>
          </button>
        </div>
      </div>

      {/* ── Layout: Split Original/Wrapped Card + Right Anonymization Report ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Large Dual-Panel Card matching Reference 2 */}
        <div className="flex-1 w-full bg-[#f2f2f3] border border-gray-200/80 rounded-3xl min-h-[520px] flex flex-col md:flex-row shadow-xs overflow-hidden">
          {/* Left Panel: Original */}
          <div className="flex-1 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-300/60">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-gray-950">
                  Original
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-gray-200/80 text-gray-600 font-mono">
                  {isImage ? 'Raw Image OCR' : isPdf ? 'Source PDF' : 'Plain Text'}
                </span>
              </div>

              {currentMaskingSession?.originalFilePreviewUrl && isImage ? (
                <div className="rounded-xl overflow-hidden border border-gray-300/80 bg-white p-2 mb-4 max-h-72 flex items-center justify-center">
                  <img
                    src={currentMaskingSession.originalFilePreviewUrl}
                    alt="Original preview"
                    className="max-h-64 object-contain rounded-lg"
                  />
                </div>
              ) : null}

              <div className="font-mono text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-[380px] overflow-y-auto pr-2">
                {originalContent}
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-gray-300/40 text-[11px] text-gray-400">
              Preserved in isolated local workspace session
            </div>
          </div>

          {/* Right Panel: Wrapped */}
          <div className="flex-1 p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-gray-950">
                  Wrapped
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold font-mono">
                  Redacted & Purged
                </span>
              </div>

              {artifactUrl && isImage ? (
                <div className="rounded-xl overflow-hidden border border-emerald-200 bg-white p-2 mb-4 max-h-72 flex flex-col items-center justify-center gap-2">
                  <img
                    src={artifactUrl}
                    alt="Redacted artifact preview"
                    className="max-h-60 object-contain rounded-lg"
                  />
                  <span className="text-[10px] text-gray-400">
                    Opaque destructive pixel masks applied
                  </span>
                </div>
              ) : null}

              <div className="font-mono text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap max-h-[380px] overflow-y-auto pr-2">
                {wrappedContent}
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-gray-300/40 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 font-semibold">
                ✓ Cryptographic tokens & verified purge
              </span>
              {artifactUrl && (
                <a
                  href={artifactUrl}
                  download={isPdf ? 'redacted_document.pdf' : 'redacted_image.png'}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
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
