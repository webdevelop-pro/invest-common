import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import type { RouteLocationNormalized } from 'vue-router';
import { redirectProfileIdGuard } from '../redirectProfileIdGuard';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

// Mock the profiles store
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(),
}));

// Mock useRepositoryProfiles
vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(),
}));

// Mock storeToRefs
vi.mock('pinia', () => ({
  storeToRefs: (store: any) => ({
    userProfiles: { value: store.userProfiles.value },
    selectedUserProfileId: { value: store.selectedUserProfileId.value },
  }),
}));

describe('redirectProfileIdGuard', () => {
  const mockTo = {
    meta: {},
    params: {},
    name: 'test-route',
    query: {},
    matched: [],
    fullPath: '/test',
    hash: '',
    redirectedFrom: undefined,
    path: '/test',
  } as RouteLocationNormalized;
  const mockFrom = {
    matched: [],
    fullPath: '/',
    hash: '',
    redirectedFrom: undefined,
    path: '/',
    meta: {},
    params: {},
    name: 'home',
    query: {},
  } as RouteLocationNormalized;

  let mockGetUser: any;
  let mockRepositoryProfiles: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser = vi.fn().mockResolvedValue(undefined);
    mockRepositoryProfiles = { getUser: mockGetUser };
    vi.mocked(useRepositoryProfiles).mockReturnValue(mockRepositoryProfiles as any);
  });

  it('should return undefined when checkProfileIdInUrl is false', async () => {
    const to = { ...mockTo, meta: { checkProfileIdInUrl: false } };
    const result = await redirectProfileIdGuard(to);
    expect(result).toBeUndefined();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should redirect to first profile when no profile ID in URL but profiles exist', async () => {
    const mockStore = {
      userProfiles: { value: [{ id: 1 }, { id: 2 }] },
      selectedUserProfileId: { value: 1 },
      setSelectedUserProfileById: vi.fn(),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

    const to = { ...mockTo, meta: { checkProfileIdInUrl: true } };
    const result = await redirectProfileIdGuard(to);

    expect(result).toEqual({
      name: 'test-route',
      params: { ...to.params, profileId: 1 },
      query: {},
    });
  });

  it('should redirect to first available profile when profile ID does not exist', async () => {
    const mockStore = {
      userProfiles: { value: [{ id: 1 }, { id: 2 }] },
      selectedUserProfileId: { value: 42 },
      setSelectedUserProfileById: vi.fn(),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

    const to = { ...mockTo, meta: { checkProfileIdInUrl: true }, params: { profileId: '999' } };
    const result = await redirectProfileIdGuard(to);

    expect(result).toEqual({
      name: 'test-route',
      params: { ...to.params, profileId: 1 },
      query: {},
    });
  });

  it('should redirect to selectedUserProfileId if profiles array is empty but profileId is present in URL', async () => {
    const mockStore = {
      userProfiles: { value: [] },
      selectedUserProfileId: { value: 42 },
      setSelectedUserProfileById: vi.fn(),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

    const to = { ...mockTo, meta: { checkProfileIdInUrl: true }, params: { profileId: '999' } };
    const result = await redirectProfileIdGuard(to);

    // Should do nothing, as per guard logic (no profiles, returns undefined)
    expect(result).toBeUndefined();
    expect(mockGetUser).toHaveBeenCalled();
  });

  it('should set selected profile and return undefined when profile ID exists', async () => {
    const mockStore = {
      userProfiles: { value: [{ id: 1 }, { id: 2 }] },
      selectedUserProfileId: { value: 1 },
      setSelectedUserProfileById: vi.fn(),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

    const to = { ...mockTo, meta: { checkProfileIdInUrl: true }, params: { profileId: '2' } };
    const result = await redirectProfileIdGuard(to);

    expect(mockStore.setSelectedUserProfileById).toHaveBeenCalledWith(2);
    expect(result).toBeUndefined();
  });

  it('should handle empty profiles array gracefully', async () => {
    const mockStore = {
      userProfiles: { value: [] },
      selectedUserProfileId: { value: 1 },
      setSelectedUserProfileById: vi.fn(),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

    const to = { ...mockTo, meta: { checkProfileIdInUrl: true } };
    const result = await redirectProfileIdGuard(to);

    expect(result).toBeUndefined();
    expect(mockGetUser).toHaveBeenCalled();
  });
});
