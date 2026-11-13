/**
 * Shared API response types.
 * Kept in sync with backend Pydantic schemas.
 */

// ── Health ────────────────────────────────────────────────────────────────────
export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string; // ISO 8601 UTC
}

// ── Generic API error ─────────────────────────────────────────────────────────
export interface ApiError {
  detail: string;
}

// ── Analysis ──────────────────────────────────────────────────────────────────
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Finding {
  id: string;
  entity_type: string;
  start: number;
  end: number;
  replacement: string;
  severity: Severity;
  confidence: number | null;
  source: string;
  selected_by_default: boolean;
  bounding_boxes?: BoundingBox[];
  page_number?: number;
}

export interface AnalyzeTextRequest {
  text: string;
}

export interface AnalysisStats {
  total_findings: number;
  has_credentials: boolean;
  entity_counts: Record<string, number>;
}

export interface AnalyzeTextResponse {
  session_id: string;
  findings: Finding[];
  stats?: AnalysisStats;
}

export interface FileMetadata {
  filename: string;
  content_type: string;
  size_bytes: number;
  image_width?: number;
  image_height?: number;
  page_count?: number;
}

export interface AnalyzeFileResponse {
  session_id: string;
  file_type: string;
  metadata: FileMetadata;
  extracted_text: string;
  findings: Finding[];
  stats?: AnalysisStats;
  is_incomplete_scan: boolean;
  scan_warning?: string;
}

// ── Sanitization & Sessions ───────────────────────────────────────────────────
export interface SanitizeRequest {
  approved_finding_ids: string[];
}

export interface SanitizeResponse {
  sanitized_text: string;
  applied_count: number;
  skipped_count: number;
  all_sanitized: boolean;
  has_unredacted_credentials: boolean;
  artifact_id?: string;
  artifact_download_url?: string;
}

export interface SessionResponse {
  session_id: string;
  file_type: string;
  original_file_path?: string;
  findings: Finding[];
  created_at: string;
  expires_at: string;
  artifact_id?: string;
}

// ── AI Handoff (M8) ───────────────────────────────────────────────────────────
export interface HandoffPrepareRequest {
  session_id: string;
  destination: string;
}

export interface HandoffPrepareResponse {
  session_id: string;
  destination: string;
  destination_name: string;
  sanitized_content: string;
  char_count: number;
  has_unredacted_credentials: boolean;
  can_handoff: boolean;
  warning?: string;
}

export interface HandoffSendRequest {
  session_id: string;
  destination: string;
  confirmed: boolean;
}

export interface HandoffSendResponse {
  session_id: string;
  destination: string;
  provider_name: string;
  status: string;
  simulated_response: string;
  timestamp: string;
}
