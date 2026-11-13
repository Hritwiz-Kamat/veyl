import { useState, useRef } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Search,
  RefreshCw,
  CheckSquare,
  Square,
  Shield,
  Upload,
  FileText,
  ImageIcon,
} from 'lucide-react';
import { analyzeText, analyzeFile, sanitizeSession, deleteSession } from '../../services/api';
import type { Finding, SanitizeResponse, FileMetadata } from '../../types';
import { SanitizedOutputView } from '../sanitization/SanitizedOutputView';

export function TextScanView() {
  const [activeMode, setActiveMode] = useState<'text' | 'image' | 'pdf'>('text');
  const [selectedPage, setSelectedPage] = useState<number | 'all'>('all');
  const [inputText, setInputText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(new Set());
  const [sanitizeResult, setSanitizeResult] = useState<SanitizeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const samplePrompt =
    "Hello, my name is Alice Smith and my email is alice@example.com. My OpenAI key is sk-live1234567890abcdefghijklmnopqrstuvwxyz. Please help me refactor my server at 192.168.1.50.";

  const handleScanText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsScanning(true);
    setErrorMessage(null);
    setScanWarning(null);
    setSanitizeResult(null);

    try {
      const response = await analyzeText({ text: inputText });
      setSessionId(response.session_id);
      setFindings(response.findings);
      const defaultSelected = new Set(
        response.findings.filter((f) => f.selected_by_default).map((f) => f.id)
      );
      setSelectedFindingIds(defaultSelected);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze text.';
      setErrorMessage(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }
    setFindings(null);
    setSelectedPage('all');
    setSanitizeResult(null);
    setErrorMessage(null);
    setScanWarning(null);
  };

  const handleScanFile = async () => {
    if (!uploadedFile) return;

    setIsScanning(true);
    setErrorMessage(null);
    setScanWarning(null);
    setSanitizeResult(null);

    try {
      const response = await analyzeFile(uploadedFile);
      setSessionId(response.session_id);
      setFileMetadata(response.metadata);
      setInputText(response.extracted_text);
      setFindings(response.findings);
      setSelectedPage('all');

      if (response.file_type === 'pdf') {
        setActiveMode('pdf');
      }

      if (response.is_incomplete_scan && response.scan_warning) {
        setScanWarning(response.scan_warning);
      }

      const defaultSelected = new Set(
        response.findings.filter((f) => f.selected_by_default).map((f) => f.id)
      );
      setSelectedFindingIds(defaultSelected);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze uploaded file.';
      setErrorMessage(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleFinding = (id: string) => {
    setSelectedFindingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!findings) return;
    setSelectedFindingIds(new Set(findings.map((f) => f.id)));
  };

  const handleDeselectAll = () => {
    setSelectedFindingIds(new Set());
  };

  const handleApplySanitization = async () => {
    if (!sessionId) return;

    setIsSanitizing(true);
    setErrorMessage(null);

    try {
      const result = await sanitizeSession(sessionId, {
        approved_finding_ids: Array.from(selectedFindingIds),
      });
      setSanitizeResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sanitization failed. Session may have expired.';
      setErrorMessage(msg);
    } finally {
      setIsSanitizing(false);
    }
  };

  const handleReset = async () => {
    if (sessionId) {
      try {
        await deleteSession(sessionId);
      } catch {
        // Ignore session cleanup errors
      }
    }
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setInputText('');
    setUploadedFile(null);
    setFilePreviewUrl(null);
    setFileMetadata(null);
    setSessionId(null);
    setFindings(null);
    setSelectedPage('all');
    setSelectedFindingIds(new Set());
    setSanitizeResult(null);
    setErrorMessage(null);
    setScanWarning(null);
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-zinc-700/30 text-zinc-400 border-zinc-700';
    }
  };

  const unselectedCriticalCount =
    findings?.filter(
      (f) => f.severity === 'critical' && !selectedFindingIds.has(f.id)
    ).length ?? 0;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-5">
      {/* If sanitization result is ready, display SanitizedOutputView */}
      {sanitizeResult !== null ? (
        <SanitizedOutputView
          originalText={inputText}
          sanitizeResult={sanitizeResult}
          fileType={activeMode}
          onEditSelection={() => setSanitizeResult(null)}
          onNewScan={handleReset}
        />
      ) : (
        <>
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => {
                setActiveMode('text');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'text'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Text Prompt Scan
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('image');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'image'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Image Masking (M5)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('pdf');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'pdf'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              PDF Redaction (M6)
            </button>
          </div>

          {/* Text Mode */}
          {activeMode === 'text' && (
            <form onSubmit={handleScanText} className="flex flex-col gap-3">
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste prompt or text to analyze for PII and credentials..."
                  rows={4}
                  disabled={isScanning || isSanitizing}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-y min-h-[110px]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setInputText(samplePrompt);
                    setFindings(null);
                    setSanitizeResult(null);
                  }}
                  className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Load sample prompt with PII & secrets
                </button>

                <div className="flex items-center gap-2">
                  {findings !== null && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isScanning || isSanitizing || !inputText.trim()}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-white transition-all shadow-sm hover:shadow-violet-500/25 flex items-center gap-2 cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        Scan Text
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Image Mode */}
          {activeMode === 'image' && (
            <div className="flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {!uploadedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-violet-500 hover:bg-violet-950/10 transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Click to upload image file</p>
                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG, or WEBP (Max 10MB)</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-medium text-zinc-200 truncate max-w-xs">
                        {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      {fileMetadata && (
                        <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800/60 px-1.5 py-0.5 rounded">
                          {fileMetadata.image_width}×{fileMetadata.image_height} {fileMetadata.content_type}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setFilePreviewUrl(null);
                        setFindings(null);
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {filePreviewUrl && (
                    <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-black flex justify-center max-h-60">
                      <img src={filePreviewUrl} alt="Upload preview" className="object-contain h-full" />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleScanFile}
                      disabled={isScanning}
                      className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-medium text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Processing OCR & Scanning...
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          Analyze Image (M5)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF Mode */}
          {activeMode === 'pdf' && (
            <div className="flex flex-col gap-3">
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {!uploadedFile ? (
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-violet-500 hover:bg-violet-950/10 transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Click to upload PDF document</p>
                    <p className="text-xs text-zinc-500 mt-1">Selectable text & scanned page OCR fallback (Max 10MB)</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-medium text-zinc-200 truncate max-w-xs">
                        {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      {fileMetadata?.page_count && (
                        <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800/60 px-1.5 py-0.5 rounded">
                          {fileMetadata.page_count} page(s)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setFindings(null);
                        setSelectedPage('all');
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleScanFile}
                      disabled={isScanning}
                      className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-medium text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Extracting Pages & OCR Scanning...
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          Analyze PDF (M6)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scan Warning (e.g. Incomplete scan notice) */}
          {scanWarning && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{scanWarning}</span>
            </div>
          )}

          {/* Error state */}
          {errorMessage && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Review & Findings Approval Panel */}
          {findings !== null && (
            <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-zinc-100">Review & Approve Transformations</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-zinc-600">·</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 ml-1">
                    {selectedFindingIds.size} / {findings.length} approved
                  </span>
                </div>
              </div>

              {/* Warning if critical secrets were unchecked */}
              {unselectedCriticalCount > 0 && (
                <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>
                    Warning: {unselectedCriticalCount} critical credential(s) left unapproved. They will NOT be redacted!
                  </span>
                </div>
              )}

              {/* PDF Page Navigation & Filter */}
              {activeMode === 'pdf' && fileMetadata?.page_count && fileMetadata.page_count > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-zinc-500 text-[11px] mr-1 shrink-0">Filter Page:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPage('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                      selectedPage === 'all'
                        ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    All Pages ({findings.length})
                  </button>
                  {Array.from({ length: fileMetadata.page_count }, (_, i) => i + 1).map((pNum) => {
                    const countOnPage = findings.filter((f) => f.page_number === pNum).length;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setSelectedPage(pNum)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                          selectedPage === pNum
                            ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Page {pNum} ({countOnPage})
                      </button>
                    );
                  })}
                </div>
              )}

              {findings.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-center text-zinc-400">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                  <p className="text-sm font-medium text-zinc-200">No sensitive entities found</p>
                  <p className="text-xs text-zinc-500">
                    {activeMode === 'image'
                      ? 'No sensitive entities detected in extracted OCR text.'
                      : activeMode === 'pdf'
                      ? 'No sensitive entities detected in PDF selectable text or scanned pages.'
                      : 'The provided text did not trigger any PII or secret recognizers.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {(selectedPage === 'all'
                    ? findings
                    : findings.filter((f) => f.page_number === selectedPage)
                  ).map((f) => {
                    const snippet = inputText.slice(f.start, f.end);
                    const isSelected = selectedFindingIds.has(f.id);
                    return (
                      <div
                        key={f.id}
                        onClick={() => handleToggleFinding(f.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs select-none ${
                          isSelected
                            ? 'bg-zinc-950/80 border-violet-800/40'
                            : 'bg-zinc-950/30 border-zinc-800/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-violet-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getSeverityBadgeClass(
                              f.severity
                            )}`}
                          >
                            {f.severity.toUpperCase()}
                          </span>
                          <span className="font-mono text-zinc-300 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                            {f.entity_type}
                          </span>
                          {f.page_number && (
                            <span className="text-[10px] text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-1.5 py-0.5 rounded font-mono">
                              Page {f.page_number}
                            </span>
                          )}
                          {f.bounding_boxes && f.bounding_boxes.length > 0 && (
                            <span className="text-[10px] text-sky-400 bg-sky-950/60 border border-sky-800/50 px-1.5 py-0.5 rounded font-mono">
                              {f.bounding_boxes.length} box(es)
                            </span>
                          )}
                          <span className="text-zinc-400 font-mono truncate max-w-xs" title={snippet}>
                            "{snippet}"
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                          <span className="text-zinc-500">→</span>
                          <span className="font-mono text-violet-300 bg-violet-950/60 border border-violet-800/50 px-2 py-0.5 rounded">
                            {f.replacement}
                          </span>
                          {f.confidence !== null && (
                            <span className="text-[10px] text-zinc-500" title="Detector confidence">
                              {Math.round(f.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sanitize Action Button */}
              {findings.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span className="text-xs text-zinc-500">
                    {activeMode === 'pdf'
                      ? 'Approved text & vector streams will be physically purged and verified from the PDF.'
                      : activeMode === 'image'
                      ? 'Approved regions will have opaque black pixels applied permanently.'
                      : 'Only checked items will be replaced.'}
                  </span>
                  <button
                    type="button"
                    onClick={handleApplySanitization}
                    disabled={isSanitizing}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-medium text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSanitizing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Sanitizing & Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5" />
                        {activeMode === 'pdf'
                          ? 'Redact PDF Document (M6)'
                          : activeMode === 'image'
                          ? 'Redact Image (M5)'
                          : 'Apply Sanitization (M4)'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
