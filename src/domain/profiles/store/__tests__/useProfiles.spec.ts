import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useRoute } from 'vue-router';
import { ref } from 'vue';
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
    });

    // Mock session store
    (useSessionStore as any).mockReturnValue({
      userSession: ref({ expires_at: '2024-12-31' }),
      userLoggedIn: ref(false),
    });

    // Mock repository
    (useRepositoryProfiles as any).mockReturnValue({
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
    });
  });

  it('should initialize with default values', () => {
    const store = useProfilesStore();
    expect(store.selectedUserProfileId).toBe(0);
    expect(store.userProfiles).toEqual([
      { id: 123, type: 'individual', name: 'Test Profile' },
      { id: 456, type: 'sdira', name: 'Company Profile' },
    ]);
  });

  it('should set selected user profile', () => {
    const store = useProfilesStore();
    store.setSelectedUserProfileById(123);
    expect(store.selectedUserProfileId).toBe(123);
  });

  it('should not set selected user profile if id is 0', () => {
    const store = useProfilesStore();
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

    expect(store.selectedUserProfileData?.name).toBe('Updated Name');
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
    expect(store.selectedUserProfileData?.name).toBe('Updated Name');
  });

  it('should handle profile selection when user is logged in', () => {
    const store = useProfilesStore();
    const repository = useRepositoryProfiles();
    const sessionStore = useSessionStore();

    // Set user as logged in
    sessionStore.userLoggedIn.value = true;

    // Mock route to match the profile ID
    (useRoute as any).mockReturnValue({
      params: { profileId: '123' },
    });

    // Mock repository to return profile data
    (useRepositoryProfiles as any).mockReturnValue({
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
    });
    store.setSelectedUserProfileById(123);
    store.updateSelectedAccount();

    expect(repository.getProfileById).toHaveBeenCalledWith('individual', 123);
  });
});
