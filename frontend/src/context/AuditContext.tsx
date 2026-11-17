import React, { useState, useEffect, useCallback } from 'react';
import {
  AuditContext,
  type AuditLogEntry,
  type MaskingSessionRecord,
} from './AuditTypes';

const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    user: { name: 'Admin', role: 'Owner', initials: 'WS' },
    entityId: 'ses-94821a00...',
    action: 'SANITIZE',
    type: 'PDF Document',
    environment: 'Master',
    timestamp: 'Today, 14:20',
    details: 'Redacted 8 sensitive findings with cross-page vector sweep',
  },
  {
    id: 'log-2',
    user: { name: 'Admin', role: 'Owner', initials: 'WS' },
    entityId: 'ses-42019b88...',
    action: 'SANITIZE',
    type: 'Text Prompt',
    environment: 'Master',
    timestamp: 'Yesterday, 18:05',
    details: 'Masked API keys and customer phone numbers',
  },
];

const initialSessions: MaskingSessionRecord[] = [
  {
    sessionId: 'session-demo-01',
    fileType: 'pdf',
    originalText: 'Confidential Patient & Employee Record...',
    originalFileName: 'Patient_Onboarding_2024.pdf',
    findings: [],
    sanitizeResult: {
      sanitized_text: 'Redacted PDF Artifact',
      applied_count: 8,
      skipped_count: 0,
      all_sanitized: true,
      has_unredacted_credentials: false,
    },
    timestamp: 'Today, 14:20',
  },
  {
    sessionId: 'session-demo-02',
    fileType: 'text',
    originalText: 'Hello Alice, server key sk-live...',
    findings: [],
    sanitizeResult: {
      sanitized_text: 'Hello [PERSON_1], server key [KEY_1]...',
      applied_count: 3,
      skipped_count: 0,
      all_sanitized: true,
      has_unredacted_credentials: false,
    },
    timestamp: 'Yesterday, 18:05',
  },
];

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('rapit_audit_logs');
      return stored ? JSON.parse(stored) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  const [currentMaskingSession, setCurrentMaskingSessionState] = useState<MaskingSessionRecord | null>(() => {
    try {
      const stored = sessionStorage.getItem('rapit_current_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [recentSessions, setRecentSessions] = useState<MaskingSessionRecord[]>(() => {
    try {
      const stored = localStorage.getItem('rapit_recent_sessions');
      return stored ? JSON.parse(stored) : initialSessions;
    } catch {
      return initialSessions;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rapit_audit_logs', JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('rapit_recent_sessions', JSON.stringify(recentSessions));
    } catch {
      // ignore
    }
  }, [recentSessions]);

  const setCurrentMaskingSession = useCallback((session: MaskingSessionRecord | null) => {
    setCurrentMaskingSessionState(session);
    try {
      if (session) {
        sessionStorage.setItem('rapit_current_session', JSON.stringify(session));
        setRecentSessions((prev) => {
          const filtered = prev.filter((s) => s.sessionId !== session.sessionId);
          return [session, ...filtered].slice(0, 30);
        });
      } else {
        sessionStorage.removeItem('rapit_current_session');
      }
    } catch {
      // ignore
    }
  }, []);

  const addAuditLog = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const formattedDate =
      now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' ' +
      now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const newLog: AuditLogEntry = {
      ...entry,
      id: 'log-' + Date.now(),
      timestamp: formattedDate,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  }, []);

  return (
    <AuditContext.Provider
      value={{
        auditLogs,
        addAuditLog,
        currentMaskingSession,
        setCurrentMaskingSession,
        recentSessions,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};
