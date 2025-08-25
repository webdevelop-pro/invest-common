import { v4 as uuidv4 } from 'uuid';
import {
  ApiResponse, RequestConfig,
} from './types';
import { APIError } from './handlers/apiError';

export class ApiClient {
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(private baseURL: string = '') {
    this.baseURL = baseURL || window.location.origin;
  }

  private async executeRequest<T>(url: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const baseUrl = config.baseURL || this.baseURL;
    let fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    if (config.params) {
      const urlWithParams = new URL(fullUrl);
      Object.entries(config.params).forEach(([key, value]) => {
        if (value != null) {
          urlWithParams.searchParams.append(key, String(value));
        }
      });
      fullUrl = urlWithParams.toString();
    }

    const isFormData = config.body instanceof FormData;
    const defaultHeaders: Record<string, string> = {
      accept: 'application/json',
      'X-Request-ID': uuidv4(),
    };

    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const headers = config.headers ? config.headers : defaultHeaders;

    // Gather HTTP request data
    const httpRequest = {
      method: config.method || 'GET',
      url: fullUrl,
      path: new URL(fullUrl).pathname,
      userAgent: navigator.userAgent,
      referer: document.referrer,
      protocol: window.location.protocol.replace(':', ''),
    };

    try {
      const response = await fetch(fullUrl, {
        credentials: 'include',
        method: config.method,
        body: config.body,
        headers,
      });

      if (!response.ok) {
        const error = new APIError('Failed to fetch data', response, httpRequest);
        await error.initializeResponseJson();
        throw error;
      }

      const contentType = response.headers.get('content-type');
      const defaultType = contentType?.includes('application/json') ? 'json' : 'text';
      const type = config.type || defaultType;
      let data: any;

      switch (type) {
        case 'json':
          data = await response.json();
          break;
        case 'blob':
          data = await response.blob();
          break;
        case 'text':
        default:
          data = await response.text();
          break;
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        throw error;
      }
      // Re-throw AbortError or return undefined for other cases
      throw error;
    }
  }

  async request<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const requestKey = `${config.method || 'GET'}-${url}`;

    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const promise = this.executeRequest<T>(url, config);
    this.pendingRequests.set(requestKey, promise);

    try {
      return await promise;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  get<T>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  post<T>(url: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  put<T>(url: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  patch<T>(url: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  delete<T>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  options<T>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'OPTIONS' });
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
