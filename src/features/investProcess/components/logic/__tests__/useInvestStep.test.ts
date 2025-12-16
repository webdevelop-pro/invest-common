import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';

const routerPushMock = vi.fn(() => Promise.resolve());

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
    getInvestUnconfirmed: vi.fn().mockResolvedValue({}),
  }),
}));

import { ROUTE_INVEST_REVIEW } from 'InvestCommon/domain/config/enums/routes';
import { useInvestStep } from '../useInvestStep';

describe('useInvestStep', () => {
  beforeEach(() => {
    routerPushMock.mockReset();
  });

  it('exposes routeParams based on current route', () => {
    const composable = useInvestStep({ stepNumber: 1 });

    expect(composable.routeParams.value).toEqual({
      slug: 'test-offer',
      id: '123',
      profileId: '456',
    });
  });

  it('navigates to correct route when currentTab changes', async () => {
    const composable = useInvestStep({ stepNumber: 1 });

    // change tab to step that maps to review
    composable.currentTab.value = 3;
    await nextTick();
    expect(routerPushMock).toHaveBeenCalledTimes(1);
    const call = routerPushMock.mock.calls[0][0];
    expect(call.name).toBe(ROUTE_INVEST_REVIEW);
    expect(call.params).toEqual(composable.routeParams.value);
  });
});


