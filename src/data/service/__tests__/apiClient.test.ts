import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import { APIError } from '../handlers/apiError';
import { OfflineRequestError } from '../handlers/offlineRequestError';

const offlineMocks = vi.hoisted(() => ({
  matchOfflineDomainPolicy: vi.fn(),
  persistOfflineResponse: vi.fn(),
  readOfflineResponse: vi.fn(),
  readOfflineResponseMetadata: vi.fn(),
}));

vi.mock('InvestCommon/domain/pwa/pwaPolicy', () => ({
  matchOfflineDomainPolicy: offlineMocks.matchOfflineDomainPolicy,
}));

vi.mock('InvestCommon/domain/pwa/pwaOfflineStore', () => ({
  PWA_OFFLINE_LAST_SYNC_HEADER: 'x-invest-offline-last-synced-at',
  PWA_OFFLINE_RESPONSE_SOURCE_HEADER: 'x-invest-offline-source',
  persistOfflineResponse: offlineMocks.persistOfflineResponse,
  readOfflineResponse: offlineMocks.readOfflineResponse,
  readOfflineResponseMetadata: offlineMocks.readOfflineResponseMetadata,
}));

import { ApiClient } from '../apiClient';

describe('ApiClient', () => {
  let apiClient: ApiClient;
  const mockFetch = vi.fn();
  const baseURL = 'https://api.example.com';

  beforeEach(() => {
    apiClient = new ApiClient(baseURL);
    global.fetch = mockFetch;
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => true,
    });
    offlineMocks.matchOfflineDomainPolicy.mockReset();
    offlineMocks.persistOfflineResponse.mockReset();
    offlineMocks.readOfflineResponse.mockReset();
    offlineMocks.readOfflineResponseMetadata.mockReset();
    offlineMocks.readOfflineResponseMetadata.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('request', () => {
    it('should make successful request with default config', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await apiClient.request('/test');

      expect(response).toEqual({
        data: { data: 'test' },
        status: 200,
        headers: expect.any(Headers),
      });
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/test`,
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            accept: 'application/json',
            'X-Request-ID': expect.any(String),
          }),
        }),
      );
    });

    it('should handle non-JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('plain text'),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await apiClient.request('/test');

      expect(response.data).toBe('plain text');
    });

    it('should handle request errors with status code and JSON response', async () => {
      const mockResponse = new Response(
        JSON.stringify({ message: 'Resource not found' }),
        {
          status: 404,
          statusText: 'Not Found',
          headers: new Headers({ 'content-type': 'application/json' }),
        },
      );
      mockFetch.mockResolvedValueOnce(mockResponse);

      const promise = apiClient.request('/test');
      await expect(promise).rejects.toThrow(APIError);
      await expect(promise).rejects.toMatchObject({
        name: 'APIError',
        message: 'Resource not found',
        data: {
          timestamp: expect.any(Date),
          statusCode: 404,
          responseJson: { message: 'Resource not found' },
        },
      });
    });

    it('marks 5xx API errors as fatal only when fatalOnServerError is true', async () => {
      const errorBody = { message: 'Server exploded' };
      const mockResponse = new Response(
        JSON.stringify(errorBody),
        {
          status: 500,
          statusText: 'Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
        },
      );
      mockFetch.mockResolvedValueOnce(mockResponse);

      const fatalPromise = apiClient.request('/fatal', { fatalOnServerError: true });
      await expect(fatalPromise).rejects.toThrow(APIError);
      await expect(fatalPromise).rejects.toMatchObject({
        data: {
          statusCode: 500,
          responseJson: errorBody,
        },
        isFatal: true,
      } as any);

      // non-fatal by default
      const nonFatalResponse = new Response(
        JSON.stringify(errorBody),
        {
          status: 502,
          statusText: 'Bad Gateway',
          headers: new Headers({ 'content-type': 'application/json' }),
        },
      );
      mockFetch.mockResolvedValueOnce(nonFatalResponse);

      const nonFatalPromise = apiClient.request('/non-fatal');
      await expect(nonFatalPromise).rejects.toThrow(APIError);
      await expect(nonFatalPromise).rejects.toMatchObject({
        data: {
          statusCode: 502,
          responseJson: errorBody,
        },
        isFatal: false,
      } as any);
    });

    it('attaches httpRequest metadata to APIError', async () => {
      const mockResponse = new Response(
        JSON.stringify({ message: 'Oops' }),
        {
          status: 500,
          statusText: 'Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
        },
      );
      mockFetch.mockResolvedValueOnce(mockResponse);

      const promise = apiClient.request('/meta', {
        method: 'POST',
        params: { q: 'search' },
        body: JSON.stringify({
          key: 'value',
          nested: {
            valid: true,
          },
        }),
      });

      await expect(promise).rejects.toMatchObject({
        data: {
          body: {
            key: 'value',
            nested: {
              valid: true,
            },
          },
          httpRequest: expect.objectContaining({
            method: 'POST',
            url: `${baseURL}/meta?q=search`,
            path: '/meta',
          }),
        },
      } as any);
    });

    it('attaches an empty body to GET APIError metadata', async () => {
      const mockResponse = new Response(
        JSON.stringify({ message: 'Oops' }),
        {
          status: 500,
          statusText: 'Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
        },
      );
      mockFetch.mockResolvedValueOnce(mockResponse);

      const promise = apiClient.request('/meta');

      await expect(promise).rejects.toMatchObject({
        data: {
          body: {},
          httpRequest: expect.objectContaining({
            method: 'GET',
          }),
        },
      } as any);
    });

    it('attaches an empty body for mutation APIError metadata when the request body is empty', async () => {
      const mockResponse = new Response(
        JSON.stringify({ message: 'Oops' }),
        {
          status: 500,
          statusText: 'Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
        },
      );
      mockFetch.mockResolvedValueOnce(mockResponse);

      const promise = apiClient.patch('/meta');

      await expect(promise).rejects.toMatchObject({
        data: {
          body: {},
          httpRequest: expect.objectContaining({
            method: 'PATCH',
          }),
        },
      } as any);
    });

    it('redacts sensitive fields before attaching APIError metadata', async () => {
      const mockResponse = new Response(
        JSON.stringify({ message: 'Oops' }),
        {
          status: 500,
          statusText: 'Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
        },
      );
      mockFetch.mockResolvedValueOnce(mockResponse);

      const promise = apiClient.request('/meta', {
        method: 'POST',
        body: JSON.stringify({
          code: '123456',
          email: 'user@example.com',
          identifier: 'user@example.com',
          first_name: 'Jamie',
          password: 'super-secret',
          csrf_token: 'csrf-token',
          nested: {
            access_token: 'access-token',
            account_number: '9876543210',
            safe: true,
          },
        }),
      });

      await expect(promise).rejects.toMatchObject({
        data: {
          body: {
            code: '[redacted]',
            email: '[redacted]',
            identifier: '[redacted]',
            first_name: '[redacted]',
            password: '[redacted]',
            csrf_token: '[redacted]',
            nested: {
              access_token: '[redacted]',
              account_number: '[redacted]',
              safe: true,
            },
          },
        },
      } as any);
    });

    it('normalizes FormData bodies before attaching them to APIError metadata', async () => {
      const mockResponse = new Response(
        JSON.stringify({ message: 'Oops' }),
        {
          status: 500,
          statusText: 'Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
        },
      );
      mockFetch.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('file', new Blob(['test']));
      formData.append('tag', 'first');
      formData.append('tag', 'second');

      const promise = apiClient.post('/upload', formData);

      await expect(promise).rejects.toMatchObject({
        data: {
          body: {
            file: 'blob',
            tag: ['first', 'second'],
          },
          httpRequest: expect.objectContaining({
            method: 'POST',
          }),
        },
      } as any);
    });

    it('attaches DELETE bodies to APIError metadata', async () => {
      const mockResponse = new Response(
        JSON.stringify({ message: 'Oops' }),
        {
          status: 500,
          statusText: 'Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
        },
      );
      mockFetch.mockResolvedValueOnce(mockResponse);

      const promise = apiClient.delete('/meta', {
        funding_source_id: 42,
      });

      await expect(promise).rejects.toMatchObject({
        data: {
          body: {
            funding_source_id: 42,
          },
          httpRequest: expect.objectContaining({
            method: 'DELETE',
          }),
        },
      } as any);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const promise = apiClient.request('/test');
      await expect(promise).rejects.toThrow('Network error');
      await expect(promise).rejects.toMatchObject({
        message: 'Network error',
      });
    });

    it('uses the offline cache fallback for audited GET requests when fetch fails', async () => {
      const policy = {
        key: 'wallet-api',
        scope: 'private',
        persistToIndexedDb: true,
      };
      offlineMocks.matchOfflineDomainPolicy.mockReturnValue(policy);
      offlineMocks.readOfflineResponse.mockResolvedValue({
        data: { cached: true },
        status: 200,
        headers: new Headers({ 'x-invest-offline-source': 'offline-cache' }),
        lastSyncedAt: '2026-03-17T00:00:00.000Z',
      });
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await apiClient.get('/wallet');

      expect(response.data).toEqual({ cached: true });
      expect(offlineMocks.readOfflineResponse).toHaveBeenCalledWith(policy, `${baseURL}/wallet`);
    });

    it('persists audited GET responses after a successful online fetch', async () => {
      const policy = {
        key: 'wallet-api',
        scope: 'private',
        persistToIndexedDb: true,
      };
      offlineMocks.matchOfflineDomainPolicy.mockReturnValue(policy);
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'fresh' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await apiClient.get('/wallet');

      expect(response.headers.get('x-invest-offline-source')).toBe('network');
      expect(offlineMocks.persistOfflineResponse).toHaveBeenCalledWith(
        policy,
        `${baseURL}/wallet`,
        expect.objectContaining({
          data: { data: 'fresh' },
          status: 200,
          payloadType: 'json',
        }),
      );
    });

    it('should deduplicate concurrent requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const [response1, response2] = await Promise.all([
        apiClient.request('/test'),
        apiClient.request('/test'),
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response1).toEqual(response2);
    });

    it('should not deduplicate concurrent mutation requests to the same URL', async () => {
      const firstResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'first' }),
      };
      const secondResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'second' }),
      };
      mockFetch
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      const [response1, response2] = await Promise.all([
        apiClient.post('/test', { order: 1 }),
        apiClient.post('/test', { order: 2 }),
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response1.data).toEqual({ data: 'first' });
      expect(response2.data).toEqual({ data: 'second' });
    });

    it('should not deduplicate requests with different params', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await Promise.all([
        apiClient.request('/items', { params: { page: 1 } }),
        apiClient.request('/items', { params: { page: 2 } }),
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle custom baseURL in request config', async () => {
      const customBaseURL = 'https://custom.example.com';
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await apiClient.request('/test', { baseURL: customBaseURL });

      expect(mockFetch).toHaveBeenCalledWith(
        `${customBaseURL}/test`,
        expect.any(Object),
      );
    });

    it('should handle URL parameters correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const params = {
        search: 'test',
        page: 1,
        active: true,
        empty: null,
        undefined,
      };

      await apiClient.request('/test', { params });

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/test?search=test&page=1&active=true`,
        expect.any(Object),
      );
    });
  });

  describe('HTTP methods', () => {
    const mockSuccessResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ data: 'test' }),
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue(mockSuccessResponse);
    });

    it('should make GET request with params', async () => {
      await apiClient.get('/test', { params: { q: 'search' } });

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/test?q=search`,
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            accept: 'application/json',
            'X-Request-ID': expect.any(String),
          }),
        }),
      );
    });

    it('should make POST request with data', async () => {
      const data = { name: 'test' };
      await apiClient.post('/test', data);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/test`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            accept: 'application/json',
            'X-Request-ID': expect.any(String),
          }),
        }),
      );
    });

    it('blocks offline mutation requests by default', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        get: () => false,
      });

      await expect(apiClient.post('/test', { name: 'blocked' })).rejects.toBeInstanceOf(OfflineRequestError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle FormData in POST request', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']));
      formData.append('name', 'test.txt');

      await apiClient.post('/test', formData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/test`,
        expect.objectContaining({
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: expect.objectContaining({
            accept: 'application/json',
            'X-Request-ID': expect.any(String),
          }),
        }),
      );
      // Should not have Content-Type header for FormData
      expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
    });

    it('should handle absolute URLs correctly', async () => {
      const absoluteUrl = 'https://other-api.example.com/test';
      await apiClient.post(absoluteUrl, { data: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        absoluteUrl,
        expect.any(Object),
      );
    });

    it('should handle baseURL override correctly', async () => {
      const customBaseURL = 'https://custom.example.com';
      await apiClient.post('/test', { data: 'test' }, { baseURL: customBaseURL });

      expect(mockFetch).toHaveBeenCalledWith(
        `${customBaseURL}/test`,
        expect.any(Object),
      );
    });

    it('should make PUT request with data', async () => {
      const data = { name: 'test' };
      await apiClient.put('/test', data);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/test`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      );
    });

    it('should make PATCH request with data', async () => {
      const data = { name: 'test' };
      await apiClient.patch('/test', data);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/test`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      );
    });

    it('should make DELETE request', async () => {
      await apiClient.delete('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/test`,
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('should make OPTIONS request', async () => {
      await apiClient.options('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/test?schema=1`,
        expect.objectContaining({
          method: 'OPTIONS',
        }),
      );
    });

    it('should make OPTIONS request with additional params', async () => {
      await apiClient.options('/test', { params: { page: 1 } });

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/test?page=1&schema=1`,
        expect.objectContaining({
          method: 'OPTIONS',
        }),
      );
    });
  });
});
