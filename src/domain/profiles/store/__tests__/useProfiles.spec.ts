import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useRoute } from 'vue-router';
import { ref, computed } from 'vue';
import { useProfilesStore } from '../useProfiles';

// Mock dependencies
vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}));

vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: vi.fn(),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(),
}));

describe('useProfilesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    // Mock route
    (useRoute as any).mockReturnValue({
      params: { profileId: '123' },
    });

    // Mock cookies
    (useCookies as any).mockReturnValue({
      set: vi.fn(),
      get: vi.fn().mockReturnValue(0),
    });

    // Mock session store
    const mockSessionStore = {
      userSession: ref({
        active: true,
        expires_at: '2024-12-31',
        identity: { traits: {} },
      }),
      userLoggedIn: computed(() => true),
      userSessionTraits: computed(() => ({})),
    };
    (useSessionStore as any).mockReturnValue(mockSessionStore);

    // Mock repository
    const mockRepository = {
      getUserState: ref({
        data: {
          profiles: [
            { id: 123, type: 'individual', name: 'Test Profile' },
            { id: 456, type: 'sdira', name: 'Company Profile' },
          ],
        },
        loading: false,
        error: null,
      }),
      getProfileByIdState: ref({
        data: { id: 123, type: 'individual', name: 'Test Profile' },
        loading: false,
        error: null,
      }),
      getUser: vi.fn(),
      getProfileById: vi.fn(),
      getProfileByIdOptions: vi.fn(),
    };
    (useRepositoryProfiles as any).mockReturnValue(mockRepository);
  });

  it('should initialize with default values when user is logged in', () => {
    const store = useProfilesStore();
    // When user is logged in and profiles are available, the store automatically selects the first profile
    expect(store.selectedUserProfileId).toBe(123);
    expect(store.userProfiles).toEqual([
      { id: 123, type: 'individual', name: 'Test Profile' },
      { id: 456, type: 'sdira', name: 'Company Profile' },
    ]);
  });

  it('should initialize with 0 when user is not logged in', () => {
    // Reset Pinia store
    setActivePinia(createPinia());

    // Mock cookies to return 0
    (useCookies as any).mockReturnValue({
      set: vi.fn(),
      get: vi.fn().mockReturnValue(0),
    });

    // Mock session store with user not logged in
    const mockSessionStore = {
      userSession: ref({
        active: false,
        expires_at: '2024-12-31',
        identity: { traits: {} },
      }),
      userLoggedIn: computed(() => false),
      userSessionTraits: computed(() => ({})),
    };
    (useSessionStore as any).mockReturnValue(mockSessionStore);

    // Mock repository with empty profiles
    const mockRepository = {
      getUserState: ref({
        data: {
          profiles: [],
        },
        loading: false,
        error: null,
      }),
      getProfileByIdState: ref({
        data: null,
        loading: false,
        error: null,
      }),
      getUser: vi.fn(),
      getProfileById: vi.fn(),
      getProfileByIdOptions: vi.fn(),
    };
    (useRepositoryProfiles as any).mockReturnValue(mockRepository);

    const store = useProfilesStore();
    expect(store.selectedUserProfileId).toBe(0);
  });

  it('should initialize with 0 when user is logged in but no profiles available', () => {
    // Reset Pinia store
    setActivePinia(createPinia());

    // Mock cookies to return 0
    (useCookies as any).mockReturnValue({
      set: vi.fn(),
      get: vi.fn().mockReturnValue(0),
    });

    // Mock session store with user logged in
    const mockSessionStore = {
      userSession: ref({
        active: true,
        expires_at: '2024-12-31',
        identity: { traits: {} },
      }),
      userLoggedIn: computed(() => true),
      userSessionTraits: computed(() => ({})),
    };
    (useSessionStore as any).mockReturnValue(mockSessionStore);

    // Mock repository with empty profiles
    const mockRepository = {
      getUserState: ref({
        data: {
          profiles: [],
        },
        loading: false,
        error: null,
      }),
      getProfileByIdState: ref({
        data: null,
        loading: false,
        error: null,
      }),
      getUser: vi.fn(),
      getProfileById: vi.fn(),
      getProfileByIdOptions: vi.fn(),
    };
    (useRepositoryProfiles as any).mockReturnValue(mockRepository);

    const store = useProfilesStore();
    expect(store.selectedUserProfileId).toBe(0);
  });

  it('should set selected user profile', () => {
    const store = useProfilesStore();
    store.setSelectedUserProfileById(123);
    expect(store.selectedUserProfileId).toBe(123);
  });

  it('should not set selected user profile if id is 0', () => {
    const store = useProfilesStore();
    // First set to a valid ID, then try to set to 0
    store.setSelectedUserProfileById(123);
    expect(store.selectedUserProfileId).toBe(123);

    store.setSelectedUserProfileById(0);
    expect(store.selectedUserProfileId).toBe(0);
  });

  it('should update selected account', () => {
    const store = useProfilesStore();
    store.setSelectedUserProfileById(123);
    store.updateSelectedAccount();

    const repository = useRepositoryProfiles();
    expect(repository.getProfileById).toHaveBeenCalledWith('individual', 123);
  });

  it('should update data in profile', () => {
    const store = useProfilesStore();
    store.setSelectedUserProfileById(123);
    store.updateDataInProfile('name', 'Updated Name');

    expect((store.selectedUserProfileData as { name?: string })?.name).toBe('Updated Name');
  });

  it('should update data from notification', () => {
    const store = useProfilesStore();
    store.setSelectedUserProfileById(123);

    const notification = {
      data: {
        fields: {
          object_id: 123,
          name: 'Updated Name',
        },
      },
    };

    store.updateData(notification as any);
    expect((store.selectedUserProfileData as { name?: string })?.name).toBe('Updated Name');
  });

  it('should handle profile selection when user is logged in', () => {
    const store = useProfilesStore();
    const repository = useRepositoryProfiles();

    // User is already logged in from the mock setup
    store.setSelectedUserProfileById(123);
    store.updateSelectedAccount();

    expect(repository.getProfileById).toHaveBeenCalledWith('individual', 123);
  });
});
