import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paperclip,
  Image as ImageIcon,
  BookOpen,
  Wand2,
  ArrowUp,
  X,
  FileText,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [promptText, setPromptText] = useState('');
  const [showBanner, setShowBanner] = useState(true);

  const handleSubmitPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim()) {
      navigate('/scan?mode=text');
      return;
    }
    // Navigate to scan with prompt pre-populated in state / query
    navigate('/scan?mode=text', { state: { initialText: promptText } });
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setPromptText(suggestionText);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between max-w-4xl mx-auto w-full py-4 gap-8">
      {/* ── Welcome Heading ── */}
      <div className="flex flex-col items-center text-center mt-4 gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Hi, Elizabeth!
        </h1>
        <p className="text-base sm:text-lg text-gray-400 font-normal">
          How can I assist you today?
        </p>
      </div>

      {/* ── 3 Action Cards + Mascot Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl px-2">
        {/* Card 1: Upload Images */}
        <div
          onClick={() => navigate('/scan?mode=image')}
          className="bg-white border border-gray-200/80 rounded-2xl p-5 flex flex-col justify-between h-44 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
        >
          {/* Card Illustration */}
          <div className="w-full flex justify-center items-center py-2">
            <div className="relative w-20 h-16 bg-gradient-to-tr from-amber-100 to-sky-100 rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-center rotate-[-3deg] group-hover:rotate-0 transition-transform">
              <div className="w-12 h-9 bg-white rounded-md shadow-2xs overflow-hidden flex flex-col items-center justify-center p-1 border border-gray-100">
                <div className="w-full h-5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xs mb-0.5" />
                <span className="text-[7px] text-gray-400 font-mono">desert.png</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Upload images
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload images for quick processing
            </p>
          </div>
        </div>

        {/* Card 2: Paste Text File */}
        <div
          onClick={() => navigate('/scan?mode=text')}
          className="bg-white border border-gray-200/80 rounded-2xl p-5 flex flex-col justify-between h-44 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
        >
          {/* Card Illustration */}
          <div className="w-full flex justify-center items-center py-2">
            <div className="flex items-center gap-1.5 relative">
              <div className="w-10 h-12 bg-sky-500 rounded-lg shadow-xs flex flex-col items-center justify-center text-white rotate-[-8deg] group-hover:rotate-[-4deg] transition-transform">
                <FileCode className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">.MD</span>
              </div>
              <div className="w-12 h-14 bg-gray-900 rounded-lg shadow-md flex flex-col items-center justify-center text-white z-10 scale-105">
                <FileText className="w-5 h-5 mb-0.5 text-zinc-300" />
                <span className="text-[9px] font-bold tracking-wider">.TXT</span>
              </div>
              <div className="w-10 h-12 bg-purple-600 rounded-lg shadow-xs flex flex-col items-center justify-center text-white rotate-[8deg] group-hover:rotate-[4deg] transition-transform">
                <FileText className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">.TXT</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Paste Text File
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Paste your text file content (.TXT, .MD etc.)
            </p>
          </div>
        </div>

        {/* Card 3: Upload Files */}
        <div
          onClick={() => navigate('/scan?mode=pdf')}
          className="bg-white border border-gray-200/80 rounded-2xl p-5 flex flex-col justify-between h-44 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
        >
          {/* Card Illustration */}
          <div className="w-full flex justify-center items-center py-2">
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-12 bg-emerald-500 rounded-lg shadow-xs flex flex-col items-center justify-center text-white">
                <FileSpreadsheet className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">.CSV</span>
              </div>
              <div className="w-11 h-14 bg-rose-500 rounded-lg shadow-xs flex flex-col items-center justify-center text-white -translate-y-1">
                <FileText className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-bold">.PDF</span>
              </div>
              <div className="w-10 h-12 bg-blue-600 rounded-lg shadow-xs flex flex-col items-center justify-center text-white">
                <FileText className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">.DOC</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Upload files
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Easily manage and process various file types
            </p>
          </div>
        </div>

        {/* Mascot Bird Graphic Illustration */}
        <div className="flex items-center justify-center h-44">
          <svg
            className="w-36 h-36 drop-shadow-sm select-none"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ambient Sparkles */}
            <path
              d="M100 28L102 34L108 36L102 38L100 44L98 38L92 36L98 34L100 28Z"
              fill="#FBBF24"
            />
            <path
              d="M18 42L19.5 46.5L24 48L19.5 49.5L18 54L16.5 49.5L12 48L16.5 46.5L18 42Z"
              fill="#FBBF24"
            />

            {/* Bird Crest / Hair */}
            <path
              d="M56 16C58 10 68 12 68 18C68 22 62 26 56 26"
              fill="#F59E0B"
            />
            <path
              d="M62 18C66 12 76 15 74 22C72 26 67 27 62 27"
              fill="#FBBF24"
            />

            {/* Bird Body */}
            <ellipse cx="60" cy="65" rx="36" ry="32" fill="#3B82F6" />
            <path
              d="M24 64C24 82 40 96 60 96C80 96 96 82 96 64C96 52 82 40 60 40C38 40 24 52 24 64Z"
              fill="#60A5FA"
            />

            {/* White Tummy & Face Mask */}
            <ellipse cx="60" cy="72" rx="26" ry="22" fill="#FFFFFF" />

            {/* Cute Happy Smiling Eyes */}
            <path
              d="M44 60C45 56 50 56 52 60"
              stroke="#1E293B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M68 60C69 56 74 56 76 60"
              stroke="#1E293B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Rosy Cheeks */}
            <ellipse cx="40" cy="66" rx="4" ry="2.5" fill="#F472B6" opacity="0.6" />
            <ellipse cx="80" cy="66" rx="4" ry="2.5" fill="#F472B6" opacity="0.6" />

            {/* Cute Yellow Beak */}
            <polygon points="54,63 66,63 60,73" fill="#F59E0B" />

            {/* Left Flapping Wing */}
            <path
              d="M26 62C14 56 10 74 24 82C28 84 32 78 30 72C28 66 26 62 26 62Z"
              fill="#2563EB"
            />

            {/* Right Flapping Wing */}
            <path
              d="M94 62C106 56 110 74 96 82C92 84 88 78 90 72C92 66 94 62 94 62Z"
              fill="#2563EB"
            />

            {/* Little Feet */}
            <ellipse cx="50" cy="97" rx="5" ry="3" fill="#F59E0B" />
            <ellipse cx="70" cy="97" rx="5" ry="3" fill="#F59E0B" />
          </svg>
        </div>
      </div>

      {/* ── AI Assistant Input & Suggestion Pills ── */}
      <div className="w-full max-w-2xl px-2 flex flex-col gap-3">
        {/* Green Notification Banner */}
        {showBanner && (
          <div className="bg-[#eef8f1] border border-emerald-200/80 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="bg-[#cceed6] text-emerald-950 font-bold px-1.5 py-0.5 rounded text-[10px]">
                New
              </span>
              <span className="text-emerald-800 text-xs">
                Bring your docs, code, and files to collaborate with Sand and your team.
              </span>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-emerald-600 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Card Container */}
        <form
          onSubmit={handleSubmitPrompt}
          className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col gap-2.5 focus-within:border-gray-300 focus-within:shadow-sm transition-all"
        >
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Ask me anything..."
            className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none px-1 py-1"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-gray-400 text-xs">
              <button
                type="button"
                onClick={() => navigate('/scan?mode=pdf')}
                title="Attach document or file"
                className="hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/scan?mode=image')}
                title="Attach image"
                className="hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPromptText(
                    'Hello, my name is Alice Smith and my email is alice@example.com. My OpenAI key is sk-live1234567890abcdefghijklmnopqrstuvwxyz.'
                  )
                }
                className="flex items-center gap-1.5 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer text-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Prompt Library</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (promptText) {
                    setPromptText(`Please redact and sanitize this prompt: ${promptText}`);
                  }
                }}
                className="flex items-center gap-1.5 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer text-xs"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Improve Prompt</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-[#18181b] hover:bg-black text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs shrink-0"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {[
            'Identify similar images online',
            'Summarize this transcript',
            'Analyze the contents of this image',
          ].map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleSuggestionClick(pill)}
              className="bg-gray-200/50 hover:bg-gray-200/80 text-gray-500 hover:text-gray-800 text-[11px] font-medium px-3 py-1 rounded-full border border-gray-200/60 transition-colors cursor-pointer"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
