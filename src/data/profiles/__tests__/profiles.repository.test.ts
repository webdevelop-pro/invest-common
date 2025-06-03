import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ApiClient } from 'UiKit/helpers/api/apiClient';
import { toasterErrorHandling } from 'UiKit/helpers/api/toasterErrorHandling';
import { useRepositoryProfiles } from '../profiles.repository';

// Mock ApiClient
vi.mock('UiKit/helpers/api/apiClient', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    post: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    patch: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    options: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
  })),
}));

// Mock toaster error handling
vi.mock('UiKit/helpers/api/toasterErrorHandling', () => ({
  toasterErrorHandling: vi.fn(),
}));

// Mock ProfileFormatter
vi.mock('../profiles.formatter', () => ({
  ProfileFormatter: vi.fn().mockImplementation((profile) => ({
    format: vi.fn().mockReturnValue({
      ...profile,
      formattedName: `${profile.firstName} ${profile.lastName}`,
      formattedEmail: profile.email,
      formattedPhone: profile.phone,
    }),
  })),
}));

describe('Profiles Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const pinia = createPinia();
    setActivePinia(pinia);
  });

  describe('getProfileOptions', () => {
    it('should fetch profile options successfully', async () => {
      const mockOptions = {
        definitions: {
          RegCF: {
            properties: { test: 'value' },
          },
        },
      };

      const mockOptionsFn = vi.fn().mockImplementation(() => Promise.resolve({ data: mockOptions }));
      vi.mocked(ApiClient).mockImplementation(() => ({
        options: mockOptionsFn,
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
      }));

      const repository = useRepositoryProfiles();
      const result = await repository.getProfileOptions('individual');

      expect(result).toEqual(mockOptions);
      expect(repository.profileOptions).toEqual(mockOptions);
      expect(repository.isLoadingProfileOptions).toBe(false);
      expect(repository.error).toBeNull();
      expect(toasterErrorHandling).not.toHaveBeenCalled();
    });

    it('should handle fetch profile options error', async () => {
      const mockError = new Error('Network error');
      const mockOptionsFn = vi.fn().mockImplementation(() => Promise.reject(mockError));
      vi.mocked(ApiClient).mockImplementation(() => ({
        options: mockOptionsFn,
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
      }));

      const repository = useRepositoryProfiles();

      await expect(repository.getProfileOptions('individual')).rejects.toThrow(mockError);
      expect(repository.error).toBe(mockError);
      expect(repository.isLoadingProfileOptions).toBe(false);
      expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to fetch profile options');
    });
  });

  describe('setProfile', () => {
    it('should set profile successfully', async () => {
      const mockProfile = { id: 1, type: 'individual' };
      const mockPost = vi.fn().mockImplementation(() => Promise.resolve({ data: mockProfile }));
      vi.mocked(ApiClient).mockImplementation(() => ({
        post: mockPost,
        get: vi.fn(),
        patch: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();
      const result = await repository.setProfile(mockProfile, 'individual');

      expect(result).toEqual(mockProfile);
      expect(repository.profileData).toEqual(mockProfile);
      expect(repository.isLoadingSetProfile).toBe(false);
      expect(repository.error).toBeNull();
      expect(toasterErrorHandling).not.toHaveBeenCalled();
    });

    it('should handle set profile error', async () => {
      const mockError = new Error('Network error');
      const mockPost = vi.fn().mockImplementation(() => Promise.reject(mockError));
      vi.mocked(ApiClient).mockImplementation(() => ({
        post: mockPost,
        get: vi.fn(),
        patch: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();

      await expect(repository.setProfile({}, 'individual')).rejects.toThrow(mockError);
      expect(repository.error).toBe(mockError);
      expect(repository.isLoadingSetProfile).toBe(false);
      expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to set profile');
    });
  });

  describe('getProfileById', () => {
    it('should fetch profile by id successfully', async () => {
      const mockProfile = { id: 1, type: 'individual' };
      const mockGet = vi.fn().mockImplementation(() => Promise.resolve({ data: mockProfile }));
      vi.mocked(ApiClient).mockImplementation(() => ({
        get: mockGet,
        post: vi.fn(),
        patch: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();
      const result = await repository.getProfileById('individual', 1);

      expect(result).toEqual(mockProfile);
      expect(repository.profileById).toEqual(mockProfile);
      expect(repository.isLoadingGetProfileById).toBe(false);
      expect(repository.error).toBeNull();
      expect(toasterErrorHandling).not.toHaveBeenCalled();
    });

    it('should handle fetch profile by id error', async () => {
      const mockError = new Error('Network error');
      const mockGet = vi.fn().mockImplementation(() => Promise.reject(mockError));
      vi.mocked(ApiClient).mockImplementation(() => ({
        get: mockGet,
        post: vi.fn(),
        patch: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();

      await expect(repository.getProfileById('individual', 1)).rejects.toThrow(mockError);
      expect(repository.error).toBe(mockError);
      expect(repository.isLoadingGetProfileById).toBe(false);
      expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to fetch profile by ID');
    });
  });

  describe('setProfileById', () => {
    it('should update profile by id successfully', async () => {
      const mockProfile = { id: 1, type: 'individual' };
      const mockPatch = vi.fn().mockImplementation(() => Promise.resolve({ data: mockProfile }));
      vi.mocked(ApiClient).mockImplementation(() => ({
        patch: mockPatch,
        get: vi.fn(),
        post: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();
      const result = await repository.setProfileById(mockProfile, 'individual', 1);

      expect(result).toEqual(mockProfile);
      expect(repository.profileById).toEqual(mockProfile);
      expect(repository.isLoadingSetProfileById).toBe(false);
      expect(repository.error).toBeNull();
      expect(toasterErrorHandling).not.toHaveBeenCalled();
    });

    it('should handle update profile by id error', async () => {
      const mockError = new Error('Network error');
      const mockPatch = vi.fn().mockImplementation(() => Promise.reject(mockError));
      vi.mocked(ApiClient).mockImplementation(() => ({
        patch: mockPatch,
        get: vi.fn(),
        post: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();

      await expect(repository.setProfileById({}, 'individual', 1)).rejects.toThrow(mockError);
      expect(repository.error).toBe(mockError);
      expect(repository.isLoadingSetProfileById).toBe(false);
      expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to update profile');
    });
  });

  describe('getUser', () => {
    it('should fetch user data successfully', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      const mockGet = vi.fn().mockImplementation(() => Promise.resolve({ data: mockUser }));
      vi.mocked(ApiClient).mockImplementation(() => ({
        get: mockGet,
        post: vi.fn(),
        patch: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();
      const result = await repository.getUser();

      expect(result).toEqual(mockUser);
      expect(repository.userData).toEqual(mockUser);
      expect(repository.isLoadingGetUser).toBe(false);
      expect(repository.error).toBeNull();
      expect(toasterErrorHandling).not.toHaveBeenCalled();
    });

    it('should handle fetch user data error', async () => {
      const mockError = new Error('Network error');
      const mockGet = vi.fn().mockImplementation(() => Promise.reject(mockError));
      vi.mocked(ApiClient).mockImplementation(() => ({
        get: mockGet,
        post: vi.fn(),
        patch: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();

      await expect(repository.getUser()).rejects.toThrow(mockError);
      expect(repository.error).toBe(mockError);
      expect(repository.isLoadingGetUser).toBe(false);
      expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to fetch user data');
    });
  });

  describe('setUser', () => {
    it('should update user data successfully', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      const mockPatch = vi.fn().mockImplementation(() => Promise.resolve({ data: mockUser }));
      vi.mocked(ApiClient).mockImplementation(() => ({
        patch: mockPatch,
        get: vi.fn(),
        post: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();
      const result = await repository.setUser(mockUser);

      expect(result).toEqual(mockUser);
      expect(repository.profileData).toEqual(mockUser);
      expect(repository.isLoadingSetUser).toBe(false);
      expect(repository.error).toBeNull();
      expect(toasterErrorHandling).not.toHaveBeenCalled();
    });

    it('should handle update user data error', async () => {
      const mockError = new Error('Network error');
      const mockPatch = vi.fn().mockImplementation(() => Promise.reject(mockError));
      vi.mocked(ApiClient).mockImplementation(() => ({
        patch: mockPatch,
        get: vi.fn(),
        post: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();

      await expect(repository.setUser({})).rejects.toThrow(mockError);
      expect(repository.error).toBe(mockError);
      expect(repository.isLoadingSetUser).toBe(false);
      expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to update user data');
    });
  });

  describe('setUserOptions', () => {
    it('should fetch user options successfully', async () => {
      const mockOptions = { options: 'test' };
      const mockOptionsFn = vi.fn().mockImplementation(() => Promise.resolve({ data: mockOptions }));
      vi.mocked(ApiClient).mockImplementation(() => ({
        options: mockOptionsFn,
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
      }));

      const repository = useRepositoryProfiles();
      const result = await repository.setUserOptions();

      expect(result).toEqual(mockOptions);
      expect(repository.isLoadingSetUserOptions).toBe(false);
      expect(repository.error).toBeNull();
      expect(toasterErrorHandling).not.toHaveBeenCalled();
    });

    it('should handle fetch user options error', async () => {
      const mockError = new Error('Network error');
      const mockOptionsFn = vi.fn().mockImplementation(() => Promise.reject(mockError));
      vi.mocked(ApiClient).mockImplementation(() => ({
        options: mockOptionsFn,
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
      }));

      const repository = useRepositoryProfiles();

      await expect(repository.setUserOptions()).rejects.toThrow(mockError);
      expect(repository.error).toBe(mockError);
      expect(repository.isLoadingSetUserOptions).toBe(false);
      expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to fetch user options');
    });
  });

  describe('updateUserData', () => {
    it('should update user data with custom headers successfully', async () => {
      const mockResponse = { success: true };
      const mockPatch = vi.fn().mockImplementation(() => Promise.resolve({ data: mockResponse }));
      vi.mocked(ApiClient).mockImplementation(() => ({
        patch: mockPatch,
        get: vi.fn(),
        post: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();
      const result = await repository.updateUserData(1, '{"name":"Test"}');

      expect(result).toEqual(mockResponse);
      expect(repository.isLoadingUpdateUserData).toBe(false);
      expect(repository.error).toBeNull();
      expect(toasterErrorHandling).not.toHaveBeenCalled();
      expect(mockPatch).toHaveBeenCalledWith(
        '/auth/user',
        '{"name":"Test"}',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          }),
        }),
      );
    });

    it('should handle update user data with custom headers error', async () => {
      const mockError = new Error('Network error');
      const mockPatch = vi.fn().mockImplementation(() => Promise.reject(mockError));
      vi.mocked(ApiClient).mockImplementation(() => ({
        patch: mockPatch,
        get: vi.fn(),
        post: vi.fn(),
        options: vi.fn(),
      }));

      const repository = useRepositoryProfiles();

      await expect(repository.updateUserData(1, '{"name":"Test"}')).rejects.toThrow(mockError);
      expect(repository.error).toBe(mockError);
      expect(repository.isLoadingUpdateUserData).toBe(false);
      expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to update user data');
    });
  });

  describe('resetAll', () => {
    it('should reset all state values', () => {
      const repository = useRepositoryProfiles();

      // Set some values using $patch
      repository.$patch((state) => {
        state.profileData = { id: 1 };
        state.profileOptions = { options: 'test' };
        state.profileById = { id: 2 };
        state.userData = { id: 3 };
        state.error = new Error('test');
      });

      // Reset all
      repository.resetAll();

      expect(repository.profileData).toBeUndefined();
      expect(repository.profileOptions).toBeUndefined();
      expect(repository.profileById).toBeUndefined();
      expect(repository.userData).toBeUndefined();
      expect(repository.error).toBeNull();
    });
  });

  describe('formattedProfileData', () => {
    it('should return formatted profile data when profile data exists', () => {
      const mockProfile = {
        id: 1,
        type: 'individual',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
      };
      const repository = useRepositoryProfiles();

      // Initialize the store state
      repository.$patch((state) => {
        state.profileData = mockProfile;
      });

      expect(repository.formattedProfileData).toEqual(mockProfile);
    });

    it('should return undefined when profile data is undefined', () => {
      const repository = useRepositoryProfiles();

      // Initialize the store state
      repository.$patch((state) => {
        state.profileData = undefined;
      });

      expect(repository.formattedProfileData).toBeUndefined();
    });
  });
});
