import { setErrorHandlers, setErrorLogger, reportError } from 'InvestCommon/domain/error/errorReporting';
import { redirectToSigninForUnauthorized } from 'InvestCommon/domain/redirects/redirectAuthGuard';
import { urlServerError } from 'InvestCommon/domain/config/links';
import { sendReportedErrorToAnalytics } from 'InvestCommon/domain/analytics/sendReportedErrorToAnalytics';
import { isIgnorableError } from 'InvestCommon/domain/error/ignorableErrors';

declare global {
  interface Window {
    __VITEPRESS__?: {
      error?: (error: Error) => void;
      router?: { onError?: (error: Error) => void };
      pageTransition?: (...args: unknown[]) => Promise<unknown>;
    };
  }
}

type VueApp = { config?: { errorHandler?: (err: Error, vm: unknown, info: string) => void } };

export interface ErrorHandlerConfig {
  appType: 'vue' | 'vitepress';
}

/** Coerce unknown (e.g. unhandledrejection.reason) to Error for global handlers. */
function toError(value: unknown, fallback: string): Error {
  if (value instanceof Error) return value;
  return new Error(typeof value === 'string' ? value : fallback);
}

export const setupUnifiedErrorHandler = () => {
  if (typeof window === 'undefined') return;

  const isFatal = (e: Error) => (e as { isFatal?: boolean }).isFatal === true;

  const handleError = (error: Error) => {
    if (isIgnorableError(error)) return;
    // Global/unhandled errors: log to analytics but do not show a user-facing toast.
    reportError(error, 'Something went wrong', { source: 'global', silent: true });
    if (isFatal(error) && !window.location.pathname.endsWith('/500')) {
      setTimeout(() => window.location.replace(urlServerError), 500);
    }
  };

  const setupGlobalHandlers = () => {
    window.addEventListener('unhandledrejection', (e) =>
      handleError(toError(e.reason, 'Unhandled Promise Rejection')));
    window.addEventListener('error', (e) => {
      const target = (e as Event).target as unknown;
      if (target && typeof window !== 'undefined' && target instanceof window.HTMLImageElement) {
        // Swallow image load errors completely: they are noisy and not actionable.
        if (typeof (e as Event).preventDefault === 'function') {
          (e as Event).preventDefault();
        }
        return;
      }
      const errorEvent = e as ErrorEvent;
      handleError(toError(errorEvent.error ?? errorEvent.message, 'Unknown error'));
    });
  };

  const setupVueHandler = (app?: VueApp) => {
    if (!app?.config) return;
    app.config.errorHandler = (err) => handleError(err);
  };

  const setupVitePressHandler = () => {
    if (!window.__VITEPRESS__) return;

    if (window.__VITEPRESS__.error) {
      const orig = window.__VITEPRESS__.error;
      window.__VITEPRESS__.error = (error) => {
        handleError(error);
        orig(error);
      };
    }

    if (window.__VITEPRESS__.router?.onError) {
      const orig = window.__VITEPRESS__.router.onError;
      window.__VITEPRESS__.router.onError = (error) => {
        handleError(error);
        orig(error);
      };
    }

    if (window.__VITEPRESS__.pageTransition) {
      const orig = window.__VITEPRESS__.pageTransition;
      window.__VITEPRESS__.pageTransition = async (...args: unknown[]) => {
        try {
          return await orig(...args);
        } catch (error) {
          if (error instanceof Error) handleError(error);
          throw error;
        }
      };
    }

    const Vue = (window as unknown as { Vue?: { config?: { errorHandler?: (err: Error, vm: unknown) => void } } }).Vue;
    if (Vue?.config) {
      const orig = Vue.config.errorHandler;
      Vue.config.errorHandler = (error, vm) => {
        handleError(error);
        orig?.(error, vm);
      };
    }
  };

  const initialize = (app?: VueApp) => {
    setupGlobalHandlers();
    setupVitePressHandler();
    setupVueHandler(app);
  };

  return { initialize };
};

export const setupVueErrorHandler = (app?: unknown) => {
  setupUnifiedErrorHandler()?.initialize(app as VueApp);
};

export const setupVitePressErrorHandler = () => {
  setupUnifiedErrorHandler()?.initialize();
};

// ---------------------------------------------------------------------------
// Single bootstrap: use this in main.ts / VitePress entry (by the book)
// ---------------------------------------------------------------------------

export type ErrorHandlingAppType = 'vue' | 'vitepress';

export interface SetupErrorHandlingOptions {
  /** Vue app instance (for type 'vue'); omit for VitePress. */
  app?: unknown;
  /** 'vue' = Vue app + global handlers; 'vitepress' = VitePress + global handlers. */
  type: ErrorHandlingAppType;
  /** 401 redirect. Default for Vue: redirect to sign-in. Omit for VitePress if not needed. */
  onUnauthorized?: () => void;
}

/**
 * Single bootstrap for error handling. Call once at app entry.
 *
 * What we log (send to analytics + toast):
 * - Caught errors: any code that calls reportError() → default reporter → setErrorLogger (analytics) → toast (unless 401).
 * - Uncaught errors: unhandledrejection, window.error, Vue/VitePress errorHandler → reportError() → same path.
 *
 * What we do not log (ignorable, no toast, no analytics):
 * - ResizeObserver loop/limit errors (browser quirk, no user impact).
 * - AbortError / canceled (user or code aborted request).
 * - Chunk load failures (handled separately by chunkErrorHandler; avoids duplicate noise).
 *
 * How we log:
 * - setErrorLogger(sendReportedErrorToAnalytics): sends to analytics when VITE_ENABLE_ANALYTICS=1, skips bots.
 * - Fatal errors (error.isFatal === true) also redirect to 500.
 *
 * Skips when VITE_ENV=local. Works for both Vue app and VitePress.
 */
export function setupErrorHandling(options: SetupErrorHandlingOptions): void {
  if (typeof window === 'undefined') return;

  const { app, type, onUnauthorized } = options;
  setErrorHandlers(onUnauthorized ? { onUnauthorized } : type === 'vue' ? { onUnauthorized: redirectToSigninForUnauthorized } : {});
  setErrorLogger(sendReportedErrorToAnalytics);
  setupUnifiedErrorHandler()?.initialize(app as VueApp);
}
