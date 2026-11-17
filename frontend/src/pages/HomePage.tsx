import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import birdMascot from '../assets/bird_mascot.png';
import { useRAPIT } from '../hooks/useRAPIT';
import {
  Paperclip,
  Image as ImageIcon,
  ArrowUp,
  FileText,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { showCompanion, waitForCurrentStateMinDuration } = useRAPIT();
  const [promptText, setPromptText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim()) {
      navigate('/scan?mode=text');
      return;
    }
    showCompanion('scanning', 'Scanning for sensitive information...');
    navigate('/scan?mode=text', { state: { initialText: promptText } });
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'image' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show "Got your files!" first and honor its minimum duration
    showCompanion('got-files', 'Got your files!');
    await waitForCurrentStateMinDuration();
    navigate(`/scan?mode=${mode}`, { state: { initialFile: file } });
  };

  const privacySuggestions = [
    {
      label: 'Redact customer PII (names, emails, phones)',
      text: 'Customer record: Johnathan Vance, email j.vance@acmecorp.internal, phone +1 (555) 019-2834, address 742 Evergreen Terrace, Springfield, OR.',
    },
    {
      label: 'Sanitize API keys & credentials',
      text: 'Database configuration: host=10.0.4.15, AWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE, password=SuperSecret123! and OpenAI token sk-live9876543210.',
    },
    {
      label: 'Inspect confidential code snippet',
      text: 'export const config = { internalToken: "ghp_9847128947192847", adminEmail: "security-lead@acme.corp" };',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-between max-w-3xl mx-auto w-full py-4 px-2 gap-8 animate-fade-in select-none">
      {/* ── Top Greeting Headline & Subtitle (Instrument Serif & DM Sans) ── */}
      <div className="flex flex-col items-center text-center mt-3 gap-1.5">
        <h1 className="font-serif-heading text-3xl sm:text-4xl text-[#242424] font-normal tracking-tight">
          Your privacy workspace.
        </h1>
        <p className="font-sans-ui text-base sm:text-lg text-[#92908C] font-normal tracking-normal">
          How can I help protect your data today?
        </p>
      </div>

      {/* ── Central 2x2 Workspace: 3 Input Cards + Mascot ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl px-2">
        {/* Card 1: Upload Images */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border border-[#EAE5DF] hover:border-[#D4CFC8] rounded-[22px] p-5 flex flex-col justify-between h-44 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
        >
          {/* Illustration: Polaroid / Image Graphic */}
          <div className="w-full flex justify-center items-center py-2">
            <div className="relative w-20 h-16 bg-gradient-to-tr from-[#FFF7ED] to-[#EFF6FF] rounded-xl border border-[#EAE5DF] shadow-xs flex items-center justify-center rotate-[-3deg] group-hover:rotate-0 transition-transform duration-300">
              <div className="w-12 h-9 bg-white rounded-md shadow-2xs overflow-hidden flex flex-col items-center justify-center p-1 border border-[#F0EDE8]">
                <div className="w-full h-5 bg-gradient-to-r from-[#E78B55] to-[#F59E0B] rounded-xs mb-0.5" />
                <span className="text-[7px] text-[#92908C] font-mono">desert.png</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-sans-body text-sm font-bold text-[#242424] group-hover:text-[#E78B55] transition-colors">
              Upload Images
            </h3>
            <p className="font-sans-ui text-xs text-[#92908C] mt-0.5 leading-snug">
              Scan screenshots and images for sensitive information.
            </p>
          </div>
        </div>

        {/* Card 2: Paste Text */}
        <div
          onClick={() => navigate('/scan?mode=text')}
          className="bg-white border border-[#EAE5DF] hover:border-[#D4CFC8] rounded-[22px] p-5 flex flex-col justify-between h-44 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
        >
          {/* Illustration: .MD, .TXT file badges */}
          <div className="w-full flex justify-center items-center py-2">
            <div className="flex items-center gap-1.5 relative">
              <div className="w-10 h-12 bg-[#0284C7] rounded-lg shadow-xs flex flex-col items-center justify-center text-white rotate-[-8deg] group-hover:rotate-[-4deg] transition-transform duration-300">
                <FileCode className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">.MD</span>
              </div>
              <div className="w-12 h-14 bg-[#242424] rounded-lg shadow-md flex flex-col items-center justify-center text-white z-10 scale-105 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-5 h-5 mb-0.5 text-[#EAE5DF]" />
                <span className="text-[9px] font-bold tracking-wider">.TXT</span>
              </div>
              <div className="w-10 h-12 bg-[#E78B55] rounded-lg shadow-xs flex flex-col items-center justify-center text-white rotate-[8deg] group-hover:rotate-[4deg] transition-transform duration-300">
                <FileText className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">.TXT</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-sans-body text-sm font-bold text-[#242424] group-hover:text-[#E78B55] transition-colors">
              Paste Text
            </h3>
            <p className="font-sans-ui text-xs text-[#92908C] mt-0.5 leading-snug">
              Inspect prompts, code, logs and confidential text.
            </p>
          </div>
        </div>

        {/* Card 3: Upload Documents */}
        <div
          onClick={() => docInputRef.current?.click()}
          className="bg-white border border-[#EAE5DF] hover:border-[#D4CFC8] rounded-[22px] p-5 flex flex-col justify-between h-44 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
        >
          {/* Illustration: .CSV, .PDF, .DOC file badges */}
          <div className="w-full flex justify-center items-center py-2">
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-12 bg-[#10B981] rounded-lg shadow-xs flex flex-col items-center justify-center text-white group-hover:-translate-y-0.5 transition-transform duration-200">
                <FileSpreadsheet className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">.CSV</span>
              </div>
              <div className="w-11 h-14 bg-[#EF4444] rounded-lg shadow-xs flex flex-col items-center justify-center text-white -translate-y-1 group-hover:-translate-y-1.5 transition-transform duration-200">
                <FileText className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-bold">.PDF</span>
              </div>
              <div className="w-10 h-12 bg-[#2563EB] rounded-lg shadow-xs flex flex-col items-center justify-center text-white group-hover:-translate-y-0.5 transition-transform duration-200">
                <FileText className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">.DOC</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-sans-body text-sm font-bold text-[#242424] group-hover:text-[#E78B55] transition-colors">
              Upload Documents
            </h3>
            <p className="font-sans-ui text-xs text-[#92908C] mt-0.5 leading-snug">
              Detect and mask sensitive information in documents.
            </p>
          </div>
        </div>

        {/* Slot 4: Cute RAPIT Mascot beside the cards */}
        <div className="flex items-center justify-center h-44 select-none relative group">
          <div
            onClick={() => showCompanion('happy', 'Hi! I am RAPIT, your privacy companion.', { autoHideMs: 1800 })}
            className="animate-float group-hover:scale-105 transition-transform duration-300 cursor-pointer"
            title="Click to greet RAPIT"
          >
            <img
              src={birdMascot}
              alt="RAPIT Bird Mascot"
              className="w-44 h-40 object-contain drop-shadow-[0_8px_16px_rgba(231,139,85,0.12)]"
            />
          </div>
        </div>
      </div>

      {/* ── Bottom Text Composer & Suggestions (Reference Layout) ── */}
      <div className="w-full max-w-2xl px-2 flex flex-col gap-3">
        {/* Composer Card */}
        <form
          onSubmit={handleSubmitPrompt}
          className="bg-white border border-[#EAE5DF] focus-within:border-[#D4CFC8] rounded-[20px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col gap-2.5 focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-200"
        >
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Paste text here to scan for sensitive information..."
            className="w-full text-xs sm:text-sm text-[#242424] placeholder-[#92908C] bg-transparent focus:outline-none px-1 py-1 font-sans-ui"
          />

          <div className="flex items-center justify-between pt-1 border-t border-[#F0EDE8]/80">
            {/* Attachment Actions */}
            <div className="flex items-center gap-1 text-[#92908C] text-xs font-sans-ui">
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                title="Attach document (.PDF)"
                className="hover:text-[#242424] px-2 py-1 rounded-lg hover:bg-[#F8F6F2] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Paperclip className="w-3.5 h-3.5 text-[#E78B55]" />
                <span className="hidden sm:inline text-[11px] font-medium">Attach document</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image (.PNG, .JPG)"
                className="hover:text-[#242424] px-2 py-1 rounded-lg hover:bg-[#F8F6F2] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#E78B55]" />
                <span className="hidden sm:inline text-[11px] font-medium">Attach image</span>
              </button>
            </div>

            {/* Primary Action Button: Arrow button (Circular, dark) */}
            <button
              type="submit"
              title="Scan for sensitive data"
              className="w-8 h-8 rounded-full bg-[#242424] hover:bg-black active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
            >
              <ArrowUp className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>

        {/* Minimal Privacy-Focused Action Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
          {privacySuggestions.map((pill) => (
            <button
              key={pill.label}
              type="button"
              onClick={() => setPromptText(pill.text)}
              className="bg-white/80 hover:bg-white text-[#6B6560] hover:text-[#242424] text-[11px] font-sans-ui font-medium px-3 py-1 rounded-full border border-[#EAE5DF] shadow-2xs hover:border-[#D4CFC8] transition-all cursor-pointer"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleFilePicked(e, 'image')}
        className="hidden"
      />
      <input
        ref={docInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => handleFilePicked(e, 'pdf')}
        className="hidden"
      />
    </div>
  );
};
