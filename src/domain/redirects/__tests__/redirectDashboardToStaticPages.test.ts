import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import type { RouteLocationNormalized } from 'vue-router';
import { redirectDashboardToStaticPages } from '../redirectDashboardToStaticPages';

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn(),
}));

vi.mock('InvestCommon/global', () => ({
  default: {
    FRONTEND_URL_STATIC: 'https://static.example.com',
  },
}));

describe('redirectDashboardToStaticPages', () => {
  const mockTo: RouteLocationNormalized = {
    path: '/faq',
    query: { param1: 'value1' },
    meta: {},
    name: undefined,
    params: {},
    matched: [],
    fullPath: '/faq',
    hash: '',
    redirectedFrom: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to static page for base path', () => {
    const to = { ...mockTo, path: '/faq', fullPath: '/faq' };
    redirectDashboardToStaticPages(to);
    expect(navigateWithQueryParams).toHaveBeenCalledWith(
      'https://static.example.com/faq',
      { param1: 'value1' },
    );
  });

  it('should redirect to static page for root path', () => {
    const to = { ...mockTo, path: '/', fullPath: '/' };
    redirectDashboardToStaticPages(to);
    expect(navigateWithQueryParams).toHaveBeenCalledWith(
      'https://static.example.com/',
      { param1: 'value1' },
    );
  });

  it('should NOT redirect for non-static page', () => {
    const to = { ...mockTo, path: '/dashboard', fullPath: '/dashboard' };
    redirectDashboardToStaticPages(to);
    expect(navigateWithQueryParams).not.toHaveBeenCalled();
  });
});
