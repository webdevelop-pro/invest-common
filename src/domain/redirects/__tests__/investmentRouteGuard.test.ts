import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  setMetaDataMock,
  reportErrorMock,
  getInvestmentsMock,
  getInvestOneMock,
  getInvestmentsState,
  getInvestOneState,
} = vi.hoisted(() => ({
  setMetaDataMock: vi.fn(),
  reportErrorMock: vi.fn(),
  getInvestmentsMock: vi.fn(),
  getInvestOneMock: vi.fn(),
  getInvestmentsState: { value: {} as { data?: { data: Array<{ id: string | number }> } } },
  getInvestOneState: { value: {} as { data?: { id?: string | number } } },
}));

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>();
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.mock('InvestCommon/shared/composables/usePageSeo', () => ({
  usePageSeo: () => ({
    setMetaData: setMetaDataMock,
  }),
}));

vi.mock('InvestCommon/domain/error/errorReporting', () => ({
  reportError: reportErrorMock,
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: () => ({
    getInvestments: getInvestmentsMock,
    getInvestOne: getInvestOneMock,
    getInvestmentsState,
    getInvestOneState,
  }),
}));

import { createInvestmentRouteGuard } from '../investmentRouteGuard';

describe('createInvestmentRouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInvestmentsState.value = {};
    getInvestOneState.value = {};
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  it('lets the route mount when portfolio hydration misses offline', async () => {
    getInvestmentsMock.mockRejectedValueOnce(new Error('Failed to fetch'));

    const guard = createInvestmentRouteGuard('Investment title', 'Investment description');
    const result = await guard({
      params: { profileId: '42', id: '101' },
      fullPath: '/profile/42/investment/101/timeline',
    } as any);

    expect(result).toBeUndefined();
    expect(reportErrorMock).not.toHaveBeenCalled();
    expect(setMetaDataMock).toHaveBeenCalled();
  });

  it('returns 404 for genuine online misses', async () => {
    getInvestmentsMock.mockImplementationOnce(async () => {
      getInvestmentsState.value = {
        data: {
          data: [{ id: '8' }],
        },
      };
      return getInvestmentsState.value.data;
    });
    getInvestOneMock.mockRejectedValueOnce(new Error('Validation failed'));

    const guard = createInvestmentRouteGuard('Investment title', 'Investment description');
    const result = await guard({
      params: { profileId: '42', id: '101' },
      fullPath: '/profile/42/investment/101/documents',
    } as any);

    expect(result).toBe('/error/404');
  });

  it('keeps the route active when the detail fetch misses offline after portfolio data is loaded', async () => {
    getInvestmentsState.value = {
      data: {
        data: [{ id: '101' }],
      },
    };
    getInvestOneMock.mockRejectedValueOnce(new Error('Network request failed'));

    const guard = createInvestmentRouteGuard('Investment title', 'Investment description');
    const result = await guard({
      params: { profileId: '42', id: '101' },
      fullPath: '/profile/42/investment/101/documents',
    } as any);

    expect(result).toBeUndefined();
    expect(reportErrorMock).not.toHaveBeenCalled();
  });
});
