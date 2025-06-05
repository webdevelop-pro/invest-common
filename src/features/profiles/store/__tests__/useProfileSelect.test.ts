import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import { ref, nextTick } from 'vue';
import { useProfileSelectStore } from '../useProfileSelect';

// Mock the routes enum
vi.mock('InvestCommon/helpers/enums/routes', () => ({
  ROUTE_CREATE_PROFILE: 'ROUTE_CREATE_PROFILE',
}));

// Mock the router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    currentRoute: {
      value: {
        name: 'test-route',
      },
    },
  })),
}));

// Mock the profiles store
let mockSetSelectedUserProfileById: ReturnType<typeof vi.fn>;
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => {
    const selectedUserProfileId = ref(1);
    const userProfiles = ref([
      {
        id: 1,
        type: 'individual',
        data: { name: 'John Doe' },
      },
      {
        id: 2,
        type: 'entity',
        data: { name: 'Company Inc' },
      },
    ]);

    mockSetSelectedUserProfileById = vi.fn((id) => {
      selectedUserProfileId.value = Number(id);
    });

    return {
      selectedUserProfileId,
      userProfiles,
      setSelectedUserProfileById: mockSetSelectedUserProfileById,
    };
  }),
}));

describe('useProfileSelectStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    if (mockSetSelectedUserProfileById) {
      mockSetSelectedUserProfileById.mockClear();
    }
  });

  it('should initialize with correct default values', () => {
    const store = useProfileSelectStore();
    expect(store.defaultValue).toBe('1');
  });

  it('should format user profiles list correctly', () => {
    const store = useProfileSelectStore();
    const formattedList = store.userListFormatted;

    expect(formattedList).toHaveLength(3); // 2 profiles + "Add New" option
    expect(formattedList[0]).toEqual({
      text: 'IN1: Individual Investment Profile',
      id: '1',
    });
    expect(formattedList[1]).toEqual({
      text: 'EN2: Company Inc Investment Profile',
      id: '2',
    });
    expect(formattedList[2]).toEqual({
      text: '+ Add A New Investment Account',
      id: 'new',
    });
  });

  it('should handle profile selection for existing profile', () => {
    const store = useProfileSelectStore();
    store.onUpdateSelectedProfile('2');

    expect(mockSetSelectedUserProfileById).toHaveBeenCalledWith('2');
    expect(mockPush).toHaveBeenCalledWith({
      name: 'test-route',
      params: { profileId: '2' },
    });
  });

  it('should handle "new" profile selection', () => {
    const store = useProfileSelectStore();
    store.onUpdateSelectedProfile('new');
    expect(mockPush).toHaveBeenCalledWith({
      name: 'ROUTE_CREATE_PROFILE',
    });
  });

  it('should not update selection for invalid id', () => {
    const store = useProfileSelectStore();
    const router = useRouter();
    const profilesStore = useProfilesStore();
    store.onUpdateSelectedProfile('');

    expect(profilesStore.setSelectedUserProfileById).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('should update loading state when profile is selected', async () => {
    const store = useProfileSelectStore();
    const profilesStore = useProfilesStore();

    profilesStore.setSelectedUserProfileById(1);
    await nextTick();

    expect(store.isLoading).toBe(false);
  });
});
