import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import { ApiClient } from '../apiClient';
import { APIError } from '../handlers/apiError';

describe('ApiClient', () => {
  let apiClient: ApiClient;
  const mockFetch = vi.fn();
  const baseURL = 'https://api.example.com';

  beforeEach(() => {
    apiClient = new ApiClient(baseURL);
    global.fetch = mockFetch;
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

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const promise = apiClient.request('/test');
      await expect(promise).rejects.toThrow('Network error');
      await expect(promise).rejects.toMatchObject({
        message: 'Network error',
      });
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
