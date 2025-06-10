import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { APIError } from './apiError';

describe('APIError', () => {
  let mockResponse: Response;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create a mock Response object
    mockResponse = new Response(JSON.stringify({ message: 'Test error' }), {
      status: 400,
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
  });

  it('should create an APIError instance with correct initial properties', () => {
    const error = new APIError('Test error', mockResponse);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('APIError');
    expect(error.message).toBe('Test error');
    expect(error.data.statusCode).toBe(400);
    expect(error.data.timestamp).toBeInstanceOf(Date);
    expect(error.data.response).toBeInstanceOf(Response);
  });

  it('should initialize responseJson and update message when valid JSON is available', async () => {
    const responseData = {
      message: 'API Error',
      ui: {
        messages: [{ type: 'error', text: 'UI Error Message' }],
        nodes: [{
          messages: [{ type: 'error', text: 'Node Error Message' }],
        }],
      },
    };

    const response = new Response(JSON.stringify(responseData));
    const error = new APIError('Initial error', response);

    await error.initializeResponseJson();

    expect(error.data.responseJson).toEqual(responseData);
    expect(error.message).toBe('API Error');
  });

  it('should handle __error__ field in response', async () => {
    const responseData = {
      __error__: 'Custom error message',
      message: 'Regular message',
    };

    const response = new Response(JSON.stringify(responseData));
    const error = new APIError('Initial error', response);

    await error.initializeResponseJson();

    expect(error.getDetailedMessage()).toBe('Custom error message');
  });

  it('should handle UI error messages', async () => {
    const responseData = {
      ui: {
        messages: [{ type: 'error', text: 'UI Error Message' }],
      },
    };

    const response = new Response(JSON.stringify(responseData));
    const error = new APIError('Initial error', response);

    await error.initializeResponseJson();

    expect(error.getDetailedMessage()).toBe('UI Error Message');
  });

  it('should handle UI node error messages', async () => {
    const responseData = {
      ui: {
        nodes: [{
          messages: [{ type: 'error', text: 'Node Error Message' }],
        }],
      },
    };

    const response = new Response(JSON.stringify(responseData));
    const error = new APIError('Initial error', response);

    await error.initializeResponseJson();

    expect(error.getDetailedMessage()).toBe('Node Error Message');
  });

  it('should handle invalid JSON response', async () => {
    const response = new Response('invalid json');
    const error = new APIError('Initial error', response);

    await error.initializeResponseJson();

    expect(error.data.responseJson).toBeNull();
    expect(error.message).toBe('Initial error');
  });

  it('should correctly identify client errors', () => {
    const clientError = new APIError('Client error', new Response(null, { status: 400 }));
    const serverError = new APIError('Server error', new Response(null, { status: 500 }));

    expect(clientError.isClientError()).toBe(true);
    expect(serverError.isClientError()).toBe(false);
  });

  it('should correctly identify server errors', () => {
    const clientError = new APIError('Client error', new Response(null, { status: 400 }));
    const serverError = new APIError('Server error', new Response(null, { status: 500 }));

    expect(serverError.isServerError()).toBe(true);
    expect(clientError.isServerError()).toBe(false);
  });
});
