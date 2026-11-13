/**
 * App — top-level application shell for M1/M2/M3.
 *
 * M3 adds live real text detection with:
 *   - Local Microsoft Presidio (en_core_web_sm)
 *   - Custom regex recognizers (SSN, IPv4, Credit Cards)
 *   - Secret detection (OpenAI, AWS, GitHub, Slack, Private Keys, Passwords)
 *   - Overlap resolution, consistent placeholders, and session generation.
 */
import { Shield, Sparkles, FileText, Image } from 'lucide-react';
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
            Paste a prompt or text snippet. Local offline detectors identify sensitive
            PII and credentials, map consistent placeholders, and highlight risks before
            any AI handoff.
          </p>
        </div>

        {/* Feature chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
          {[
            {
              icon: <Sparkles className="w-4 h-4 text-violet-400" />,
              title: 'Text Detection',
              desc: 'PII, secrets, keys & tokens',
              milestone: 'M3 (Active)',
              active: true,
            },
            {
              icon: <Image className="w-4 h-4 text-sky-400" />,
              title: 'Image Redaction',
              desc: 'OCR + pixel-level masking',
              milestone: 'M5',
              active: false,
            },
            {
              icon: <FileText className="w-4 h-4 text-amber-400" />,
              title: 'PDF Processing',
              desc: 'Selectable text + true redaction',
              milestone: 'M6',
              active: false,
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`rounded-xl border p-4 flex flex-col gap-1.5 transition-colors ${
                f.active
                  ? 'border-violet-500/40 bg-violet-950/20 ring-1 ring-violet-500/20'
                  : 'border-zinc-800 bg-zinc-900/50 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2">
                {f.icon}
                <span className="text-sm font-medium text-zinc-200">
                  {f.title}
                </span>
                <span className={`ml-auto text-xs font-mono ${f.active ? 'text-violet-400 font-semibold' : 'text-zinc-600'}`}>
                  {f.milestone}
                </span>
              </div>
              <p className="text-xs text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Active M3 Text Scan View */}
        <TextScanView />

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 px-6 py-3 flex items-center justify-between text-xs text-zinc-600">
        <span>M1 + M2 + M3 complete — real text detection & session store active</span>
        <span>No data sent externally · 100% local detection</span>
      </footer>

    </div>
  );
}
