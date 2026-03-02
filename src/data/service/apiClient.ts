import { v4 as uuidv4 } from 'uuid';
import {
  ApiResponse, RequestConfig,
} from './types';
import { APIError } from './handlers/apiError';

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
      method: config.method || 'GET',
      url: fullUrl,
      path: new URL(fullUrl).pathname,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      referer: typeof document !== 'undefined' ? document.referrer : '',
      remoteIp: '',
      protocol: typeof window !== 'undefined' ? window.location.protocol.replace(':', '') : '',
    };

    const response = await fetch(fullUrl, {
      credentials: config.credentials ?? 'include',
      method: config.method,
      body: config.method === 'GET' ? undefined : config.body,
      headers,
      signal: config.signal,
    });

    if (!response.ok) {
      const error = new APIError('Failed to fetch data', response, httpRequest);
      error.isFatal = fatalOnServerError && response.status >= 500;
      error.showGlobalAlertOnServerError = config.showGlobalAlertOnServerError ?? true;
      await error.initializeResponseJson();
      throw error;
    }

    if (response.status === 204 || response.status === 205) {
      return {
        data: undefined as T,
        status: response.status,
        headers: response.headers,
      };
    }

    const contentType = response.headers.get('content-type');
    const defaultType = contentType?.includes('application/json') ? 'json' : 'text';
    const type = config.type || defaultType;
    let data: unknown;

    switch (type) {
      case 'json':
        data = await response.json();
        break;
      case 'blob':
        data = await response.blob();
        break;
      case 'arrayBuffer':
        data = await response.arrayBuffer();
        break;
      case 'text':
      default:
        data = await response.text();
        break;
    }

    return {
      data: data as T,
      status: response.status,
      headers: response.headers,
    };
  }

  async request<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const fullUrl = this.buildFullUrl(url, config);
    const method = config.method || 'GET';
    const requestKey = `${method}-${fullUrl}`;

    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const promise = this.executeRequest<T>(fullUrl, config);
    this.pendingRequests.set(requestKey, promise);

    try {
      return await promise;
    } finally {
      this.pendingRequests.delete(requestKey);
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
