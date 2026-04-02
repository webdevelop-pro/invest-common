import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { InvestKycTypes } from 'InvestCommon/data/kyc/kyc.types';

const mockRouterPush = vi.fn();
const mockSetSelectedUserProfileById = vi.fn();
const mockUpdateSelectedAccount = vi.fn();
const mockNavigateWithQueryParams = vi.fn();
const envState = {
  IS_STATIC_SITE: '0',
};
const selectedUserProfileId = ref(2);
const userProfiles = ref([
  {
    id: 1,
    type: 'individual',
    data: { name: 'Individual' },
    isKycApproved: false,
  },
  {
    id: 2,
    type: 'entity',
    data: { name: 'Growth SPV' },
    isKycApproved: true,
  },
] as any[]);

vi.mock('InvestCommon/config/env', () => ({
  default: envState,
}));

vi.mock('InvestCommon/domain/config/links', () => ({
  urlProfile: () => '/profile',
  urlCreateProfile: () => '/profile/create-new-profile',
}));

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: mockNavigateWithQueryParams,
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      if ('selectedUserProfileId' in store && 'userProfiles' in store) {
        return {
          selectedUserProfileId,
          userProfiles,
        };
      }

      return {};
    },
  };
});

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId,
    userProfiles,
    setSelectedUserProfileById: mockSetSelectedUserProfileById,
    updateSelectedAccount: mockUpdateSelectedAccount,
  }),
}));

const loadComposable = async () => {
  vi.resetModules();
  return (await import('../useProfileSwitchMenu')).useProfileSwitchMenu;
};

describe('useProfileSwitchMenu', () => {
  beforeEach(() => {
    envState.IS_STATIC_SITE = '0';
    selectedUserProfileId.value = 2;
    userProfiles.value = [
      {
        id: 1,
        type: 'individual',
        data: { name: 'Individual' },
        isKycApproved: false,
        kyc_status: InvestKycTypes.pending,
      },
      {
        id: 2,
        type: 'entity',
        data: { name: 'Growth SPV' },
        isKycApproved: true,
        kyc_status: InvestKycTypes.approved,
      },
    ] as any[];
    mockRouterPush.mockClear();
    mockSetSelectedUserProfileById.mockClear();
    mockUpdateSelectedAccount.mockClear();
    mockNavigateWithQueryParams.mockClear();
  });

  it('exposes the selected profile label and eligibility', async () => {
    const useProfileSwitchMenu = await loadComposable();
    const composable = useProfileSwitchMenu();

    expect(composable.selectedProfileLabel.value).toBe('EN2: Growth SPV');
  });

  it('builds profile items with active and create states', async () => {
    const useProfileSwitchMenu = await loadComposable();
    const composable = useProfileSwitchMenu();

    expect(composable.profileItems.value).toEqual([
      {
        id: '1',
        label: 'IN1: Individual Profile',
        statusLabel: 'Not eligible',
        statusVariant: 'error',
        isActive: false,
      },
      {
        id: '2',
        label: 'EN2: Growth SPV',
        statusLabel: 'Eligible',
        statusVariant: 'success',
        isActive: true,
      },
      {
        id: 'new',
        label: 'Add a new investment profile',
        isActive: false,
        isCreateAction: true,
      },
    ]);
  });

  it('updates selected profile for a different numeric id', async () => {
    const useProfileSwitchMenu = await loadComposable();
    const composable = useProfileSwitchMenu();

    await composable.onSelectProfile('1');

    expect(mockSetSelectedUserProfileById).toHaveBeenCalledWith(1);
    expect(mockUpdateSelectedAccount).toHaveBeenCalledTimes(1);
  });

  it('does not update the active profile again', async () => {
    const useProfileSwitchMenu = await loadComposable();
    const composable = useProfileSwitchMenu();

    await composable.onSelectProfile('2');

    expect(mockSetSelectedUserProfileById).not.toHaveBeenCalled();
    expect(mockUpdateSelectedAccount).not.toHaveBeenCalled();
  });

  it('routes to create-profile in app mode', async () => {
    const useProfileSwitchMenu = await loadComposable();
    const composable = useProfileSwitchMenu();

    await composable.onSelectProfile('new');

    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'ROUTE_CREATE_PROFILE' });
    expect(mockNavigateWithQueryParams).not.toHaveBeenCalled();
    expect(mockSetSelectedUserProfileById).not.toHaveBeenCalled();
    expect(mockUpdateSelectedAccount).not.toHaveBeenCalled();
  });

  it('uses navigateWithQueryParams for create-profile in static mode', async () => {
    envState.IS_STATIC_SITE = '1';
    const useProfileSwitchMenu = await loadComposable();
    const composable = useProfileSwitchMenu();

    await composable.onSelectProfile('new');

    expect(mockNavigateWithQueryParams).toHaveBeenCalledWith('/profile/create-new-profile');
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockSetSelectedUserProfileById).not.toHaveBeenCalled();
    expect(mockUpdateSelectedAccount).not.toHaveBeenCalled();
  });

  it('does not update selection for invalid ids', async () => {
    const useProfileSwitchMenu = await loadComposable();
    const composable = useProfileSwitchMenu();

    await composable.onSelectProfile('');
    await composable.onSelectProfile('abc');

    expect(mockSetSelectedUserProfileById).not.toHaveBeenCalled();
    expect(mockUpdateSelectedAccount).not.toHaveBeenCalled();
  });
});
