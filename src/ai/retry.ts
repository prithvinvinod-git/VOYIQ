/**
 * Retry utility for Genkit AI calls.
 * Handles 503 (model overloaded) and 429 (rate limit) errors
 * with exponential backoff.
 */

const RETRYABLE_CODES = new Set(['UNAVAILABLE', 'RESOURCE_EXHAUSTED']);
const RETRYABLE_HTTP = new Set([429, 503]);

interface RetryOptions {
  maxAttempts?: number;    // default 3
  baseDelayMs?: number;    // default 1000ms
  maxDelayMs?: number;     // default 16000ms
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 16000 } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      const isRetryable =
        RETRYABLE_CODES.has(err?.status) ||
        RETRYABLE_HTTP.has(err?.code) ||
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('UNAVAILABLE');

      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }

      // Exponential backoff with jitter: 1s, 2s, 4s … capped at maxDelayMs
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      const jitter = Math.random() * 500;
      console.warn(
        `[AI] Attempt ${attempt}/${maxAttempts} failed (${err?.status ?? err?.code}). ` +
        `Retrying in ${Math.round(delay + jitter)}ms…`
      );
      await new Promise((res) => setTimeout(res, delay + jitter));
    }
  }

  throw lastError;
}
