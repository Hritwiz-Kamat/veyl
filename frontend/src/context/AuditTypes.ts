import { createContext } from 'react';
import type { Finding, SanitizeResponse } from '../types';

export interface AuditLogEntry {
  id: string;
  user: {
    name: string;
    role: string;
    avatarUrl?: string;
    initials: string;
  };
  entityId: string;
  action: 'UPDATE' | 'UNPUBLISH' | 'PUBLISH' | 'CREATE' | 'DELETE' | 'REDACT' | 'SANITIZE';
  type: string;
  environment: 'Master' | 'Staging';
  timestamp: string;
  details?: string;
}

export interface MaskingSessionRecord {
  sessionId: string;
  fileType: 'text' | 'image' | 'pdf';
  originalText: string;
  originalFileName?: string;
  originalFilePreviewUrl?: string;
  findings: Finding[];
  sanitizeResult?: SanitizeResponse;
  timestamp: string;
}

export interface AuditContextType {
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  currentMaskingSession: MaskingSessionRecord | null;
  setCurrentMaskingSession: (session: MaskingSessionRecord | null) => void;
  recentSessions: MaskingSessionRecord[];
}

export const AuditContext = createContext<AuditContextType | undefined>(undefined);

