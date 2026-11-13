import { useState, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
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
  ArrowRight,
} from 'lucide-react';
import { analyzeText, analyzeFile, sanitizeSession, deleteSession } from '../../services/api';
import type { Finding, SanitizeResponse, FileMetadata } from '../../types';
import { SanitizedOutputView } from '../sanitization/SanitizedOutputView';
import { useAudit } from '../../hooks/useAudit';

export function TextScanView() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentMaskingSession, addAuditLog } = useAudit();

  const modeParam = (searchParams.get('mode') as 'text' | 'image' | 'pdf') || null;
  const [explicitMode, setExplicitMode] = useState<'text' | 'image' | 'pdf' | null>(null);
  const activeMode = explicitMode ?? modeParam ?? 'text';
  const setActiveMode = (mode: 'text' | 'image' | 'pdf') => setExplicitMode(mode);

  const [selectedPage, setSelectedPage] = useState<number | 'all'>('all');

  const [inputText, setInputText] = useState(() => {
    return (location.state as { initialText?: string })?.initialText || '';
  });

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
    "Hello, my name is Alice Smith and my email is alice@example.com. My OpenAI key is sk-live1234567890abcdefghijklmnopqrstuvwxyz. Please help me refactor my server at 192.168.1.50 with password SuperSecret123!";

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

      setCurrentMaskingSession({
        sessionId: response.session_id,
        fileType: 'text',
        originalText: inputText,
        findings: response.findings,
        timestamp: new Date().toISOString(),
      });
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
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
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

      setCurrentMaskingSession({
        sessionId: response.session_id,
        fileType: response.file_type as 'image' | 'pdf',
        originalText: response.extracted_text,
        originalFileName: uploadedFile.name,
        originalFilePreviewUrl: filePreviewUrl || undefined,
        findings: response.findings,
        timestamp: new Date().toISOString(),
      });
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

      // Record in Audit Context & recent session
      setCurrentMaskingSession({
        sessionId,
        fileType: activeMode,
        originalText: inputText,
        originalFileName: uploadedFile?.name,
        originalFilePreviewUrl: filePreviewUrl || undefined,
        findings: findings || [],
        sanitizeResult: result,
        timestamp: new Date().toISOString(),
      });

      addAuditLog({
        user: { name: 'Elizabeth Keen', role: 'Owner', initials: 'EK' },
        entityId: `${sessionId.slice(0, 14)}...`,
        action: 'SANITIZE',
        type: activeMode === 'text' ? 'Text Prompt' : activeMode === 'image' ? 'Image Masking' : 'PDF Document',
        environment: 'Master',
        details: `Redacted ${result.applied_count} sensitive findings with verification`,
      });
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
        return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const unselectedCriticalCount =
    findings?.filter(
      (f) => f.severity === 'critical' && !selectedFindingIds.has(f.id)
    ).length ?? 0;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* ── Mode Switcher Tabs ── */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveMode('text');
              setErrorMessage(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'text'
                ? 'bg-gray-950 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Text Prompt Scan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('image');
              setErrorMessage(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'image'
                ? 'bg-gray-950 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Masking</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('pdf');
              setErrorMessage(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'pdf'
                ? 'bg-gray-950 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Redaction</span>
          </button>
        </div>

        {sanitizeResult && (
          <button
            type="button"
            onClick={() => {
              if (activeMode === 'text') {
                navigate('/text-output');
              } else {
                navigate('/document-output');
              }
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View Dedicated Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* If sanitization result is ready, display SanitizedOutputView */}
      {sanitizeResult !== null ? (
        <SanitizedOutputView
          sessionId={sessionId}
          originalText={inputText}
          sanitizeResult={sanitizeResult}
          fileType={activeMode}
          onEditSelection={() => setSanitizeResult(null)}
          onNewScan={handleReset}
        />
      ) : (
        <>
          {/* Text Mode */}
          {activeMode === 'text' && (
            <form onSubmit={handleScanText} className="flex flex-col gap-3">
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste prompt or text to analyze for PII and credentials..."
                  rows={5}
                  disabled={isScanning || isSanitizing}
                  className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y min-h-[140px] shadow-2xs font-mono"
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
                  className="text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-2 transition-colors cursor-pointer font-medium"
                >
                  Load sample prompt with PII & secrets
                </button>

                <div className="flex items-center gap-2">
                  {findings !== null && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isScanning || isSanitizing || !inputText.trim()}
                    className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer"
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
                  className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all text-center shadow-2xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Click to upload image file
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, or WEBP (Max 10MB) · Structured word OCR extraction
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-gray-800 truncate max-w-xs">
                        {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      {fileMetadata && (
                        <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded-md">
                          {fileMetadata.image_width}×{fileMetadata.image_height}{' '}
                          {fileMetadata.content_type}
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
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {filePreviewUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex justify-center max-h-64 p-2">
                      <img
                        src={filePreviewUrl}
                        alt="Upload preview"
                        className="object-contain h-full max-h-60 rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleScanFile}
                      disabled={isScanning}
                      className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-black disabled:opacity-50 text-xs font-medium text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Processing OCR & Scanning...
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          Analyze Image
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
                  className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all text-center shadow-2xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Click to upload PDF document
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Selectable text & scanned page OCR fallback (Max 10MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-semibold text-gray-800 truncate max-w-xs">
                        {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      {fileMetadata?.page_count && (
                        <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded-md">
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
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleScanFile}
                      disabled={isScanning}
                      className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-black disabled:opacity-50 text-xs font-medium text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Extracting Pages & OCR Scanning...
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          Analyze PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scan Warning */}
          {scanWarning && (
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{scanWarning}</span>
            </div>
          )}

          {/* Error state */}
          {errorMessage && (
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    if (activeMode === 'text') handleScanText();
                    else handleScanFile();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-200/80 hover:bg-rose-200 text-rose-900 border border-rose-300 font-medium cursor-pointer"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-600 hover:text-rose-800 cursor-pointer text-[11px]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Review & Findings Approval Panel */}
          {findings !== null && (
            <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-bold text-gray-900">
                    Review & Approve Transformations
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-gray-500 hover:text-gray-900 cursor-pointer font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">·</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-gray-500 hover:text-gray-900 cursor-pointer font-medium"
                  >
                    Deselect All
                  </button>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 ml-1 border border-gray-200 font-semibold">
                    {selectedFindingIds.size} / {findings.length} approved
                  </span>
                </div>
              </div>

              {/* Warning if critical secrets unchecked */}
              {unselectedCriticalCount > 0 && (
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    Warning: {unselectedCriticalCount} critical credential(s) left unapproved. They will NOT be redacted!
                  </span>
                </div>
              )}

              {/* PDF Page Navigation */}
              {activeMode === 'pdf' && fileMetadata?.page_count && fileMetadata.page_count > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-gray-400 text-[11px] mr-1 shrink-0">Filter Page:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPage('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                      selectedPage === 'all'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                          selectedPage === pNum
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Page {pNum} ({countOnPage})
                      </button>
                    );
                  })}
                </div>
              )}

              {findings.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <p className="text-sm font-semibold text-gray-900">
                    No sensitive entities found
                  </p>
                  <p className="text-xs text-gray-400">
                    {activeMode === 'image'
                      ? 'No sensitive entities detected in extracted OCR text.'
                      : activeMode === 'pdf'
                      ? 'No sensitive entities detected in PDF selectable text or scanned pages.'
                      : 'The provided text did not trigger any PII or secret recognizers.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
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
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs select-none ${
                          isSelected
                            ? 'bg-indigo-50/40 border-indigo-200 shadow-2xs'
                            : 'bg-gray-50/50 border-gray-200/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getSeverityBadgeClass(
                              f.severity
                            )}`}
                          >
                            {f.severity.toUpperCase()}
                          </span>
                          <span className="font-mono text-gray-700 bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[11px]">
                            {f.entity_type}
                          </span>
                          {f.page_number && (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-mono">
                              Page {f.page_number}
                            </span>
                          )}
                          {f.bounding_boxes && f.bounding_boxes.length > 0 && (
                            <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded font-mono">
                              {f.bounding_boxes.length} box(es)
                            </span>
                          )}
                          <span
                            className="text-gray-500 font-mono truncate max-w-xs"
                            title={snippet}
                          >
                            "{snippet}"
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                          <span className="text-gray-400">→</span>
                          <span className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-semibold">
                            {f.replacement}
                          </span>
                          {f.confidence !== null && (
                            <span className="text-[10px] text-gray-400 font-mono">
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
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
                    className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-black disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
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
                          ? 'Redact PDF Document'
                          : activeMode === 'image'
                          ? 'Redact Image Pixels'
                          : 'Apply Sanitization'}
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
