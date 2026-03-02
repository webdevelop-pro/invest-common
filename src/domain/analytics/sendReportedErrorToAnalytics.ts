import type { NormalizedError } from 'InvestCommon/domain/error/errorReporting';
import { useRepositoryAnalytics } from 'InvestCommon/data/analytics/analytics.repository';
import { AnalyticsLogLevel } from 'InvestCommon/data/analytics/analytics.type';
import env from 'InvestCommon/domain/config/env';
import { buildHttpRequest, getClientContext, normalizeGroupMessage } from 'InvestCommon/domain/analytics/useAnalyticsError';

const isAnalyticsEnabled = env.ENABLE_ANALYTICS === '1';

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

/**
 * Sends a reported error (from reportError) to the analytics log.
 * Use as setErrorLogger at app bootstrap so every user-facing error is recorded.
 * Respects VITE_ENABLE_ANALYTICS=1; skips when analytics disabled or user agent is a bot.
 */
export function sendReportedErrorToAnalytics(
  normalized: NormalizedError,
  fallbackMessage: string,
): void {
  if (!isAnalyticsEnabled || !shouldReportToAnalytics()) return;

  try {
    const analytics = useRepositoryAnalytics();
    const httpRequest = buildHttpRequest();
    const errorLabel = [fallbackMessage, normalized.message].filter(Boolean).join(': ');
    void analytics.setMessage({
      time: new Date().toISOString(),
      level: AnalyticsLogLevel.ERROR,
      message: normalizeGroupMessage(normalized.message),
      error: errorLabel,
      data: {
        component: 'reportError',
        caller: ['reportError', fallbackMessage, normalized.code ?? '', String(normalized.statusCode ?? '')],
        stack: [],
        serviceContext: {
          httpRequest,
          service_name: 'vue3-app',
        },
        client: getClientContext(),
      },
    }).catch(() => {
      // Analytics failures must not break the app
    });
  } catch {
    // Composable or env not available (e.g. SSR); ignore
  }
}
