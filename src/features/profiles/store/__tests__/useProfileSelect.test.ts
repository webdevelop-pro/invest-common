import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { useProfileSelectStore } from '../useProfileSelect';

const mockPush = vi.fn();
const mockSetSelectedUserProfileById = vi.fn();

vi.mock('InvestCommon/helpers/enums/routes', () => ({
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
      { id: 1, type: 'individual', data: { name: 'John Doe' } },
      { id: 2, type: 'entity', data: { name: 'Company Inc' } },
    ]),
    setSelectedUserProfileById: mockSetSelectedUserProfileById,
  })),
}));

describe('useProfileSelectStore', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSetSelectedUserProfileById.mockClear();
  });

  it('should initialize with correct default values', () => {
    const composable = useProfileSelectStore();
    expect(composable.defaultValue.value).toBe('1');
  });

  it('should format user profiles list correctly', () => {
    const composable = useProfileSelectStore();
    const formattedList = composable.userListFormatted.value;

    expect(formattedList).toHaveLength(3);
    expect(formattedList[0]).toEqual({
      text: 'EN2: Company Inc Investment Profile',
      id: '2',
    });
    expect(formattedList[1]).toEqual({
      text: 'IN1: Individual Investment Profile',
      id: '1',
    });
    expect(formattedList[2]).toEqual({
      text: '+ Add A New Investment Account',
      id: 'new',
    });
  });

  it('should handle profile selection for existing profile', () => {
    const composable = useProfileSelectStore();
    composable.onUpdateSelectedProfile('2');

    expect(mockSetSelectedUserProfileById).toHaveBeenCalledWith(2);
    expect(mockPush).toHaveBeenCalledWith({
      name: 'test-route',
      params: { profileId: '2' },
      query: undefined,
    });
  });

  it('should handle "new" profile selection', () => {
    const composable = useProfileSelectStore();
    composable.onUpdateSelectedProfile('new');
    expect(mockPush).toHaveBeenCalledWith({
      name: 'ROUTE_CREATE_PROFILE',
    });
  });

  it('should preserve query parameters when selecting existing profile', () => {
    // Mock router with query parameters
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

  it('should not update selection for invalid id', () => {
    const composable = useProfileSelectStore();
    const router = useRouter();
    composable.onUpdateSelectedProfile('');

    expect(mockSetSelectedUserProfileById).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('should update loading state when profile is selected', async () => {
    const composable = useProfileSelectStore();
    mockSetSelectedUserProfileById(1);
    expect(composable.isLoading.value).toBe(false);
  });
});
