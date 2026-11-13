/**
 * Sessions and sanitization API service.
 */
import { apiClient } from './client';
import type { SanitizeRequest, SanitizeResponse, SessionResponse } from '../../types';

export async function getSession(sessionId: string): Promise<SessionResponse> {
  return apiClient.get<SessionResponse>(`/sessions/${sessionId}`);
}

export async function sanitizeSession(
  sessionId: string,
  req: SanitizeRequest
): Promise<SanitizeResponse> {
  return apiClient.post<SanitizeResponse>(`/sessions/${sessionId}/sanitize`, req);
}

export async function deleteSession(sessionId: string): Promise<void> {
  return apiClient.delete<void>(`/sessions/${sessionId}`);
}

