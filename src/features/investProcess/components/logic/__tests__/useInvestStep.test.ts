import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';

const {
  routerPushMock,
  reportErrorMock,
  mockGetInvestUnconfirmed,
  mockGetInvestUnconfirmedState,
  mockGetInvestUnconfirmedOne,
} = vi.hoisted(() => ({
  routerPushMock: vi.fn(() => Promise.resolve()),
  reportErrorMock: vi.fn(),
  mockGetInvestUnconfirmed: vi.fn().mockResolvedValue({}),
  mockGetInvestUnconfirmedState: {
    value: {
      loading: false,
      error: null as Error | null,
      data: undefined,
    },
  },
  mockGetInvestUnconfirmedOne: { value: { step: undefined, id: 0 } },
}));

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>();
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();
  return {
    ...actual,
    onBeforeMount: (fn: () => unknown) => fn(),
  };
});

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      slug: 'test-offer',
      id: '123',
      profileId: '456',
    },
  }),
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn: ref(true),
  }),
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: () => ({
    getInvestUnconfirmed: mockGetInvestUnconfirmed,
    getInvestUnconfirmedOne: mockGetInvestUnconfirmedOne,
    getInvestUnconfirmedState: mockGetInvestUnconfirmedState,
  }),
}));

vi.mock('InvestCommon/domain/error/errorReporting', () => ({
  reportError: reportErrorMock,
}));

import { ROUTE_INVEST_REVIEW } from 'InvestCommon/domain/config/enums/routes';
import { useInvestStep } from '../useInvestStep';

describe('useInvestStep', () => {
  beforeEach(() => {
    routerPushMock.mockReset();
    reportErrorMock.mockReset();
    mockGetInvestUnconfirmed.mockReset();
    mockGetInvestUnconfirmed.mockResolvedValue({});
    mockGetInvestUnconfirmedState.value = {
      loading: false,
      error: null,
      data: undefined,
    };
    mockGetInvestUnconfirmedOne.value = { step: undefined, id: 0 };
  });

  it('exposes routeParams based on current route', () => {
    const composable = useInvestStep({ stepNumber: 1 });

    expect(composable.routeParams.value).toEqual({
      slug: 'test-offer',
      id: '123',
      profileId: '456',
    });
  });

  it('calls getInvestUnconfirmed with slug, profileId and investment id', async () => {
    await useInvestStep({ stepNumber: 1 });

    expect(mockGetInvestUnconfirmed).toHaveBeenCalledWith(
      'test-offer',
      '456',
      '123',
    );
  });

  it('navigates to correct route when currentTab changes', async () => {
    const composable = useInvestStep({ stepNumber: 1 });

    // change tab to step that maps to review
    composable.currentTab.value = 3;
    await nextTick();
    expect(routerPushMock).toHaveBeenCalledTimes(1);
    const callArgs = routerPushMock.mock.calls[0] as unknown[];
    const payload = callArgs[0] as { name: string; params: unknown };
    expect(payload.name).toBe(ROUTE_INVEST_REVIEW);
    expect(payload.params).toEqual(composable.routeParams.value);
  });

  it('suppresses offline bootstrap failures and exposes the offline unavailable state', async () => {
    const offlineError = new Error('Failed to fetch');
    mockGetInvestUnconfirmed.mockRejectedValueOnce(offlineError);
    mockGetInvestUnconfirmedState.value.error = offlineError;

    const composable = useInvestStep({ stepNumber: 1 });

    await Promise.resolve();
    await nextTick();

    expect(composable.isOfflineUnavailable.value).toBe(true);
    expect(routerPushMock).not.toHaveBeenCalled();
    expect(reportErrorMock).not.toHaveBeenCalled();
  });
});
