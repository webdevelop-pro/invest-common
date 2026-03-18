import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import ViewOffersDetails from '../ViewOffersDetails.vue';

const {
  getOfferOneMock,
  getOfferCommentsMock,
  getPublicFilesMock,
  getFilesMock,
  reportErrorMock,
  routeParams,
} = vi.hoisted(() => ({
  getOfferOneMock: vi.fn().mockResolvedValue(undefined),
  getOfferCommentsMock: vi.fn().mockResolvedValue(undefined),
  getPublicFilesMock: vi.fn().mockResolvedValue(undefined),
  getFilesMock: vi.fn().mockResolvedValue(undefined),
  reportErrorMock: vi.fn(),
  routeParams: {
    value: {
      slug: 'test-offer',
      data: {},
    } as { slug?: string; data?: unknown },
  },
}));

const createRawOffer = (overrides: Record<string, unknown> = {}) => ({
  id: 0,
  name: 'Test Offer',
  legal_name: 'Test Offer LLC',
  slug: 'test-offer',
  title: 'Test offer title',
  security_type: 'equity',
  price_per_share: 10,
  min_investment: 1,
  image_link_id: 0,
  total_shares: 100,
  valuation: 1000,
  subscribed_shares: 10,
  confirmed_shares: 10,
  status: 'published',
  approved_at: '2026-03-01T00:00:00.000Z',
  website: 'https://example.test',
  state: 'CA',
  city: 'Los Angeles',
  security_info: {},
  close_at: '2026-04-01T00:00:00.000Z',
  seo_title: 'SEO title',
  seo_description: 'SEO description',
  description: 'Offer description',
  highlights: 'Highlights',
  risk_disclosures: 'Risks',
  additional_details: 'Additional details',
  data: {
    wire_to: '',
    swift_id: '',
    custodian: '',
    account_number: '',
    routing_number: '',
    apy: '',
    distribution_frequency: '',
    investment_strategy: '',
    estimated_hold_period: '',
  },
  linkedin: '',
  facebook: '',
  twitter: '',
  github: '',
  instagram: '',
  telegram: '',
  mastodon: '',
  reg_type: 'Reg D 506(c)',
  amount_raised: 100,
  target_raise: 1000,
  ...overrides,
});

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
  return {
    useData: () => ({ params: routeParams }),
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

vi.mock('InvestCommon/domain/error/errorReporting', () => ({
  reportError: reportErrorMock,
}));

describe('ViewOffersDetails - investHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeParams.value = {
      slug: 'test-offer',
      data: {},
    };
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });

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

  it('renders the static offer fallback and suppresses read toasts when offline requests fail', async () => {
    const offlineError = new Error('Network request failed');
    routeParams.value = {
      slug: 'test-offer',
      data: createRawOffer({ id: 12, name: 'Offline Offer' }),
    };
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    getOfferOneMock.mockRejectedValueOnce(offlineError);
    getOfferCommentsMock.mockRejectedValueOnce(offlineError);
    getPublicFilesMock.mockRejectedValueOnce(offlineError);
    getFilesMock.mockRejectedValueOnce(offlineError);

    const wrapper = mount(ViewOffersDetails, {
      global: {
        stubs: {
          OffersDetails: {
            props: ['offer', 'loading'],
            template: '<div data-testid="offer-name">{{ offer?.name }}</div>',
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.get('[data-testid="offer-name"]').text()).toContain('Offline Offer');
    expect(getOfferCommentsMock).toHaveBeenCalledWith(12);
    expect(getPublicFilesMock).toHaveBeenCalledWith(12, 'offer');
    expect(getFilesMock).toHaveBeenCalledWith(12, 'offer');
    expect(reportErrorMock).not.toHaveBeenCalled();
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
