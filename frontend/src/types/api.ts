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

// ── Sanitization & Sessions (M4) ──────────────────────────────────────────────
export interface SanitizeRequest {
  approved_finding_ids: string[];
}

export interface SanitizeResponse {
  sanitized_text: string;
  applied_count: number;
  skipped_count: number;
  all_sanitized: boolean;
  has_unredacted_credentials: boolean;
}

export interface SessionResponse {
  session_id: string;
  findings: Finding[];
  created_at: string;
  expires_at: string;
}
