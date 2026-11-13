/**
 * Text and file analysis API service.
 */
import { apiClient } from './client';
import type {
  AnalyzeTextRequest,
  AnalyzeTextResponse,
  AnalyzeFileResponse,
} from '../../types';

export async function analyzeText(req: AnalyzeTextRequest): Promise<AnalyzeTextResponse> {
  return apiClient.post<AnalyzeTextResponse>('/analyze/text', req);
}

export async function analyzeFile(file: File): Promise<AnalyzeFileResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.upload<AnalyzeFileResponse>('/analyze/file', formData);
}
