import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { computed, nextTick, ref } from 'vue';
import OffersDetailsBtn from '../OffersDetailsBtn.vue';

const userLoggedIn = ref(true);
const selectedUserProfileData = ref<any>(null);
const hasAnyKycApprovedProfile = ref(false);
const alertModel = ref({
  show: false,
  variant: 'error' as const,
  title: '',
  description: '',
  buttonText: undefined as string | undefined,
  isLoading: false,
  isDisabled: false,
});
const sendEvent = vi.fn();

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      if ('userLoggedIn' in store) {
        return { userLoggedIn };
      }

      if ('selectedUserProfileData' in store) {
        return { selectedUserProfileData, hasAnyKycApprovedProfile };
      }

      return actual.storeToRefs(store as never);
    },
  };
});

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn,
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData,
    hasAnyKycApprovedProfile,
  }),
}));

vi.mock('InvestCommon/features/kyc/logic/useKycAlertViewModel', () => ({
  useKycAlertViewModel: () => ({
    alertModel,
    onPrimaryAction: vi.fn(),
  }),
}));

vi.mock('InvestCommon/domain/analytics/useSendAnalyticsEvent', () => ({
  useSendAnalyticsEvent: () => ({
    sendEvent,
  }),
}));

vi.mock('vitepress', () => ({
  useRoute: () => ({
    path: '/offers/test-offer',
  }),
}));

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn(),
}));

vi.mock('UiKit/composables/useSyncWithUrl', () => ({
  useSyncWithUrl: () => computed(() => 'description'),
}));

const offerKycActionButtonStub = {
  name: 'VKycActionButton',
  template: '<button class="offer-kyc-btn">Continue</button>',
};

describe('OffersDetailsBtn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userLoggedIn.value = true;
    selectedUserProfileData.value = { isKycApproved: false };
    hasAnyKycApprovedProfile.value = false;
    alertModel.value = {
      show: false,
      variant: 'error',
      title: '',
      description: '',
      buttonText: undefined,
      isLoading: false,
      isDisabled: false,
    };
  });

  it('shows the centralized KYC action button when the offer still requires KYC', async () => {
    alertModel.value = {
      show: true,
      variant: 'error',
      title: 'Finish Your KYC',
      description: 'Complete KYC',
      buttonText: 'Continue',
      isLoading: false,
      isDisabled: false,
    };

    const wrapper = mount(OffersDetailsBtn, {
      props: {
        isSharesReached: false,
        loading: false,
      },
      global: {
        stubs: {
          VButton: true,
          VKycActionButton: offerKycActionButtonStub,
        },
      },
    });

    await nextTick();
    expect(wrapper.find('.offer-kyc-btn').exists()).toBe(true);
    expect(wrapper.text()).toContain('Continue');
  });

  it('keeps the fallback text when the centralized KYC alert is not actionable', async () => {
    selectedUserProfileData.value = {
      isKycApproved: false,
    };
    alertModel.value = {
      show: true,
      variant: 'info',
      title: 'Verification In Progress',
      description: 'Waiting for review',
      buttonText: undefined,
      isLoading: false,
      isDisabled: false,
    };

    const wrapper = mount(OffersDetailsBtn, {
      props: {
        isSharesReached: false,
        loading: false,
      },
      global: {
        stubs: {
          VButton: true,
          VKycActionButton: offerKycActionButtonStub,
        },
      },
    });

    await nextTick();
    expect(wrapper.text()).toContain("You haven't passed KYC!");
    expect(wrapper.find('.offer-kyc-btn').exists()).toBe(false);
  });

  it('keeps the fallback text when KYC is declined and has no CTA', async () => {
    selectedUserProfileData.value = {
      isKycApproved: false,
    };
    alertModel.value = {
      show: true,
      variant: 'error',
      title: 'Verification Declined',
      description: 'Contact support',
      buttonText: undefined,
      isLoading: false,
      isDisabled: false,
    };

    const wrapper = mount(OffersDetailsBtn, {
      props: {
        isSharesReached: false,
        loading: false,
      },
      global: {
        stubs: {
          VButton: true,
          VKycActionButton: offerKycActionButtonStub,
        },
      },
    });

    await nextTick();
    expect(wrapper.text()).toContain("You haven't passed KYC!");
    expect(wrapper.find('.offer-kyc-btn').exists()).toBe(false);
  });

  it('keeps the fallback text when the centralized KYC alert is hidden', async () => {
    selectedUserProfileData.value = {
      isKycApproved: false,
    };
    alertModel.value = {
      show: false,
      variant: 'error',
      title: '',
      description: '',
      buttonText: 'Continue',
      isLoading: false,
      isDisabled: false,
    };

    const wrapper = mount(OffersDetailsBtn, {
      props: {
        isSharesReached: false,
        loading: false,
      },
      global: {
        stubs: {
          VButton: true,
          VKycActionButton: offerKycActionButtonStub,
        },
      },
    });

    await nextTick();
    expect(wrapper.text()).toContain("You haven't passed KYC!");
    expect(wrapper.find('.offer-kyc-btn').exists()).toBe(false);
  });
});
