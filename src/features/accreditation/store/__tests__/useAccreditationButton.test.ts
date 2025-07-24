import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { AccreditationTypes } from 'InvestCommon/types/api/invest';
import { AccreditationTextStatuses } from 'InvestCommon/data/accreditation/accreditation.types';
import { ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_PERSONAL_DETAILS } from 'InvestCommon/helpers/enums/routes';
import { ref } from 'vue';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';
import { useAccreditationButton } from '../useAccreditationButton';

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => ({
    selectedUserProfileData: ref(null),
    selectedUserProfileId: ref(null),
  })),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    userLoggedIn: ref(false),
  })),
}));

const routerMock = { push: vi.fn() };

vi.mock('vue-router', () => ({
  useRouter: () => routerMock,
  useRoute: () => ({
    query: {},
    params: {},
  }),
}));

function createMockProfilesStore({
  selectedUserProfileData = null,
  selectedUserProfileId = null,
  selectedUserProfileType = PROFILE_TYPES.INDIVIDUAL,
  userProfiles = [],
  isSelectedProfileLoading = false,
  selectedUserIndividualProfile = null,
  selectedUserProfileShowKycInitForm = false,
  isTrustRevocable = false,
} = {}) {
  return {
    userProfiles: ref(userProfiles),
    selectedUserProfileId: ref(selectedUserProfileId),
    selectedUserProfileData: ref(selectedUserProfileData),
    selectedUserProfileType: ref(selectedUserProfileType),
    isSelectedProfileLoading: ref(isSelectedProfileLoading),
    selectedUserIndividualProfile: ref(selectedUserIndividualProfile),
    selectedUserProfileShowKycInitForm: ref(selectedUserProfileShowKycInitForm),
    isTrustRevocable: ref(isTrustRevocable),
    setSelectedUserProfileById: vi.fn(), // <-- Add this mock method
  };
}

describe('useAccreditationButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routerMock.push.mockClear();
    vi.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const store = useAccreditationButton();
    expect(store.isLoading).toBe(true);
  });

  it('should compute correct data for new accreditation status', () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.new,
        escrow_id: null,
      },
      selectedUserProfileId: 123,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);

    const store = useAccreditationButton();

    expect(store.data).toEqual({
      ...AccreditationTextStatuses[AccreditationTypes.new],
      to: {
        name: ROUTE_ACCREDITATION_UPLOAD,
        params: { profileId: 123 },
      },
    });
  });

  it('should compute correct tag background for approved status', () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.approved,
      },
      selectedUserProfileId: null,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);

    const store = useAccreditationButton();
    expect(store.tagBackground).toBe('secondary');
  });

  it('should compute correct tag background and class for declined status', () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: 'declined' as AccreditationTypes,
      },
      selectedUserProfileId: null,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);

    const store = useAccreditationButton();
    expect(store.tagBackground).toBe('red');
  });

  it('should compute correct tag background for pending status', () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.pending,
      },
      selectedUserProfileId: null,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);

    const store = useAccreditationButton();
    expect(store.tagBackground).toBe('yellow');
  });

  it('should be clickable for new accreditation status', () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.new,
      },
      selectedUserProfileId: null,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);

    const store = useAccreditationButton();
    expect(store.isAccreditationIsClickable).toBe(true);
  });

  it('should not be clickable for pending accreditation status', () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.pending,
      },
      selectedUserProfileId: null,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);

    const store = useAccreditationButton();
    expect(store.isAccreditationIsClickable).toBe(false);
  });

  it('should not be clickable for approved accreditation status', () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.approved,
      },
      selectedUserProfileId: null,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);

    const store = useAccreditationButton();
    expect(store.isAccreditationIsClickable).toBe(false);
  });

  it('should handle click when user is logged in and accreditation is clickable', async () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.new,
        escrow_id: null,
      },
      selectedUserProfileId: 123,
    });
    const mockSessionStore = {
      userLoggedIn: ref(true),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);
    vi.mocked(useSessionStore).mockReturnValue(mockSessionStore);

    const store = useAccreditationButton();

    await store.onClick();
    expect(routerMock.push).toHaveBeenCalledWith({
      name: ROUTE_DASHBOARD_PERSONAL_DETAILS,
      params: { profileId: 123 },
      query: { accreditation: true },
    });
  });

  it('should handle click when user has escrow_id', async () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.new,
        escrow_id: 'escrow123',
      },
      selectedUserProfileId: 123,
    });
    const mockSessionStore = {
      userLoggedIn: ref(true),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);
    vi.mocked(useSessionStore).mockReturnValue(mockSessionStore);

    const store = useAccreditationButton();

    await store.onClick();
    expect(routerMock.push).toHaveBeenCalledWith({
      name: ROUTE_ACCREDITATION_UPLOAD,
      params: { profileId: 123 },
    });
  });

  it('should not handle click when user is not logged in', async () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.new,
      },
      selectedUserProfileId: null,
    });
    const mockSessionStore = {
      userLoggedIn: ref(false),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);
    vi.mocked(useSessionStore).mockReturnValue(mockSessionStore);

    const store = useAccreditationButton();

    await store.onClick();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('should not handle click when accreditation is not clickable', async () => {
    const mockSessionStore = {
      userLoggedIn: ref(true),
    };
    // Test pending status
    const mockProfilesStorePending = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.pending,
        escrow_id: null,
      },
      selectedUserProfileId: 123,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStorePending);

    const storePending = useAccreditationButton();
    await storePending.onClick();
    expect(routerMock.push).not.toHaveBeenCalled();

    // Test approved status
    const mockProfilesStoreApproved = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.approved,
        escrow_id: null,
      },
      selectedUserProfileId: 123,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStoreApproved);

    const storeApproved = useAccreditationButton();
    await storeApproved.onClick();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('should handle missing profile data gracefully', () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: null,
      selectedUserProfileId: null,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);

    const store = useAccreditationButton();

    expect(store.data).toBeDefined();
    expect(store.isAccreditationIsClickable).toBe(false);
  });

  it('should handle undefined accreditation status', () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: undefined,
        escrow_id: null,
      },
      selectedUserProfileId: null,
    });
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);

    const store = useAccreditationButton();

    expect(store.tagBackground).toBeDefined();
    expect(store.isAccreditationIsClickable).toBe(false);
  });

  it('should handle click with missing profile ID', async () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.new,
        escrow_id: null,
      },
      selectedUserProfileId: null,
    });
    const mockSessionStore = {
      userLoggedIn: ref(true),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);
    vi.mocked(useSessionStore).mockReturnValue(mockSessionStore);

    const store = useAccreditationButton();

    await store.onClick();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('should use individual profile id for SDIRA type on click', async () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.new,
        escrow_id: null,
      },
      selectedUserProfileId: 123,
      selectedUserProfileType: PROFILE_TYPES.SDIRA,
      selectedUserIndividualProfile: { id: 999 },
    });
    const mockSessionStore = { userLoggedIn: ref(true) };
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);
    vi.mocked(useSessionStore).mockReturnValue(mockSessionStore);
    const store = useAccreditationButton();
    await store.onClick();
    expect(routerMock.push).toHaveBeenCalledWith({
      name: ROUTE_DASHBOARD_PERSONAL_DETAILS,
      params: { profileId: 999 },
      query: { accreditation: true },
    });
  });

  it('should use individual profile id for SOLO401K type on click', async () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.new,
        escrow_id: null,
      },
      selectedUserProfileId: 123,
      selectedUserProfileType: PROFILE_TYPES.SOLO401K,
      selectedUserIndividualProfile: { id: 888 },
    });
    const mockSessionStore = { userLoggedIn: ref(true) };
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);
    vi.mocked(useSessionStore).mockReturnValue(mockSessionStore);
    const store = useAccreditationButton();
    await store.onClick();
    expect(routerMock.push).toHaveBeenCalledWith({
      name: ROUTE_DASHBOARD_PERSONAL_DETAILS,
      params: { profileId: 888 },
      query: { accreditation: true },
    });
  });

  it('should use individual profile id for revocable trust on click', async () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.new,
        escrow_id: null,
      },
      selectedUserProfileId: 123,
      selectedUserProfileType: PROFILE_TYPES.TRUST,
      selectedUserIndividualProfile: { id: 777 },
      isTrustRevocable: true,
    });
    const mockSessionStore = { userLoggedIn: ref(true) };
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);
    vi.mocked(useSessionStore).mockReturnValue(mockSessionStore);
    const store = useAccreditationButton();
    await store.onClick();
    expect(routerMock.push).toHaveBeenCalledWith({
      name: ROUTE_DASHBOARD_PERSONAL_DETAILS,
      params: { profileId: 777 },
      query: { accreditation: true },
    });
  });

  it('should fallback to selectedUserProfileId if individual profile is null', async () => {
    const mockProfilesStore = createMockProfilesStore({
      selectedUserProfileData: {
        accreditation_status: AccreditationTypes.new,
        escrow_id: null,
      },
      selectedUserProfileId: 123,
      selectedUserProfileType: PROFILE_TYPES.SDIRA,
      selectedUserIndividualProfile: null,
    });
    const mockSessionStore = { userLoggedIn: ref(true) };
    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);
    vi.mocked(useSessionStore).mockReturnValue(mockSessionStore);
    const store = useAccreditationButton();
    await store.onClick();
    expect(routerMock.push).toHaveBeenCalledWith({
      name: ROUTE_DASHBOARD_PERSONAL_DETAILS,
      params: { profileId: 123 },
      query: { accreditation: true },
    });
  });
});
