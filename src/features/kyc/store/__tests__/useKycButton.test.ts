/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, ref } from 'vue';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import { KycTextStatuses } from 'InvestCommon/data/kyc/kyc.types';
import { ROUTE_SUBMIT_KYC } from 'InvestCommon/domain/config/enums/routes';
import { urlContactUs, urlProfileKYC } from 'InvestCommon/domain/config/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';
import { useKycButton } from '../useKycButton';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
};
vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: () => mockCookies,
}));

const mockSessionStore = {
  userLoggedIn: ref(true),
  userSession: ref({ active: true, expires_at: new Date(Date.now() + 86400000).toISOString() }),
};
vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => mockSessionStore,
}));

const mockKycRepository = {
  isPlaidLoading: ref(false),
  handlePlaidKyc: vi.fn().mockResolvedValue(undefined),
};

vi.mock('InvestCommon/data/kyc/kyc.repository', () => ({
  useRepositoryKyc: vi.fn(() => mockKycRepository),
}));

// Mock window.location.href
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000/' },
  writable: true,
});

vi.mock('InvestCommon/domain/websockets/store/useWebsockets', () => ({
  useDomainWebSocketStore: () => ({
    webSocketHandler: vi.fn(),
  }),
}));

const mockProfilesStore = {
  selectedUserProfileData: ref(null as any),
  selectedUserProfileId: ref(123 as number | null),
  isSelectedProfileLoading: ref(false),
  selectedUserProfileShowKycInitForm: ref(false),
  selectedUserProfileType: ref(PROFILE_TYPES.SDIRA),
  selectedUserIndividualProfile: ref(null), // <-- added for test coverage
};
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => mockProfilesStore,
}));

const mockPush = vi.fn();
const mockRoute = {
  params: { profileId: '123' },
};
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => mockRoute,
}));

describe('useKycButton', () => {
  let pinia: any;
  let sessionStore: any;
  let profilesStore: any;
  let kycRepository: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    mockCookies.get.mockImplementation((key) => {
      if (key === 'session') {
        return { active: true, expires_at: new Date(Date.now() + 86400000).toISOString() };
      }
      if (key === 'selectedUserProfileId') {
        return 123;
      }
      return null;
    });

    vi.clearAllMocks();

    mockProfilesStore.selectedUserProfileData.value = null;
    mockProfilesStore.selectedUserProfileId.value = 123;
    mockProfilesStore.isSelectedProfileLoading.value = true;
    mockProfilesStore.selectedUserProfileShowKycInitForm.value = false;
    mockSessionStore.userLoggedIn.value = true;
    mockKycRepository.isPlaidLoading.value = false;

    sessionStore = useSessionStore();
    profilesStore = useProfilesStore();
    kycRepository = useRepositoryKyc();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const store = useKycButton();

      expect(store.isLoading).toBe(true);
      expect(store.isButtonLoading).toBe(false);
      expect(store.isButtonDisabled).toBe(false);
      expect(store.showContactUs).toBe(false);
    });
  });

  describe('kycStatus computed', () => {
    it('should return none when no profile data exists', () => {
      const store = useKycButton();
      expect(store.data.class).toBe(KycTextStatuses[InvestKycTypes.none].class);
    });

    it('should return profile kyc_status when available', () => {
      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.approved };

      const store = useKycButton();
      expect(store.data.class).toBe(KycTextStatuses[InvestKycTypes.approved].class);
    });
  });

  describe('data computed', () => {
    it('should return correct data structure for none status', () => {
      const store = useKycButton();
      const expectedData = {
        ...KycTextStatuses[InvestKycTypes.none],
        to: {
          name: ROUTE_SUBMIT_KYC,
          params: { profileId: 123 },
        },
        contactUsUrl: urlContactUs,
      };

      expect(store.data).toEqual(expectedData);
    });

    it('should return correct data structure for approved status', () => {
      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.approved };

      const store = useKycButton();
      const expectedData = {
        ...KycTextStatuses[InvestKycTypes.approved],
        to: {
          name: ROUTE_SUBMIT_KYC,
          params: { profileId: 123 },
        },
        contactUsUrl: urlContactUs,
      };

      expect(store.data).toEqual(expectedData);
    });

    it('should return correct data structure for declined status', () => {
      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.declined };

      const store = useKycButton();
      const expectedData = {
        ...KycTextStatuses[InvestKycTypes.declined],
        to: {
          name: ROUTE_SUBMIT_KYC,
          params: { profileId: 123 },
        },
        contactUsUrl: urlContactUs,
      };

      expect(store.data).toEqual(expectedData);
    });
  });

  describe('tagBackground computed', () => {
    it('should return secondary for success class', () => {
      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.approved };

      const store = useKycButton();
      expect(store.tagBackground).toBe('secondary');
    });

    it('should return red for declined', () => {
      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.declined };

      const store = useKycButton();
      expect(store.tagBackground).toBe('red');
    });

    it('should return yellow for pending', () => {
      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.pending };

      const store = useKycButton();
      expect(store.tagBackground).toBe('yellow');
    });
  });

  describe('loading states', () => {
    it('should set isLoading to true when profile is loading and no data', () => {
      mockProfilesStore.selectedUserProfileData.value = null;
      mockProfilesStore.isSelectedProfileLoading.value = true;

      const store = useKycButton();
      expect(store.isLoading).toBe(true);
    });

    it('should set isLoading to false when profile data exists', () => {
      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.approved };
      mockProfilesStore.isSelectedProfileLoading.value = false;

      const store = useKycButton();
      expect(store.isLoading).toBe(false);
    });

    it('should set isLoading to false when profile is not loading and no data', () => {
      mockProfilesStore.selectedUserProfileData.value = null;
      mockProfilesStore.isSelectedProfileLoading.value = false;

      const store = useKycButton();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('button states', () => {
    it('should set button loading state based on plaid loading', () => {
      mockKycRepository.isPlaidLoading.value = true;

      const store = useKycButton();
      expect(store.isButtonLoading).toBe(true);
      expect(store.isButtonDisabled).toBe(true);
    });

    it('should set button states to false when plaid is not loading', () => {
      mockKycRepository.isPlaidLoading.value = false;

      const store = useKycButton();
      expect(store.isButtonLoading).toBe(false);
      expect(store.isButtonDisabled).toBe(false);
    });
  });

  describe('showContactUs computed', () => {
    it('should return true when kyc status is declined', () => {
      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.declined };

      const store = useKycButton();
      expect(store.showContactUs).toBe(true);
    });

    it('should return false when kyc status is not declined', () => {
      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.approved };

      const store = useKycButton();
      expect(store.showContactUs).toBe(false);
    });
  });

  describe('onClick method', () => {
    it('should not execute when user is not logged in', async () => {
      mockSessionStore.userLoggedIn.value = false;

      const store = useKycButton();
      await store.onClick();
      expect(mockKycRepository.handlePlaidKyc).not.toHaveBeenCalled();
    });

    it('should not execute when no profile ID exists', async () => {
      mockProfilesStore.selectedUserProfileId.value = null;

      const store = useKycButton();
      await store.onClick();
      expect(mockKycRepository.handlePlaidKyc).not.toHaveBeenCalled();
    });

    it('should call handlePlaidKyc when user is logged in and profile exists', async () => {
      const store = useKycButton();
      await store.onClick();
      expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalled();
    });
  });

  describe('reactive updates', () => {
    it('should update data when profile data changes', async () => {
      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.none };

      const store = useKycButton();
      expect(store.data.class).toBe(KycTextStatuses[InvestKycTypes.none].class);

      mockProfilesStore.selectedUserProfileData.value = { kyc_status: InvestKycTypes.approved };
      await nextTick();

      expect(store.data.class).toBe(KycTextStatuses[InvestKycTypes.approved].class);
    });
  });

  describe('kycProfileId logic', () => {
    it('should use selectedUserIndividualProfile.id when type is SDIRA and id is present', () => {
      mockProfilesStore.selectedUserProfileType.value = PROFILE_TYPES.SDIRA;
      mockProfilesStore.selectedUserIndividualProfile.value = { id: 999 } as any;
      const store = useKycButton();
      expect(store.data.to.params.profileId).toBe(123);
      mockProfilesStore.selectedUserProfileShowKycInitForm.value = false;
      store.onClick();
      expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalledWith(999);
    });
    it('should fallback to selectedUserProfileId when type is SDIRA and individual profile is null', async () => {
      mockProfilesStore.selectedUserProfileType.value = PROFILE_TYPES.SDIRA;
      mockProfilesStore.selectedUserIndividualProfile.value = null;
      const store = useKycButton();
      mockProfilesStore.selectedUserProfileShowKycInitForm.value = false;
      await store.onClick();
      expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalledWith(123);
    });
    it('should use selectedUserProfileId when type is not SDIRA/SOLO401K', async () => {
      mockProfilesStore.selectedUserProfileType.value = 'individual';
      mockProfilesStore.selectedUserIndividualProfile.value = { id: 999 } as any;
      const store = useKycButton();
      mockProfilesStore.selectedUserProfileShowKycInitForm.value = false;
      await store.onClick();
      expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalledWith(123);
    });
  });

  describe('handleKycClick logic', () => {
    it('should navigate to KYC page when selectedUserProfileShowKycInitForm is true', async () => {
      mockProfilesStore.selectedUserProfileShowKycInitForm.value = true;
      mockProfilesStore.selectedUserProfileType.value = PROFILE_TYPES.SDIRA;
      mockProfilesStore.selectedUserIndividualProfile.value = { id: 555 } as any;
      const store = useKycButton();
      const hrefSpy = vi.spyOn(window.location, 'href', 'set');
      
      await store.onClick();
      
      const expectedBaseUrl = urlProfileKYC(555);
      expect(hrefSpy).toHaveBeenCalledWith(expect.stringContaining(expectedBaseUrl));
      expect(hrefSpy.mock.calls[0][0]).toContain('redirect=');
      expect(mockKycRepository.handlePlaidKyc).not.toHaveBeenCalled();
    });
    it('should call handlePlaidKyc when selectedUserProfileShowKycInitForm is false', async () => {
      mockProfilesStore.selectedUserProfileShowKycInitForm.value = false;
      mockProfilesStore.selectedUserProfileType.value = PROFILE_TYPES.SDIRA;
      mockProfilesStore.selectedUserIndividualProfile.value = { id: 777 } as any;
      const store = useKycButton();
      const originalHref = window.location.href;
      await store.onClick();
      expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalledWith(777);
      expect(window.location.href).toBe(originalHref);
    });
  });
});
