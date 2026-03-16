import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import ViewOffersDetails from '../ViewOffersDetails.vue';

const getOfferOneMock = vi.fn().mockResolvedValue(undefined);
const getOfferCommentsMock = vi.fn().mockResolvedValue(undefined);
const getPublicFilesMock = vi.fn().mockResolvedValue(undefined);
const getFilesMock = vi.fn().mockResolvedValue(undefined);

vi.mock('InvestCommon/data/service/apiClient', () => {
  class ApiClient {
    get = vi.fn().mockResolvedValue({ data: { data: [] } });
    post = vi.fn().mockResolvedValue({ data: { id: 123 } });
    put = vi.fn().mockResolvedValue({ data: {} });
    options = vi.fn().mockResolvedValue({ data: {} });
  }

  return { ApiClient };
});

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn(),
}));

vi.mock('InvestCommon/config/env', () => ({
  default: {
    FRONTEND_URL_DASHBOARD: 'https://dashboard.test',
  },
}));

vi.mock('vitepress', () => {
  const params = ref<{ slug?: string; data?: unknown }>({
    slug: 'test-offer',
    data: {},
  });

  return {
    useData: () => ({ params }),
    useRoute: () => ({ path: '/offers/test-offer' }),
  };
});

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: () => ({ hide: vi.fn() }),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn: ref(true),
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: ref(42),
    userProfiles: ref([]),
    setSelectedUserProfileById: vi.fn(),
  }),
}));

vi.mock('InvestCommon/data/offer/offer.repository', () => ({
  useRepositoryOffer: () => ({
    getOfferOneState: ref({ loading: false, data: null as unknown }),
    getOfferOne: getOfferOneMock,
    getOfferComments: getOfferCommentsMock,
  }),
}));

vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: () => ({
    getPublicFiles: getPublicFilesMock,
    getFiles: getFilesMock,
  }),
}));

vi.mock('InvestCommon/domain/analytics/useSendAnalyticsEvent', () => ({
  useSendAnalyticsEvent: () => ({
    sendEvent: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('ViewOffersDetails - investHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    setActivePinia(createPinia());
    const investmentStore = useRepositoryInvestment();

    // Ensure repository state starts clean (no unconfirmed investments)
    if (typeof (investmentStore as any).resetAll === 'function') {
      (investmentStore as any).resetAll();
    }
  });

  it('does not request comments or files before the offer has a valid id', () => {
    mount(ViewOffersDetails, {
      global: {
        stubs: {
          OffersDetails: true,
        },
      },
    });

    expect(getOfferCommentsMock).not.toHaveBeenCalled();
    expect(getPublicFilesMock).not.toHaveBeenCalled();
    expect(getFilesMock).not.toHaveBeenCalled();
  });

  it('creates a new investment when getInvestUnconfirmedOne contains default values (id = 0)', async () => {
    const investmentStore = useRepositoryInvestment();
    const setInvestSpy = vi.spyOn(investmentStore, 'setInvest');

    const wrapper = mount(ViewOffersDetails, {
      global: {
        stubs: {
          OffersDetails: {
            template: '<button data-testid="invest-btn" @click="$emit(\'invest\')" />',
          },
        },
      },
    });

    await wrapper.find('[data-testid="invest-btn"]').trigger('click');

    expect(setInvestSpy).toHaveBeenCalledWith(
      'test-offer',
      expect.any(Number),
      0,
    );

    const { navigateWithQueryParams } = await import('UiKit/helpers/general');

    expect(navigateWithQueryParams).toHaveBeenCalledWith(
      'https://dashboard.test/invest/test-offer/amount/123/42',
    );
  });
});
