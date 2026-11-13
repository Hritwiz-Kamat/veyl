import { useContext } from 'react';
import { AuditContext } from '../context/AuditTypes';

export const useAudit = () => {
  const ctx = useContext(AuditContext);
  if (!ctx) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return ctx;
};
