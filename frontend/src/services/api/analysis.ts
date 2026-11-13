/**
 * Text analysis API service.
 */
import { apiClient } from './client';
import type { AnalyzeTextRequest, AnalyzeTextResponse } from '../../types';

export async function analyzeText(req: AnalyzeTextRequest): Promise<AnalyzeTextResponse> {
  return apiClient.post<AnalyzeTextResponse>('/analyze/text', req);
}

