import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import type { RouteLocationNormalized } from 'vue-router';
import { redirectProfileIdGuard } from '../redirectProfileIdGuard';

// Mock the profiles store
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(),
}));

// Mock storeToRefs
vi.mock('pinia', () => ({
  storeToRefs: (store: any) => ({
    userProfiles: { value: store.userProfiles.value },
    selectedUserProfileId: { value: store.selectedUserProfileId.value },
  }),
}));

describe('redirectProfileIdGuard', () => {
  const mockNext = vi.fn();
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call next() when checkProfileIdInUrl is false', () => {
    const to = { ...mockTo, meta: { checkProfileIdInUrl: false } };
    redirectProfileIdGuard(to, mockFrom, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should redirect to first profile when no profile ID in URL but profiles exist', () => {
    const mockStore = {
      userProfiles: { value: [{ id: 1 }, { id: 2 }] },
      selectedUserProfileId: { value: 1 },
      setSelectedUserProfileById: vi.fn(),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

    const to = { ...mockTo, meta: { checkProfileIdInUrl: true } };
    redirectProfileIdGuard(to, mockFrom, mockNext);

    expect(mockNext).toHaveBeenCalledWith({
      name: 'test-route',
      params: { profileId: 1 },
      query: {},
    });
  });

  it('should redirect to first available profile when profile ID does not exist', () => {
    const mockStore = {
      userProfiles: { value: [{ id: 1 }, { id: 2 }] },
      selectedUserProfileId: { value: 1 },
      setSelectedUserProfileById: vi.fn(),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

    const to = { ...mockTo, meta: { checkProfileIdInUrl: true }, params: { profileId: '999' } };
    redirectProfileIdGuard(to, mockFrom, mockNext);

    expect(mockNext).toHaveBeenCalledWith({
      name: 'test-route',
      params: { profileId: 1 },
      query: {},
    });
  });

  it('should set selected profile and continue when profile ID exists', () => {
    const mockStore = {
      userProfiles: { value: [{ id: 1 }, { id: 2 }] },
      selectedUserProfileId: { value: 1 },
      setSelectedUserProfileById: vi.fn(),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

    const to = { ...mockTo, meta: { checkProfileIdInUrl: true }, params: { profileId: '2' } };
    redirectProfileIdGuard(to, mockFrom, mockNext);

    expect(mockStore.setSelectedUserProfileById).toHaveBeenCalledWith(2);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should handle empty profiles array gracefully', () => {
    const mockStore = {
      userProfiles: { value: [] },
      selectedUserProfileId: { value: 1 },
      setSelectedUserProfileById: vi.fn(),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

    const to = { ...mockTo, meta: { checkProfileIdInUrl: true }, params: { profileId: '999' } };
    redirectProfileIdGuard(to, mockFrom, mockNext);

    expect(mockNext).toHaveBeenCalledWith({
      name: 'test-route',
      params: { profileId: 1 },
      query: {},
    });
  });
});
