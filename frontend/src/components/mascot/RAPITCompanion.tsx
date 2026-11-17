import React from 'react';
import { useRAPIT } from '../../hooks/useRAPIT';
import type { MascotState } from '../../context/MascotTypes';
import { X, RefreshCw, Sparkles } from 'lucide-react';

// Mascot image assets directly imported
import idleImg from '../../assets/rapit/idle.png';
import gotFilesImg from '../../assets/rapit/got-files.png';
import readingImg from '../../assets/rapit/reading.png';
import scanningImg from '../../assets/rapit/scanning.png';
import analyzingImg from '../../assets/rapit/analyzing.png';
import maskingImg from '../../assets/rapit/masking.png';
import successImg from '../../assets/rapit/success.png';
import backendErrorImg from '../../assets/rapit/backend-error.png';
import errorImg from '../../assets/rapit/error.png';
import takingBitImg from '../../assets/rapit/taking-bit.png';
import peekingImg from '../../assets/rapit/peeking.png';
import happyImg from '../../assets/rapit/happy.png';
import confusedImg from '../../assets/rapit/confused.png';

const MASCOT_IMAGES: Record<MascotState, string> = {
  idle: idleImg,
  'got-files': gotFilesImg,
  reading: readingImg,
  scanning: scanningImg,
  analyzing: analyzingImg,
  masking: maskingImg,
  success: successImg,
  'backend-error': backendErrorImg,
  error: errorImg,
  'taking-bit': takingBitImg,
  peeking: peekingImg,
  happy: happyImg,
  confused: confusedImg,
};

const DEFAULT_MESSAGES: Record<MascotState, string> = {
  idle: 'Ready to protect your data.',
  'got-files': 'Got your files!',
  reading: 'Reading your files...',
  scanning: 'Scanning for sensitive information...',
  analyzing: "Analyzing what I've found...",
  masking: 'Wrapping your sensitive data...',
  success: 'All wrapped up!',
  'backend-error': "Oops! I can't reach the privacy engine.",
  error: 'Something went wrong while reading your file.',
  'taking-bit': 'Taking a bit...',
  peeking: 'RAPIT is keeping watch!',
  happy: 'Happy to help!',
  confused: 'Oops! I could not process that.',
};

export const RAPITCompanion: React.FC = () => {
  const { state, message, visible, hideCompanion, onRetry } = useRAPIT();

  if (!visible) return null;

  const mascotSrc = MASCOT_IMAGES[state] || idleImg;
  const displayMessage = message || DEFAULT_MESSAGES[state];
  const isError = state === 'backend-error' || state === 'error' || state === 'confused';
  const isCelebration = state === 'success';

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 bg-black/10 backdrop-blur-[2px] transition-opacity duration-300 animate-fade-in"
    >
      <div className="relative pointer-events-auto flex flex-col items-center text-center max-w-sm w-full select-none animate-fade-in-up">
        {/* Dismiss Button */}
        <button
          onClick={() => hideCompanion(false)}
          aria-label="Dismiss companion"
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/95 hover:bg-white border border-[#EAE5DF] text-[#92908C] hover:text-[#242424] flex items-center justify-center shadow-xs transition-colors cursor-pointer z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Mascot Visual Figure with floating animation and smooth image transition */}
        <div className="relative mb-2">
          {isCelebration && (
            <div className="absolute -top-4 -left-4 text-[#E78B55] animate-bounce">
              <Sparkles className="w-5 h-5" />
            </div>
          )}
          {isCelebration && (
            <div className="absolute -top-3 -right-3 text-[#F59E0B] animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
          )}

          <div className="animate-float">
            <img
              key={state}
              src={mascotSrc}
              alt={`RAPIT mascot - ${state}`}
              className="w-36 h-36 sm:w-40 sm:h-40 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-105 animate-fade-in"
            />
          </div>
        </div>

        {/* Contextual Message Bubble Card */}
        <div className="bg-white/95 backdrop-blur-md border border-[#EAE5DF] rounded-2xl px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col items-center gap-2 max-w-xs w-full transition-all duration-300">
          <p
            key={displayMessage}
            className="font-sans-body text-xs sm:text-sm font-semibold text-[#242424] leading-snug animate-fade-in"
          >
            {displayMessage}
          </p>

          {/* Action buttons if available (e.g. Retry) */}
          {isError && onRetry && (
            <button
              onClick={() => {
                hideCompanion(false);
                onRetry();
              }}
              className="mt-1 px-3 py-1.5 rounded-xl bg-[#242424] hover:bg-black text-white text-[11px] font-sans-ui font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-[#E78B55]" />
              <span>Retry Scan</span>
            </button>
          )}

          {/* Micro status tag */}
          <div className="flex items-center gap-1 text-[10px] font-sans-ui text-[#92908C]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E78B55]" />
            <span>RAPIT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
