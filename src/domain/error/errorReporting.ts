import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useGlobalAlert } from 'UiKit/store/useGlobalAlert';
import { isOfflineReadFailure } from 'InvestCommon/domain/pwa/offlineRead';

/**
 * Error reporting layer: normalize, log, branch (401/429), show toast.
 * Single entry: reportError → normalize → log (setErrorLogger) → 401/429 branching → showErrorToast.
 * Exports: reportError, normalizeError, setErrorLogger, setErrorHandlers, toasterErrorHandling (showErrorToast).
 */

export type ErrorPayload = { message?: string };

/** Optional structured shape for handlers that need to branch (retry, analytics). */
export type NormalizedError = { message: string; code?: string; statusCode?: number };

/** @deprecated Use ErrorPayload. Kept for backwards compatibility. */
export type ErrorResponse = ErrorPayload;

/** Handlers for specific HTTP status codes (e.g. 401 → redirect, 429 → retry). */
export type ErrorHandlers = {
  onUnauthorized?: () => void;
  onRateLimited?: (normalized: NormalizedError) => void;
};

const TOAST_OPTIONS = {
  title: 'Something went wrong',
  description: 'Please try again',
  variant: 'error',
} as const;

/**
 * Normalize any caught error into a user-facing message.
 */
function normalizeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message || fallback;
  if (!error || typeof error !== 'object') return fallback;
  const o = error as Record<string, unknown>;
  if (typeof o.message === 'string') return o.message;
  const data = o.data as { responseJson?: Record<string, unknown> } | undefined;
  const msg = data?.responseJson?.__error__ ?? data?.responseJson?.message;
  if (Array.isArray(msg)) return msg.join('; ');
  if (typeof msg === 'string') return msg;
  return fallback;
}

/**
 * Normalize error to a small shape (message, code, statusCode).
 * Reads statusCode from error.data.statusCode (APIError) or error.data.status.
 */
export function normalizeError(error: unknown, fallbackMessage: string): NormalizedError {
  const message = normalizeErrorMessage(error, fallbackMessage);
  if (!error || typeof error !== 'object') return { message };
  const data = (
    error as {
      data?: {
        responseJson?: { __error__?: string };
        status?: number;
        statusCode?: number;
      };
    }
  ).data;
  const statusCode = typeof data?.statusCode === 'number'
    ? data.statusCode
    : typeof data?.status === 'number'
      ? data.status
      : undefined;
  return {
    message,
    code: typeof data?.responseJson?.__error__ === 'string' ? data.responseJson.__error__ : undefined,
    statusCode,
  };
}

/**
 * Show a single error toast. Call from catch blocks in features/guards.
 * Never throws: if toast is unavailable (e.g. outside Vue context), falls back to console.
 * Prefer reportError() so the default reporter does log-then-show and 401/429 branching.
 */
export const toasterErrorHandling = (error: unknown, fallbackMessage: string) => {
  try {
    const { toast } = useToast();
    const message = normalizeErrorMessage(error, TOAST_OPTIONS.description);
    toast({
      ...TOAST_OPTIONS,
      title: fallbackMessage || TOAST_OPTIONS.title,
      description: message,
    });
  } catch (e) {
    const message = normalizeErrorMessage(error, TOAST_OPTIONS.description);
    if (typeof console?.error === 'function') console.error('[errorReporting]', fallbackMessage || TOAST_OPTIONS.title, message, e);
  }
};

/** Logger called for every reported error (log then show). Set to record errors (e.g. analytics). */
let errorLogger: ((normalized: NormalizedError, fallbackMessage: string, context?: any) => void) | null = null;

/** Optional handlers for specific status codes (401, 429, etc.). Set at app bootstrap. */
let errorHandlers: ErrorHandlers = {};

/**
 * Set a logger for every reported error. Called before the toast (log then show).
 * Use to send errors to analytics or central logging. Reset with setErrorLogger(null).
 * The optional third argument can carry structured context (e.g. AnalyticsErrorContext).
 */
export function setErrorLogger(
  fn: ((normalized: NormalizedError, fallbackMessage: string, context?: any) => void) | null,
) {
  errorLogger = fn;
}

/**
 * Set handlers for specific HTTP status codes (e.g. 401 → redirect to login, 429 → retry).
 * Extend ErrorHandlers to add more codes without changing call sites.
 */
export function setErrorHandlers(handlers: ErrorHandlers) {
  errorHandlers = { ...errorHandlers, ...handlers };
}

/**
 * Default reporter: normalize → log (or console) → branch on statusCode → else toast.
 * Keeps all "log then show" and error-code branching in one place.
 * Optional context is forwarded to errorLogger (e.g. analytics) but not used for UI.
 */
function defaultErrorReporter(error: unknown, fallbackMessage: string, context?: unknown) {
  const normalized = normalizeError(error, fallbackMessage);

  const baseContext = (context as Record<string, unknown> | undefined) ?? {};
  const isSilent = baseContext.silent === true;

  // Enrich context with HTTP request details when available (e.g. APIError.data.httpRequest)
  const httpRequest =
    (error as { data?: { httpRequest?: unknown } })?.data?.httpRequest ?? undefined;

  // Prefer existing stack/httpRequest on context; fall back to values from the error.
  const stackString =
    (error as { data?: { stack?: string } })?.data?.stack
    ?? (error as { stack?: string }).stack
    ?? '';

  const enrichedContext: Record<string, unknown> = { ...baseContext };

  if (httpRequest != null && enrichedContext.httpRequest == null) {
    enrichedContext.httpRequest = httpRequest;
  }

  if (stackString && enrichedContext.stack == null) {
    enrichedContext.stack = stackString.split('\n').slice(0, 15);
  }

  const hasContext = Object.keys(enrichedContext).length > 0;

  if (errorLogger) {
    // Only pass context when we actually have something structured to forward.
    errorLogger(normalized, fallbackMessage, hasContext ? enrichedContext : undefined);
  }
  else if (typeof console?.error === 'function') console.error('[reportError]', fallbackMessage, normalized);

  // For "silent" errors (e.g. global window error handlers), log but do not show any UI.
  if (isSilent) {
    return;
  }

  if (normalized.statusCode === 401 && errorHandlers.onUnauthorized) {
    errorHandlers.onUnauthorized();
    return;
  }
  if (normalized.statusCode === 429) {
    errorHandlers.onRateLimited?.(normalized);
    toasterErrorHandling(error, 'Too many requests. Please try again later.');
    return;
  }
  const statusCode = normalized.statusCode;
  const isServerError = typeof statusCode === 'number' && statusCode >= 500 && statusCode < 600;
  const isFatal = (error as { isFatal?: boolean }).isFatal === true;
  const showGlobalAlertOnServerError =
    (error as { showGlobalAlertOnServerError?: boolean }).showGlobalAlertOnServerError ?? true;

  // For non-fatal core requests that opt in via showGlobalAlertOnServerError (default: true),
  // show a persistent global alert instead of a toast when a 5xx occurs.
  if (isServerError && !isFatal && showGlobalAlertOnServerError) {
    try {
      const globalAlert = useGlobalAlert();
      let details = '';
      if (normalized.message && normalized.message !== fallbackMessage) {
        const trimmed = normalized.message.length > 180 ? `${normalized.message.slice(0, 177)}…` : normalized.message;
        details = ` Details: ${trimmed}`;
      }
      const statusPart = typeof statusCode === 'number' ? ` (status ${statusCode})` : '';
      globalAlert.show({
        variant: 'error',
        title: 'We’re experiencing technical issues',
        message: `A server error occurred${statusPart}. Our services may be temporarily unavailable. Please try again in a few minutes.${details}`,
      });
      return;
    } catch {
      // If global alert store is unavailable, fall back to toast below.
    }
  }

  toasterErrorHandling(error, fallbackMessage);
}

/** Reporter used by reportError. Null = use defaultErrorReporter (log then show + branching). */
let errorReporter: ((error: unknown, fallbackMessage: string, context?: unknown) => void) | null = null;

/**
 * Replace the error reporter (e.g. in tests or for log-then-show).
 * Call with no args or null to reset to default (defaultErrorReporter).
 * The optional third argument can carry structured context (e.g. AnalyticsErrorContext).
 */
export function setErrorReporter(fn?: ((error: unknown, fallbackMessage: string, context?: unknown) => void) | null) {
  errorReporter = fn ?? null;
}

/**
 * Report an error (toast by default). Use this in catch blocks so tests can mock one interface.
 * Uses the reporter set by setErrorReporter, or defaultErrorReporter (log then show + 401/429 branching).
 * Optional context is forwarded to errorLogger (e.g. analytics) but ignored by UI logic.
 * Never throws: if the reporter throws, logs to console and swallows.
 */
export const reportError = (error: unknown, fallbackMessage: string, context?: unknown) => {
  try {
    (errorReporter ?? defaultErrorReporter)(error, fallbackMessage, context);
  } catch (e) {
    if (typeof console?.error === 'function') {
      console.error('[reportError] reporter threw', fallbackMessage, e);
    }
  }
};

/**
 * Report read-only/background request failures only when the browser is online.
 * Offline misses for cached page data are expected and should not surface as toasts.
 */
export const reportOfflineReadError = (error: unknown, fallbackMessage: string, context?: unknown) => {
  if (isOfflineReadFailure(error)) {
    return;
  }

  reportError(error, fallbackMessage, context);
};
