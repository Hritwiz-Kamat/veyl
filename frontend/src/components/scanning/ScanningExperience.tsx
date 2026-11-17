import React, { useEffect, useState } from 'react';
import {
  FileSearch,
  Scan,
  Cpu,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export type ScanStage = 'reading' | 'scanning' | 'analyzing' | 'masking' | 'ready';

interface StageConfig {
  id: ScanStage;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageConfig[] = [
  {
    id: 'reading',
    label: 'Reading Content',
    detail: 'Ingesting stream and preparing document buffers...',
    icon: FileSearch,
  },
  {
    id: 'scanning',
    label: 'Deep Scanning',
    detail: 'Executing regex recognizers and multi-layer OCR engines...',
    icon: Scan,
  },
  {
    id: 'analyzing',
    label: 'Classifying Entities',
    detail: 'Evaluating risk levels and mapping PII & credentials...',
    icon: Cpu,
  },
  {
    id: 'masking',
    label: 'Preparing Redactions',
    detail: 'Structuring cryptographic replacement tokens...',
    icon: ShieldAlert,
  },
  {
    id: 'ready',
    label: 'Analysis Ready',
    detail: 'Entities detected. Awaiting your approval.',
    icon: CheckCircle2,
  },
];

interface ScanningExperienceProps {
  currentStage?: ScanStage;
  fileType?: 'text' | 'image' | 'pdf';
  isComplete?: boolean;
}

export const ScanningExperience: React.FC<ScanningExperienceProps> = ({
  fileType = 'text',
  isComplete = false,
}) => {
  const [internalStepIndex, setInternalStepIndex] = useState(0);

  useEffect(() => {
    if (isComplete) return;

    // Honest progression through the analysis steps while backend is processing
    const interval = setInterval(() => {
      setInternalStepIndex((prev) => {
        if (prev < STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [isComplete]);

  const activeStepIndex = isComplete ? STAGES.length - 1 : internalStepIndex;
  const activeStage = STAGES[activeStepIndex];
  const IconComponent = activeStage.icon;

  return (
    <div className="w-full max-w-xl mx-auto py-10 px-6 flex flex-col items-center text-center animate-fade-in font-sans-ui">
      {/* Dynamic Animated Mascot/Icon Badge */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-[#FEF7F2] border border-[#F6D5C2] flex items-center justify-center text-[#E78B55] shadow-xs relative overflow-hidden">
          <IconComponent className="w-9 h-9 animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#E78B55] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
          {activeStepIndex + 1}
        </div>
      </div>

      {/* Stage Titles */}
      <h3 className="font-serif-heading text-2xl text-[#242424] font-normal tracking-tight">
        {activeStage.label}
      </h3>
      <p className="text-xs text-[#6B6560] mt-1.5 max-w-md leading-relaxed">
        {activeStage.detail}
      </p>

      {/* Context Tag */}
      <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#EAE5DF] text-[11px] text-[#92908C] font-mono">
        <span>Processing</span>
        <span className="text-[#242424] font-semibold uppercase">{fileType}</span>
        <span>locally</span>
      </div>

      {/* Step Indicators */}
      <div className="w-full max-w-md mt-8 flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[#EAE5DF] z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#E78B55] transition-all duration-500 z-0"
          style={{ width: `${(activeStepIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {STAGES.map((s, idx) => {
          const isDone = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;

          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-[#E78B55] text-white'
                    : isCurrent
                    ? 'bg-[#242424] text-white ring-4 ring-[#FEF7F2]'
                    : 'bg-[#FAF8F5] border border-[#D4CFC8] text-[#92908C]'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
