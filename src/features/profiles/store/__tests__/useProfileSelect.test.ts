import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import { useProfileSelectStore } from '../useProfileSelect';

const mockPush = vi.fn();
const mockSetSelectedUserProfileById = vi.fn();

vi.mock('InvestCommon/domain/config/enums/routes', () => ({
  ROUTE_CREATE_PROFILE: 'ROUTE_CREATE_PROFILE',
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    currentRoute: { value: { name: 'test-route', query: {} } },
  })),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => ({
    selectedUserProfileId: ref(1),
    userProfiles: ref([
      { id: 1, type: 'individual', data: { name: 'John Doe' }, kyc_status: InvestKycTypes.approved },
      { id: 2, type: 'entity', data: { name: 'Company Inc' }, kyc_status: InvestKycTypes.pending },
    ]),
    setSelectedUserProfileById: mockSetSelectedUserProfileById,
  })),
}));

describe('useProfileSelectStore', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSetSelectedUserProfileById.mockClear();
  });

  it('initializes with default value and loading resolved when profile is selected', () => {
    const composable = useProfileSelectStore();
    expect(composable.defaultValue.value).toBe('1');
    // watch with immediate:true should flip loading to false when id > 0
    expect(composable.isLoading.value).toBe(false);
  });

  it('formats user profiles list correctly and appends add-new option', () => {
    const composable = useProfileSelectStore();
    const formattedList = composable.userListFormatted.value;

    expect(formattedList).toHaveLength(3);

    expect(formattedList[0]).toMatchObject({
      text: 'IN1: Individual Investment Profile',
      id: '1',
      kycStatusLabel: 'Eligible',
    });

    expect(formattedList[1]).toMatchObject({
      text: 'EN2: Company Inc Investment Profile',
      id: '2',
      kycStatusLabel: 'Not eligible',
    });

    expect(formattedList[2]).toEqual({
      text: '+ Add A New Investment Profile',
      id: 'new',
    });
  });

  it('marks non-approved profiles as disabled when hideDisabled option is used', () => {
    const composable = useProfileSelectStore({ hideDisabled: true });
    const formattedList = composable.userListFormatted.value;

    const pendingProfile = formattedList.find((item) => item.id === '2')!;
    expect(pendingProfile.disabled).toBe(true);
    expect(pendingProfile.disabledMessage).toBe('Identity verification is needed.');
  });

  it('handles profile selection for existing profile', () => {
    const composable = useProfileSelectStore();
    composable.onUpdateSelectedProfile('2');

    expect(mockSetSelectedUserProfileById).toHaveBeenCalledWith(2);
    expect(mockPush).toHaveBeenCalledWith({
      name: 'test-route',
      params: { profileId: '2' },
      query: undefined,
    });
  });

  it('handles \"new\" profile selection by routing to create-profile route', () => {
    const composable = useProfileSelectStore();
    composable.onUpdateSelectedProfile('new');
    expect(mockPush).toHaveBeenCalledWith({
      name: 'ROUTE_CREATE_PROFILE',
    });
  });

  it('preserves query parameters when selecting existing profile', () => {
    const mockRouterWithQuery = {
      push: mockPush,
      currentRoute: { value: { name: 'test-route', query: { tab: 'overview', filter: 'active' } } },
    } as any;

    vi.mocked(useRouter).mockReturnValue(mockRouterWithQuery);

    const composable = useProfileSelectStore();
    composable.onUpdateSelectedProfile('1');

    expect(mockSetSelectedUserProfileById).toHaveBeenCalledWith(1);
    expect(mockPush).toHaveBeenCalledWith({
      name: 'test-route',
      params: { profileId: '1' },
      query: { tab: 'overview', filter: 'active' },
    });
  });

  it('does not update selection for invalid id', () => {
    const composable = useProfileSelectStore();
    const router = useRouter();
    composable.onUpdateSelectedProfile('');

    expect(mockSetSelectedUserProfileById).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

