import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';
import { ROUTE_INVEST_THANK } from 'InvestCommon/domain/config/enums/routes';
import { useInvestReview } from '../useInvestReview';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn(),
}));

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: vi.fn(),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(),
}));

vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: vi.fn(),
}));

vi.mock('InvestCommon/domain/analytics/useSendAnalyticsEvent', () => ({
  useSendAnalyticsEvent: vi.fn(),
}));

describe('useInvestReview (logic)', () => {
  const mockRouter = { push: vi.fn() };
  const mockRoute = {
    params: { slug: 'test-slug', id: 'test-id', profileId: 'test-profile-id' },
    path: '/invest/review',
  };
  const mockGlobalLoader = { hide: vi.fn() };
  const mockHubspotForm = { submitFormToHubspot: vi.fn() };
  const mockProfilesStore = {
    selectedUserProfileData: ref({
      data: {
        first_name: 'John',
        middle_name: 'Michael',
        last_name: 'Doe',
      },
    }),
  };
  const mockSessionStore = {
    userSessionTraits: ref({ email: 'test@example.com' }),
  };
  const mockInvestmentRepository = {
    setReview: vi.fn(),
    getInvestUnconfirmedOne: ref({
      offer: {
        name: 'Test Offer',
        slug: 'test-offer',
      },
    }),
    setReviewState: ref({ loading: false, data: null as any }),
    $onAction: vi.fn(),
  };
  const mockSendEvent = vi.fn();

  let registeredActionHandler: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    (useRouter as any).mockReturnValue(mockRouter);
    (useRoute as any).mockReturnValue(mockRoute);
    (useGlobalLoader as any).mockReturnValue(mockGlobalLoader);
    (useHubspotForm as any).mockReturnValue(mockHubspotForm);
    (useProfilesStore as any).mockReturnValue(mockProfilesStore);
    (useSessionStore as any).mockReturnValue(mockSessionStore);
    (useRepositoryInvestment as any).mockReturnValue(mockInvestmentRepository);
    (useSendAnalyticsEvent as any).mockReturnValue({ sendEvent: mockSendEvent });

    mockInvestmentRepository.$onAction.mockImplementation((handler) => {
      registeredActionHandler = handler;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with loader hidden and exposes route params and store refs', () => {
    const composable = useInvestReview();

    expect(mockGlobalLoader.hide).toHaveBeenCalled();
    expect(composable.slug).toBe('test-slug');
    expect(composable.id).toBe('test-id');
    expect(composable.profileId).toBe('test-profile-id');
    expect(composable.getInvestUnconfirmedOne.value.offer.name).toBe('Test Offer');
  });

  it('confirmInvest calls repository.setReview and sends analytics event', async () => {
    const composable = useInvestReview();

    await composable.confirmInvest();

    expect(mockInvestmentRepository.setReview).toHaveBeenCalledWith(
      'test-slug',
      'test-id',
      'test-profile-id',
    );

    expect(mockSendEvent).toHaveBeenCalledWith({
      event_type: 'send',
      method: 'POST',
      httpRequestMethod: 'POST',
      service_name: 'vue3-app',
      request_path: mockRoute.path,
    });
  });

  it('handles successful setReview action and navigates to thank you', async () => {
    useInvestReview();

    mockInvestmentRepository.setReviewState.value = {
      loading: false,
      data: {
        investment: {
          id: 'investment-123',
          status: 'confirmed',
        },
      },
    };

    if (registeredActionHandler) {
      registeredActionHandler({
        name: 'setReview',
        after: (cb: () => void) => cb(),
      });
    }

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: ROUTE_INVEST_THANK,
      params: { id: 'investment-123' },
    });

    expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
      email: 'test@example.com',
      investment_id: 'investment-123',
      offer_name: 'Test Offer',
      offer_slug: 'test-offer',
      investment_status: 'confirmed',
    });
  });

  it('ignores non-setReview actions', () => {
    useInvestReview();

    if (registeredActionHandler) {
      registeredActionHandler({
        name: 'otherAction',
        after: (cb: () => void) => cb(),
      });
    }

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
  });

  it('does not navigate when setReviewState has no investment data', () => {
    useInvestReview();

    mockInvestmentRepository.setReviewState.value = {
      loading: false,
      data: null,
    };

    if (registeredActionHandler) {
      registeredActionHandler({
        name: 'setReview',
        after: (cb: () => void) => cb(),
      });
    }

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
  });
});

