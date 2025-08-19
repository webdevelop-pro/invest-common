export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface RequestConfig extends RequestInit {
  baseURL?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  type?: 'json' | 'blob' | 'text' | 'arrayBuffer' | 'stream';
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
