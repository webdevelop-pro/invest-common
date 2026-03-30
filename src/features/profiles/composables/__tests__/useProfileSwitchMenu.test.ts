import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { InvestKycTypes } from 'InvestCommon/data/kyc/kyc.types';
import { useProfileSwitchMenu } from '../useProfileSwitchMenu';

const mockPush = vi.fn();
const mockSetSelectedUserProfileById = vi.fn();
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

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    currentRoute: {
      value: {
        name: 'ROUTE_DASHBOARD_SUMMARY',
        params: {
          profileId: '2',
          investId: '77',
        },
        query: {
          tab: 'summary',
        },
      },
    },
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
  }),
}));

describe('useProfileSwitchMenu', () => {
  beforeEach(() => {
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
    mockPush.mockClear();
    mockSetSelectedUserProfileById.mockClear();
  });

  it('exposes the selected profile label and eligibility', () => {
    const composable = useProfileSwitchMenu();

    expect(composable.selectedProfileLabel.value).toBe('EN2: Growth SPV');
  });

  it('builds profile items with active and create states', () => {
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

  it('preserves existing route params and query when switching profiles', async () => {
    const composable = useProfileSwitchMenu();

    await composable.onSelectProfile('1');

    expect(mockPush).toHaveBeenCalledWith({
      name: 'ROUTE_DASHBOARD_SUMMARY',
      params: {
        profileId: '1',
        investId: '77',
      },
      query: {
        tab: 'summary',
      },
    });
    expect(mockSetSelectedUserProfileById).toHaveBeenCalledWith(1);
  });

  it('routes to create-profile when choosing the add-new action', async () => {
    const composable = useProfileSwitchMenu();

    await composable.onSelectProfile('new');

    expect(mockSetSelectedUserProfileById).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith({
      name: 'ROUTE_CREATE_PROFILE',
    });
  });

  it('does not navigate or mutate state when selecting the active profile', async () => {
    const composable = useProfileSwitchMenu();

    await composable.onSelectProfile('2');

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockSetSelectedUserProfileById).not.toHaveBeenCalled();
  });
});
