import React from 'react';
import { TextScanView } from '../features/analysis/TextScanView';
import { Sparkles } from 'lucide-react';

export const ScanWorkspacePage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-start max-w-5xl mx-auto w-full gap-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col items-center text-center gap-1.5 mt-2">
        <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Local Privacy Guard Active</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Analyze & Redact Sensitive Content
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-lg">
          Scan text prompts, images, or PDF documents. Detect sensitive PII and secrets, approve replacements, and generate sanitized outputs.
        </p>
      </div>

      {/* Main Core Scanner */}
      <TextScanView />
    </div>
  );
};
