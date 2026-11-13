/**
 * AI Handoff API service.
 * Handles preparation preview and confirmed dispatch to mock AI providers.
 */
import { apiClient } from './client';
import type {
  HandoffPrepareRequest,
  HandoffPrepareResponse,
  HandoffSendRequest,
  HandoffSendResponse,
} from '../../types/api';

export async function prepareHandoff(
  req: HandoffPrepareRequest
): Promise<HandoffPrepareResponse> {
  return apiClient.post<HandoffPrepareResponse>('/handoff/prepare', req);
}

export async function sendHandoff(
  req: HandoffSendRequest
): Promise<HandoffSendResponse> {
  return apiClient.post<HandoffSendResponse>('/handoff/send', req);
}

