import { v4 as uuidv4 } from 'uuid';
import {
  ApiResponse, RequestConfig,
} from './types';
import { APIError } from './handlers/apiError';
import env from 'InvestCommon/config/env';
import { OfflineRequestError } from './handlers/offlineRequestError';
import {
  PWA_OFFLINE_LAST_SYNC_HEADER,
  PWA_OFFLINE_RESPONSE_SOURCE_HEADER,
  persistOfflineResponse,
  readOfflineResponse,
  readOfflineResponseMetadata,
} from 'InvestCommon/domain/pwa/pwaOfflineStore';
import { matchOfflineDomainPolicy, type PwaPolicyEnv } from 'InvestCommon/domain/pwa/pwaPolicy';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const PWA_POLICY_ENV: PwaPolicyEnv = {
  FRONTEND_URL: env.FRONTEND_URL,
  OFFER_URL: env.OFFER_URL,
  NOTIFICATION_URL: env.NOTIFICATION_URL,
  USER_URL: env.USER_URL,
  INVESTMENT_URL: env.INVESTMENT_URL,
  WALLET_URL: env.WALLET_URL,
  EVM_URL: env.EVM_URL,
  FILER_URL: env.FILER_URL,
  DISTRIBUTIONS_URL: env.DISTRIBUTIONS_URL,
  ACCREDITATION_URL: env.ACCREDITATION_URL,
  KRATOS_URL: env.KRATOS_URL,
};

const isBrowserOnline = () => (
  typeof navigator === 'undefined' ? true : navigator.onLine
);

const withOfflineMetaHeaders = (
  headers: Headers,
  meta: {
    source: 'network' | 'offline-cache';
    lastSyncedAt?: string | null;
  },
) => {
  const nextHeaders = new Headers(headers);
  nextHeaders.set(PWA_OFFLINE_RESPONSE_SOURCE_HEADER, meta.source);
  if (meta.lastSyncedAt) {
    nextHeaders.set(PWA_OFFLINE_LAST_SYNC_HEADER, meta.lastSyncedAt);
  }
  return nextHeaders;
};

const resolveResponseType = (response: Response, config: RequestConfig) => {
  const contentType = response.headers.get('content-type');
  const defaultType = contentType?.includes('application/json') ? 'json' : 'text';
  return config.type || defaultType;
};

const readResponsePayload = async (response: Response, type: RequestConfig['type']) => {
  switch (type) {
    case 'json':
      return response.json();
    case 'blob':
      return response.blob();
    case 'arrayBuffer':
      return response.arrayBuffer();
    case 'text':
    case 'stream':
    default:
      return response.text();
  }
};

const toPersistedPayloadType = (type: RequestConfig['type']) => {
  switch (type) {
    case 'json':
    case 'blob':
    case 'arrayBuffer':
      return type;
    case 'stream':
    case 'text':
    default:
      return 'text';
  }
};

export class ApiClient {
  private pendingRequests = new Map<string, Promise<ApiResponse<unknown>>>();

  constructor(private baseURL: string = '') {
    this.baseURL = baseURL || (typeof window !== 'undefined' ? window.location.origin : '');
  }

  private buildFullUrl(url: string, config: RequestConfig): string {
    const baseUrl = config.baseURL || this.baseURL;
    let fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    if (config.params && Object.keys(config.params).length > 0) {
      const urlWithParams = new URL(fullUrl);
      for (const [key, value] of Object.entries(config.params)) {
        if (value != null) urlWithParams.searchParams.set(key, String(value));
      }
      fullUrl = urlWithParams.toString();
    }
    return fullUrl;
  }

  private async executeRequest<T>(fullUrl: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const isFormData = config.body instanceof FormData;
    const isSimple = config.simple === true;
    const method = (config.method || 'GET').toUpperCase();
    const offlinePolicy = matchOfflineDomainPolicy(fullUrl, method, PWA_POLICY_ENV);
    const defaultHeaders: Record<string, string> = {
      accept: 'application/json',
      'X-Request-ID': uuidv4(),
    };

    if (!isFormData && !isSimple) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const customHeaders = config.headers
      ? (config.headers instanceof Headers
          ? Object.fromEntries(config.headers.entries())
          : Array.isArray(config.headers)
            ? Object.fromEntries(config.headers as [string, string][])
            : (config.headers as Record<string, string>))
      : {};
    const headers: Record<string, string> = isSimple ? customHeaders : { ...defaultHeaders, ...customHeaders };

    // Control how 5xx responses are treated by the global error handler.
    // By default, server errors are NOT considered fatal to avoid
    // redirecting the whole app for recoverable API issues.
    const fatalOnServerError = config.fatalOnServerError ?? false;

    // Gather HTTP request data
    const httpRequest = {
      method,
      url: fullUrl,
      path: new URL(fullUrl).pathname,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      referer: typeof document !== 'undefined' ? document.referrer : '',
      remoteIp: '',
      protocol: typeof window !== 'undefined' ? window.location.protocol.replace(':', '') : '',
    };

    if (MUTATION_METHODS.has(method) && !config.allowOfflineMutation && !isBrowserOnline()) {
      throw new OfflineRequestError(method, fullUrl);
    }

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        credentials: config.credentials ?? 'include',
        method,
        body: method === 'GET' ? undefined : config.body,
        headers,
        signal: config.signal,
      });
    } catch (error) {
      if (offlinePolicy?.persistToIndexedDb) {
        const cached = await readOfflineResponse<T>(offlinePolicy, fullUrl);
        if (cached) {
          return {
            data: cached.data,
            status: cached.status,
            headers: cached.headers,
          };
        }
      }
      throw error;
    }

    if (!response.ok) {
      const error = new APIError('Failed to fetch data', response, httpRequest);
      error.isFatal = fatalOnServerError && response.status >= 500;
      error.showGlobalAlertOnServerError = config.showGlobalAlertOnServerError ?? true;
      await error.initializeResponseJson();
      throw error;
    }

    if (response.status === 204 || response.status === 205) {
      const metadata = offlinePolicy
        ? await readOfflineResponseMetadata(offlinePolicy, fullUrl)
        : null;
      return {
        data: undefined as T,
        status: response.status,
        headers: offlinePolicy
          ? withOfflineMetaHeaders(response.headers, {
              source: isBrowserOnline() ? 'network' : 'offline-cache',
              lastSyncedAt: isBrowserOnline() ? new Date().toISOString() : metadata?.lastSyncedAt ?? null,
            })
          : response.headers,
      };
    }

    const type = resolveResponseType(response, config);
    const data = await readResponsePayload(response, type);

    let responseHeaders = response.headers;
    if (offlinePolicy?.persistToIndexedDb) {
      if (isBrowserOnline()) {
        const updatedAt = new Date().toISOString();
        await persistOfflineResponse(offlinePolicy, fullUrl, {
          data,
          status: response.status,
          headers: response.headers,
          payloadType: toPersistedPayloadType(type),
          updatedAt,
        });
        responseHeaders = withOfflineMetaHeaders(response.headers, {
          source: 'network',
          lastSyncedAt: updatedAt,
        });
      } else {
        const metadata = await readOfflineResponseMetadata(offlinePolicy, fullUrl);
        responseHeaders = withOfflineMetaHeaders(response.headers, {
          source: 'offline-cache',
          lastSyncedAt: metadata?.lastSyncedAt ?? null,
        });
      }
    }

    return {
      data: data as T,
      status: response.status,
      headers: responseHeaders,
    };
  }

  async request<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const fullUrl = this.buildFullUrl(url, config);
    const method = (config.method || 'GET').toUpperCase();
    const requestKey = `${method}-${fullUrl}`;
    const shouldDeduplicate = method === 'GET' || method === 'OPTIONS';

    if (shouldDeduplicate && this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const promise = this.executeRequest<T>(fullUrl, config);
    if (shouldDeduplicate) {
      this.pendingRequests.set(requestKey, promise);
    }

    try {
      return await promise;
    } finally {
      if (shouldDeduplicate) {
        this.pendingRequests.delete(requestKey);
      }
    }
  }

  private static toBody(data?: unknown): BodyInit | undefined {
    if (data == null) return undefined;
    return data instanceof FormData ? data : JSON.stringify(data);
  }

  get<T>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  post<T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body: ApiClient.toBody(data) });
  }

  put<T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body: ApiClient.toBody(data) });
  }

  patch<T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: ApiClient.toBody(data) });
  }

  delete<T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE', body: ApiClient.toBody(data) });
  }

  options<T>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: 'OPTIONS',
      params: {
        ...config?.params,
        schema: 1,
      },
    });
  }

  async getPaginated<T>(
    url: string,
    page: number,
    limit: number,
    config?: Omit<RequestConfig, 'method' | 'body'>,
  ): Promise<ApiResponse<T> & {
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      }
    }> {
    const response = await this.get<T>(url, {
      ...config,
      params: {
        ...config?.params,
        page,
        limit,
      },
    });

    const totalItems = Number(response.headers.get('x-total-count')) || 0;
    const itemsPerPage = limit;

    return {
      ...response,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / itemsPerPage),
        totalItems,
        itemsPerPage,
      },
    };
  }
}
