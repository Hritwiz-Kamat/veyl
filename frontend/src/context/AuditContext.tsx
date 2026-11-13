import React, { useState, useEffect } from 'react';
import {
  AuditContext,
  type AuditLogEntry,
  type MaskingSessionRecord,
} from './AuditTypes';

const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    user: { name: 'Fabian Beliza', role: 'Owner', initials: 'FB' },
    entityId: 'ck6h756e49000001...',
    action: 'UPDATE',
    type: 'Webhook',
    environment: 'Master',
    timestamp: '29 Jun 2020 21:37',
    details: 'Configured local dispatch endpoint for sanitized streams',
  },
  {
    id: 'log-2',
    user: { name: 'Fabian Beliza', role: 'Owner', initials: 'FB' },
    entityId: 'ck3h756e49000002...',
    action: 'UPDATE',
    type: 'Model',
    environment: 'Master',
    timestamp: '29 Jun 2020 21:05',
    details: 'Updated detection threshold and PII regex policies',
  },
  {
    id: 'log-3',
    user: { name: 'Michael Lukaszczyk', role: 'Admin', initials: 'ML' },
    entityId: 'tj23656e45000003...',
    action: 'UNPUBLISH',
    type: 'Content',
    environment: 'Master',
    timestamp: '29 Jun 2020 20:04',
    details: 'Revoked raw text prompt payload with unredacted API key',
  },
  {
    id: 'log-4',
    user: { name: 'Ronak Ganatra', role: 'Editor', initials: 'RG' },
    entityId: 'tj23656e45000004...',
    action: 'PUBLISH',
    type: 'Content',
    environment: 'Master',
    timestamp: '27 Jun 2020 16:32',
    details: 'Approved sanitization of patient medical summary',
  },
  {
    id: 'log-5',
    user: { name: 'Darshan Gajara', role: 'Contributor', initials: 'DG' },
    entityId: 'a901a2cb-2000005...',
    action: 'CREATE',
    type: 'Model',
    environment: 'Staging',
    timestamp: '27 Jun 2020 12:07',
    details: 'Initiated OCR bounding box verification benchmark',
  },
  {
    id: 'log-6',
    user: { name: 'Fabian Beliza', role: 'Owner', initials: 'FB' },
    entityId: 'zu12856e49000006...',
    action: 'DELETE',
    type: 'Model',
    environment: 'Master',
    timestamp: '21 Jun 2020 07:21',
    details: 'Purged deprecated regex rule for legacy tokens',
  },
  {
    id: 'log-7',
    user: { name: 'Michael Lukaszczyk', role: 'Admin', initials: 'ML' },
    entityId: 'zu12856e49000007...',
    action: 'CREATE',
    type: 'Model',
    environment: 'Staging',
    timestamp: '07 May 2020 09:18',
    details: 'Added spaCy en_core_web_sm named entity recognizer',
  },
  {
    id: 'log-8',
    user: { name: 'Michael Lukaszczyk', role: 'Admin', initials: 'ML' },
    entityId: 'zu12856e49000008...',
    action: 'CREATE',
    type: 'Content',
    environment: 'Master',
    timestamp: '04 May 2020 07:21',
    details: 'Batch sanitized 12 employee onboarding documents',
  },
  {
    id: 'log-9',
    user: { name: 'Ronak Ganatra', role: 'Editor', initials: 'RG' },
    entityId: 'ek157563h7000009...',
    action: 'DELETE',
    type: 'Content',
    environment: 'Staging',
    timestamp: '25 Apr 2020 13:47',
    details: 'Removed expired session cache from in-memory store',
  },
  {
    id: 'log-10',
    user: { name: 'Ronak Ganatra', role: 'Editor', initials: 'RG' },
    entityId: 'ek157563h7000010...',
    action: 'UPDATE',
    type: 'Content',
    environment: 'Staging',
    timestamp: '25 Apr 2020 09:33',
    details: 'Approved destructive pixel masking for uploaded ID card',
  },
];

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('veyl_audit_logs');
      return stored ? JSON.parse(stored) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  const [currentMaskingSession, setCurrentMaskingSession] = useState<MaskingSessionRecord | null>(() => {
    try {
      const stored = sessionStorage.getItem('veyl_current_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [recentSessions] = useState<MaskingSessionRecord[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('veyl_audit_logs', JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      if (currentMaskingSession) {
        sessionStorage.setItem('veyl_current_session', JSON.stringify(currentMaskingSession));
      } else {
        sessionStorage.removeItem('veyl_current_session');
      }
    } catch {
      // ignore
    }
  }, [currentMaskingSession]);

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
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
  };

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
