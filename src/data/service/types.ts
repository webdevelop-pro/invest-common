/**
 * Response shape from ApiClient. For 204/205 No Content, `data` is undefined.
 */
export interface ApiResponse<T> {
  data: T | undefined;
  status: number;
  headers: Headers;
}

export interface RequestConfig extends RequestInit {
  baseURL?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Response body type. 'stream' is reserved for future use (ReadableStream). */
  type?: 'json' | 'blob' | 'text' | 'arrayBuffer' | 'stream';
  /** When true, sends a 'simple' request (no default X-Request-ID / Content-Type headers). Useful for 3rd-party CORS-safe GETs. */
  simple?: boolean;
  /**
   * When true, 5xx responses will be treated as fatal by the
   * global error handler and can trigger a /500 redirect.
   * Defaults to false so that API 5xx errors are surfaced locally
   * (e.g. via toast) without breaking the whole app. Set to true
   * only for requests where a server error should be considered
   * unrecoverable for the current UI flow.
   */
  fatalOnServerError?: boolean;
  /**
   * When false, 5xx responses for this request will NOT trigger
   * a global alert banner in the shared error reporter.
   * Defaults to true so core domains surface 5xx as a banner;
   * set to false for non-core domains (e.g. analytics, notifications).
   */
  showGlobalAlertOnServerError?: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
