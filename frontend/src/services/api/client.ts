/**
 * Base API client using native fetch.
 * Base URL read from VITE_API_BASE_URL env var (falls back to /api/v1 for proxy).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export class ApiClientError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(`API error ${status}: ${detail}`);
    this.name = 'ApiClientError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = 2,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> ?? {}),
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const body = await response.json();
          if (typeof body?.detail === 'string') detail = body.detail;
        } catch {
          // ignore parse errors
        }

        // Retry on 502, 503, 504 server errors if attempts remain
        if ([502, 503, 504].includes(response.status) && attempt < retries) {
          await new Promise((res) => setTimeout(res, 300 * Math.pow(2, attempt)));
          continue;
        }

        throw new ApiClientError(response.status, detail);
      }

      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return response.json() as Promise<T>;
    } catch (err) {
      lastError = err;
      // Do not retry client 4xx errors
      if (err instanceof ApiClientError && err.status < 500) {
        throw err;
      }
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, 300 * Math.pow(2, attempt)));
      }
    }
  }

  if (lastError instanceof ApiClientError) {
    throw lastError;
  }
  throw new Error(
    lastError instanceof Error ? lastError.message : 'Network request failed after retries.'
  );
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, {
      method: 'POST',
      body: formData,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
