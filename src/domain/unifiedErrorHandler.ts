import { useRepositoryAnalytics } from 'InvestCommon/data/analytics/analytics.repository';
import { AnalyticsLogLevel } from 'InvestCommon/data/analytics/analytics.type';
import { APIError } from 'InvestCommon/data/service/handlers/apiError';
import { normalizeGroupMessage, resolveComponentName, getClientContext, formatErrorMessage, chooseSafeComponentName } from 'InvestCommon/domain/analytics/useAnalyticsError';
import { urlServerError } from 'InvestCommon/domain/config/links';

// Extend Window interface for VitePress
declare global {
  interface Window {
    __VITEPRESS__?: {
      error?: (error: Error) => void;
      router?: { onError?: (error: Error) => void };
      pageTransition?: (...args: any[]) => Promise<any>;
    };
  }
}

/**
 * Unified error handler configuration
 */
export interface ErrorHandlerConfig {
  appType: 'vue' | 'vitepress';
  serviceName?: string;
  version?: string;
}

/**
 * Unified global error handler for Vue apps and VitePress
 */
export const setupUnifiedErrorHandler = (config: ErrorHandlerConfig) => {
  if (typeof window === 'undefined') return;

  const analytics = useRepositoryAnalytics();
  const { appType, serviceName = `${appType}-app` } = config;

  // helpers imported from useAnalyticsError

  // Send error to analytics
  const sendErrorToAnalytics = async (error: Error | APIError, componentName: string, errorType: string) => {
    try {
      const pathValue = typeof window !== 'undefined' ? window.location.pathname : '';
      const urlValue = typeof window !== 'undefined' ? window.location.href : '';
      const userAgentValue = typeof navigator !== 'undefined' ? navigator.userAgent : '';

      await analytics.setMessage({
        time: new Date().toISOString(),
        level: AnalyticsLogLevel.ERROR,
        message: normalizeGroupMessage(error.message),
        error: formatErrorMessage(error.message, componentName),
        data: {
          component: (error as any).component || componentName,
          caller: (error as any).caller || ['unified-error-handler', errorType, appType],
          stack: (error as any).data?.stack ? [(error as any).data.stack] : error.stack ? [error.stack] : [],
          serviceContext: {
            httpRequest: (error as any).data?.httpRequest || {
              method: 'GET',
              url: urlValue,
              path: pathValue,
              userAgent: userAgentValue,
              referer: typeof document !== 'undefined' ? document.referrer || '-' : '-',
              remoteIp: '-',
              protocol: typeof window !== 'undefined' ? window.location.protocol : ''
            },
            service_name: serviceName,
          },
          client: getClientContext()
        }
      });
    } catch (analyticsError) {
      console.error('Failed to send error to analytics:', analyticsError);
    }
  };

  // Handle errors
  const handleError = (error: Error, componentName: string, errorType: string) => {
    sendErrorToAnalytics(error, componentName, errorType);

    // Optional redirect to 500 page for API 5xx errors
    try {
      if (error instanceof APIError && error.isServerError()) {
        if (typeof window !== 'undefined') {
          if (window.location.pathname !== urlServerError) {
            setTimeout(() => {
              window.location.replace(urlServerError);
            }, 500);
          }
        }
      }
    } catch (_) {
      // ignore navigation errors
    }
  };

  // Set up global error handlers
  const setupGlobalHandlers = () => {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason || new Error('Unhandled Promise Rejection');
      handleError(error, 'Promise Rejection', 'Unhandled Promise Rejection');
    });

    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message);
      handleError(error, 'Global Error', 'Unhandled Error Event');
    });

    // Override console.error
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      if (args.length > 0 && args[0] instanceof Error) {
        handleError(args[0], 'Console Error', 'Console Error');
      }
    };
  };

  // Set up Vue error handling
  const setupVueHandler = (app?: any) => {
    if (app?.config) {
      app.config.errorHandler = (error: Error, vm: any) => {
        const componentName = chooseSafeComponentName(error, vm, 'Unknown Component');
        handleError(error, componentName, 'Vue Error Handler');
      };
    }
  };

  // Set up VitePress error handling
  const setupVitePressHandler = () => {
    if (window.__VITEPRESS__) {
      // Handle VitePress page errors
      if (window.__VITEPRESS__.error) {
        const originalError = window.__VITEPRESS__.error;
        window.__VITEPRESS__.error = (error: Error) => {
          handleError(error, 'VitePress Page', 'Page Error');
          originalError(error);
        };
      }

      // Handle router errors
      if (window.__VITEPRESS__.router?.onError) {
        const originalOnError = window.__VITEPRESS__.router.onError;
        window.__VITEPRESS__.router.onError = (error: Error) => {
          handleError(error, 'VitePress Router', 'Router Error');
          originalOnError(error);
        };
      }

      // Handle page transitions
      if (window.__VITEPRESS__.pageTransition) {
        const originalTransition = window.__VITEPRESS__.pageTransition;
        window.__VITEPRESS__.pageTransition = async (...args: any[]) => {
          try {
            return await originalTransition(...args);
          } catch (error) {
            if (error instanceof Error) {
              handleError(error, 'VitePress Page', 'Page Transition Error');
            }
            throw error;
          }
        };
      }
    }

    // Set up Vue error boundary for VitePress
    if ((window as any).Vue?.config) {
      const originalVueHandler = (window as any).Vue.config.errorHandler;
      (window as any).Vue.config.errorHandler = (error: Error, vm: any) => {
        const componentName = resolveComponentName(vm, 'VitePress Component');
        handleError(error, componentName, 'Component Error');
        
        if (originalVueHandler) {
          originalVueHandler(error, vm);
        }
      };
    }
  };

  // Initialize all handlers
  const initialize = (app?: any) => {
    setupGlobalHandlers();
    setupVitePressHandler();
    setupVueHandler(app);
  };

  return { initialize };
};

// Convenience functions
export const setupVueErrorHandler = (app?: any) => {
  const envValue = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_ENV : undefined;
  if (envValue === 'local') return;
  const handler = setupUnifiedErrorHandler({ appType: 'vue' });
  handler?.initialize(app);
};

export const setupVitePressErrorHandler = () => {
  const envValue = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_ENV : undefined;
  if (envValue === 'local') return;
  const handler = setupUnifiedErrorHandler({ appType: 'vitepress' });
  handler?.initialize();
};
