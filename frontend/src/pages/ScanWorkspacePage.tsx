import React from 'react';
import { TextScanView } from '../features/analysis/TextScanView';
import { Shield } from 'lucide-react';

export const ScanWorkspacePage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-start max-w-4xl mx-auto w-full gap-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col items-center text-center gap-1.5 mt-1">
        <div className="inline-flex items-center gap-2 text-[#E78B55] bg-[#FEF7F2] border border-[#F6D5C2] px-3 py-1 rounded-full text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Local Privacy Guard</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#242424] tracking-tight">
          Analyze & Redact Content
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6560] max-w-md">
          Scan text prompts, image documents, or PDFs. Detect PII and secrets, approve redactions, and generate sanitized outputs.
        </p>
      </div>

      {/* Main Core Scanner */}
      <TextScanView />
    </div>
  );
};
