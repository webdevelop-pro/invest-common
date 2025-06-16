import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { redirectDashboardToStaticPages } from '../redirectDashboardToStaticPages';

// Mock the dependencies
vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn(),
}));

vi.mock('InvestCommon/global', () => ({
  default: {
    FRONTEND_URL_STATIC: 'https://static.example.com',
  },
}));

describe('redirectDashboardToStaticPages', () => {
  const mockNext = vi.fn() as NavigationGuardNext;
  const mockTo: RouteLocationNormalized = {
    path: '/test-path',
    query: { param1: 'value1' },
    meta: {},
    name: undefined,
    params: {},
    matched: [],
    fullPath: '/test-path',
    hash: '',
    redirectedFrom: undefined,
  };
  const mockFrom: RouteLocationNormalized = {
    path: '/previous-path',
    query: {},
    meta: {},
    name: undefined,
    params: {},
    matched: [],
    fullPath: '/previous-path',
    hash: '',
    redirectedFrom: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to static page when requiresAuth is false', async () => {
    const to = { ...mockTo, meta: { requiresAuth: false } };

    await redirectDashboardToStaticPages(to, mockFrom, mockNext);

    expect(navigateWithQueryParams).toHaveBeenCalledWith(
      'https://static.example.com/test-path',
      { param1: 'value1' },
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() when requiresAuth is true', async () => {
    const to = { ...mockTo, meta: { requiresAuth: true } };

    await redirectDashboardToStaticPages(to, mockFrom, mockNext);

    expect(navigateWithQueryParams).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle empty query parameters', async () => {
    const to = {
      ...mockTo,
      meta: { requiresAuth: false },
      query: {},
    };

    await redirectDashboardToStaticPages(to, mockFrom, mockNext);

    expect(navigateWithQueryParams).toHaveBeenCalledWith(
      'https://static.example.com/test-path',
      {},
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle root path', async () => {
    const to = {
      ...mockTo,
      path: '/',
      fullPath: '/',
      meta: { requiresAuth: false },
    };

    await redirectDashboardToStaticPages(to, mockFrom, mockNext);

    expect(navigateWithQueryParams).toHaveBeenCalledWith(
      'https://static.example.com/',
      { param1: 'value1' },
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});
