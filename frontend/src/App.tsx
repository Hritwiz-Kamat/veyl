/**
 * App — top-level application shell for M1-M5.
 *
 * M5 adds live image processing & pixel-level masking:
 *   - File upload validation (PNG, JPEG, WEBP)
 *   - Structured Tesseract OCR word-level box extraction
 *   - Character-span to bounding-box mapping
 *   - Server-side opaque pixel-level redaction using Pillow
 *   - Stripped metadata and downloadable sanitized artifact
 */
import { Shield, Sparkles, FileText, Image, CheckCheck } from 'lucide-react';
import { BackendStatus } from './components/ui/BackendStatus';
import { TextScanView } from './features/analysis/TextScanView';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0f0f13] text-zinc-100 flex flex-col">

      {/* ── Top bar ── */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-violet-400" strokeWidth={1.5} />
          <span className="font-semibold text-sm tracking-wide text-zinc-100">
            Privacy Mask
          </span>
          <span className="text-xs text-zinc-600 font-mono">MVP</span>
        </div>
        <BackendStatus />
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">

        {/* Hero */}
        <div className="flex flex-col items-center gap-3 text-center max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Shield className="w-7 h-7 text-violet-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-50 tracking-tight">
            AI Privacy Layer
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Scan text prompts or upload images. Detect sensitive PII and secrets, review findings,
            and generate sanitized text or pixel-redacted image files ready for AI tools.
          </p>
        </div>

        {/* Feature chips */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full max-w-2xl">
          {[
            {
              icon: <Sparkles className="w-4 h-4 text-violet-400" />,
              title: 'Detection',
              desc: 'PII, secrets & tokens',
              milestone: 'M3 (Active)',
              active: true,
            },
            {
              icon: <CheckCheck className="w-4 h-4 text-emerald-400" />,
              title: 'Sanitization',
              desc: 'Review & copy output',
              milestone: 'M4 (Active)',
              active: true,
            },
            {
              icon: <Image className="w-4 h-4 text-sky-400" />,
              title: 'Image Masking',
              desc: 'OCR + pixel redaction',
              milestone: 'M5 (Active)',
              active: true,
            },
            {
              icon: <FileText className="w-4 h-4 text-amber-400" />,
              title: 'PDF Redaction',
              desc: 'Selectable text & pages',
              milestone: 'M6',
              active: false,
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`rounded-xl border p-3.5 flex flex-col gap-1 transition-colors ${
                f.active
                  ? 'border-violet-500/40 bg-violet-950/20 ring-1 ring-violet-500/20'
                  : 'border-zinc-800 bg-zinc-900/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {f.icon}
                <span className="text-xs font-semibold text-zinc-200">
                  {f.title}
                </span>
                <span
                  className={`ml-auto text-[10px] font-mono ${
                    f.active ? 'text-violet-400 font-semibold' : 'text-zinc-600'
                  }`}
                >
                  {f.milestone}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Active M3+M4+M5 Scan & Review View */}
        <TextScanView />

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 px-6 py-3 flex items-center justify-between text-xs text-zinc-600">
        <span>M1 to M5 complete — image OCR and pixel-level redaction active</span>
        <span>No data sent externally · Local processing only</span>
      </footer>

    </div>
  );
}
