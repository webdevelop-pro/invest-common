import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { ref, provide } from 'vue';
import { mount } from '@vue/test-utils';
import { routeLocationKey, routerKey } from 'vue-router';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';
import { InvestKycTypes } from 'InvestCommon/data/kyc/kyc.types';
import { useKycAlertViewModel } from '../useKycAlertViewModel';

const mockPush = vi.fn();
const mockRoute = {
  fullPath: '/dashboard?tab=wallet',
  query: { tab: 'wallet' },
};
const openContactUsDialog = vi.fn();
const handlePlaidKyc = vi.fn();

const mockProfilesStore = {
  selectedUserProfileData: ref<any>(null),
  selectedUserProfileId: ref<number | null>(123),
  selectedUserProfileShowKycInitForm: ref(false),
  selectedUserProfileType: ref('individual'),
  selectedUserIndividualProfile: ref<any>(null),
};
const mockSessionStore = {
  userLoggedIn: ref(true),
};
const mockRepositoryKyc = {
  isPlaidLoading: ref(false),
  handlePlaidKyc,
};

vi.mock('InvestCommon/domain/dialogs/store/useDialogs', () => ({
  useDialogs: () => ({
    openContactUsDialog,
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => mockProfilesStore,
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => mockSessionStore,
}));

vi.mock('InvestCommon/data/kyc/kyc.repository', () => ({
  useRepositoryKyc: () => mockRepositoryKyc,
}));

const createViewModel = () => {
  let viewModel!: ReturnType<typeof useKycAlertViewModel>;

  mount({
    components: {
      TestChild: {
        template: '<div />',
        setup() {
          viewModel = useKycAlertViewModel();

          return {};
        },
      },
    },
    template: '<TestChild />',
    setup() {
      provide(routerKey, {
        push: mockPush,
      });
      provide(routeLocationKey, mockRoute as any);

      return {};
    },
  });

  return viewModel;
};

describe('useKycAlertViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfilesStore.selectedUserProfileData.value = {
      isKycApproved: false,
      kyc_status: InvestKycTypes.pending,
    };
    mockProfilesStore.selectedUserProfileId.value = 123;
    mockProfilesStore.selectedUserProfileShowKycInitForm.value = false;
    mockProfilesStore.selectedUserProfileType.value = 'individual';
    mockProfilesStore.selectedUserIndividualProfile.value = null;
    mockSessionStore.userLoggedIn.value = true;
    mockRepositoryKyc.isPlaidLoading.value = false;
    handlePlaidKyc.mockResolvedValue({ success: true });
    mockPush.mockResolvedValue(undefined);
  });

  it('hides the alert for approved profiles', () => {
    mockProfilesStore.selectedUserProfileData.value = {
      isKycApproved: true,
      kyc_status: InvestKycTypes.approved,
    };

    const viewModel = createViewModel();

    expect(viewModel.alertModel.value.show).toBe(false);
  });

  it('navigates to submit KYC with redirect when the init form is required', async () => {
    mockProfilesStore.selectedUserProfileShowKycInitForm.value = true;

    const viewModel = createViewModel();
    await viewModel.onPrimaryAction();

    expect(mockPush).toHaveBeenCalledWith({
      path: '/profile/123/kyc',
      query: {
        tab: 'wallet',
        redirect: '/dashboard?tab=wallet',
      },
    });
    expect(handlePlaidKyc).not.toHaveBeenCalled();
  });

  it('starts Plaid directly when the init form is not required', async () => {
    const viewModel = createViewModel();
    await viewModel.onPrimaryAction();

    expect(handlePlaidKyc).toHaveBeenCalledWith(123);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('resolves SDIRA and SOLO401K profiles through the linked individual profile', async () => {
    mockProfilesStore.selectedUserProfileType.value = PROFILE_TYPES.SDIRA;
    mockProfilesStore.selectedUserIndividualProfile.value = { id: 999 };

    const viewModel = createViewModel();
    await viewModel.onPrimaryAction();

    expect(handlePlaidKyc).toHaveBeenCalledWith(999);
  });

  it('opens contact us when the description action targets the support link', () => {
    const viewModel = createViewModel();
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    viewModel.onDescriptionAction({
      target: {
        closest: (selector: string) => (selector === '[data-action="contact-us"]' ? {} : null),
      },
      preventDefault,
      stopPropagation,
    } as unknown as Event);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(openContactUsDialog).toHaveBeenCalledWith('dashboard verification');
  });

  it('opens contact us when keyboard activation comes from the rich-text wrapper', () => {
    const viewModel = createViewModel();
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    viewModel.onDescriptionAction({
      target: {
        closest: () => null,
      },
      currentTarget: {
        querySelector: (selector: string) => (selector === '[data-action="contact-us"]' ? {} : null),
      },
      preventDefault,
      stopPropagation,
    } as unknown as Event);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(openContactUsDialog).toHaveBeenCalledWith('dashboard verification');
  });

  it('reflects Plaid loading in the alert CTA state', () => {
    mockRepositoryKyc.isPlaidLoading.value = true;

    const viewModel = createViewModel();

    expect(viewModel.alertModel.value.isLoading).toBe(true);
    expect(viewModel.alertModel.value.isDisabled).toBe(true);
  });

  it('does not run the primary action when the alert has no CTA', async () => {
    mockProfilesStore.selectedUserProfileData.value = {
      isKycApproved: false,
      kyc_status: InvestKycTypes.in_progress,
    };

    const viewModel = createViewModel();
    await viewModel.onPrimaryAction();

    expect(handlePlaidKyc).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
