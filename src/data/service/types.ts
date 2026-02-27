export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface RequestConfig extends RequestInit {
  baseURL?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  type?: 'json' | 'blob' | 'text' | 'arrayBuffer' | 'stream';
  /**
   * When true, 5xx responses will be treated as fatal by the
   * global error handler and can trigger a /500 redirect.
   * Defaults to false so that API 5xx errors are surfaced locally
   * (e.g. via toast) without breaking the whole app. Set to true
   * only for requests where a server error should be considered
   * unrecoverable for the current UI flow.
   */
  fatalOnServerError?: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
