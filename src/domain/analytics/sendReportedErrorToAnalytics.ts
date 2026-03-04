import type { NormalizedError } from 'InvestCommon/domain/error/errorReporting';
import { useRepositoryAnalytics } from 'InvestCommon/data/analytics/analytics.repository';
import { AnalyticsLogLevel } from 'InvestCommon/data/analytics/analytics.type';
import env from 'InvestCommon/config/env';
import {
  buildHttpRequest,
  getClientContext,
  normalizeGroupMessage,
  resolveComponentNameFromStack,
} from 'InvestCommon/domain/analytics/useAnalyticsError';
import type { HttpRequestLike } from 'InvestCommon/domain/analytics/useAnalyticsError';
import { isIgnorableErrorMessage } from 'InvestCommon/domain/error/ignorableErrors';

const isAnalyticsEnabled = env.ENABLE_ANALYTICS === '1';

/**
 * Optional structured context passed by the caller.
 * All fields are sanitized before being sent to analytics.
 */
export interface AnalyticsErrorContext {
  component?: string;
  caller?: unknown[];
  stack?: string[];
  /**
   * Optional HTTP request data, typically from APIError.data.httpRequest.
   * When provided, it is merged via buildHttpRequest to ensure consistent shape.
   */
  httpRequest?: Partial<HttpRequestLike>;
}

/**
 * Allows each app (Vue, Vitepress, etc.) to provide its own analytics service name
 * without duplicating the error reporting logic.
 */
export interface SendReportedErrorOptions extends AnalyticsErrorContext {
  serviceName?: string;
}

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /AhrefsBot/i,
  /googlebot/i,
  /bingbot/i,
];

function shouldReportToAnalytics(): boolean {
  if (typeof navigator === 'undefined') return false;
  return !BOT_PATTERNS.some((p) => p.test(navigator.userAgent));
}

function sanitizeText(raw: unknown): string {
  if (raw == null) return '';
  const text = String(raw);

  // Basic PII / noise filtering: emails and very long digit sequences.
  let sanitized = text
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]')
    .replace(/\d{10,}/g, '[redacted-number]');

  // Avoid overly long payload pieces.
  if (sanitized.length > 500) {
    sanitized = `${sanitized.slice(0, 497)}…`;
  }

  return sanitized;
}

function sanitizeComponent(component?: string): string {
  const fallback = 'reportError';
  if (!component) return fallback;
  const sanitized = sanitizeText(component).trim();
  return sanitized || fallback;
}

function sanitizeCaller(
  caller?: unknown[],
  fallbackMessage?: string,
  normalized?: NormalizedError,
  component?: string,
): string[] {
  const baseCaller = [
    component || 'reportError',
    fallbackMessage,
    normalized?.code ?? '',
    String(normalized?.statusCode ?? ''),
  ]
    .filter((v) => v != null && v !== '') as string[];

  if (!caller || caller.length === 0) {
    return baseCaller.map((c) => sanitizeText(c));
  }

  const userProvided = caller
    .map((item) => sanitizeText(item))
    .filter((item) => item !== '');

  const combined = userProvided.length > 0 ? userProvided : baseCaller;

  // Limit depth to avoid very long arrays.
  return combined.slice(0, 10);
}

function sanitizeStack(stack?: string[]): string[] {
  if (!stack || stack.length === 0) return [];

  // Only keep the top part of the stack and sanitize each line.
  return stack
    .slice(0, 15)
    .map((line) => sanitizeText(line))
    .filter((line) => line !== '');
}

/**
 * Sends a reported error (from reportError) to the analytics log.
 * Use as setErrorLogger at app bootstrap so every user-facing error is recorded.
 * Respects VITE_ENABLE_ANALYTICS=1; skips when analytics disabled or user agent is a bot.
 *
 * The caller can optionally provide component/caller/stack via options; these are sanitized
 * and merged with sensible defaults before sending to analytics.
 */
export function sendReportedErrorToAnalytics(
  normalized: NormalizedError,
  fallbackMessage: string,
  options: SendReportedErrorOptions = { serviceName: 'vue3-app' },
): void {
  if (!isAnalyticsEnabled || !shouldReportToAnalytics()) return;

  const combinedMessage = `${fallbackMessage ?? ''} ${normalized.message ?? ''}`;
  if (isIgnorableErrorMessage(combinedMessage)) return;

  try {
    const analytics = useRepositoryAnalytics();
    const httpRequest = buildHttpRequest(options.httpRequest);
    const errorLabel = [fallbackMessage, normalized.message].filter(Boolean).join(': ');

    const stack = sanitizeStack(options.stack);
    const stackString = stack.join('\n');

    const inferredComponent =
      options.component
      ?? (stackString ? resolveComponentNameFromStack(stackString) : undefined);

    const component = sanitizeComponent(inferredComponent);
    const caller = sanitizeCaller(options.caller, fallbackMessage, normalized, component);
    const serviceName =
      options.serviceName ?? (env.IS_STATIC_SITE === '1' ? 'vitepress-app' : 'vue3-app');

    void analytics
      .logMessage({
        time: new Date().toISOString(),
        level: AnalyticsLogLevel.ERROR,
        message: normalizeGroupMessage(normalized.message),
        error: errorLabel,
        data: {
          component,
          caller,
          stack,
          serviceContext: {
            httpRequest,
            service_name: serviceName,
          },
          client: getClientContext(),
        },
      })
      .catch(() => {
        // Analytics failures must not break the app
      });
  } catch {
    // Composable or env not available (e.g. SSR); ignore
  }
}
