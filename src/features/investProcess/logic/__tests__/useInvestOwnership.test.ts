import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import { useInvestOwnership } from '../useInvestOwnership';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { ROUTE_INVEST_SIGNATURE } from 'InvestCommon/helpers/enums/routes';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({
    params: { slug: 'test-slug', id: 'test-id', profileId: 'test-profile-id' }
  })
}));

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: vi.fn()
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn()
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: vi.fn()
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn()
}));

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    useTemplateRef: vi.fn((name: string) => ({
      value: { 
        isValid: true, 
        model: { name: `Test ${name}` },
        onValidate: vi.fn()
      }
    }))
  };
});

describe('useInvestOwnership', () => {
  let pinia: any;
  let mockGlobalLoader: any;
  let mockProfilesRepository: any;
  let mockInvestmentRepository: any;
  let mockProfilesStore: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();

    mockGlobalLoader = { hide: vi.fn() };
    (useGlobalLoader as any).mockReturnValue(mockGlobalLoader);

    mockProfilesRepository = {
      setProfileById: vi.fn(),
      getProfileById: vi.fn(),
      setProfileState: ref({ error: null }),
      getProfileByIdOptionsState: ref({ data: {} }),
      setProfileByIdState: ref({ error: null })
    };
    (useRepositoryProfiles as any).mockReturnValue(mockProfilesRepository);

    mockInvestmentRepository = {
      setOwnership: vi.fn(),
      setOwnershipState: ref({ error: null, data: null })
    };
    (useRepositoryInvestment as any).mockReturnValue(mockInvestmentRepository);

    mockProfilesStore = {
      selectedUserProfileData: ref({ 
        kyc_status: InvestKycTypes.approved,
        data: { name: 'Test User' }
      }),
      selectedUserProfileType: ref(PROFILE_TYPES.INDIVIDUAL),
      selectedUserProfileId: ref('test-profile-id')
    };
    (useProfilesStore as any).mockReturnValue(mockProfilesStore);
  });

  describe('computed properties', () => {
    it('should show alert when KYC status is not approved', () => {
      mockProfilesStore.selectedUserProfileData.value.kyc_status = InvestKycTypes.pending;
      
      const { isAlertShow } = useInvestOwnership();
      expect(isAlertShow.value).toBe(true);
    });

    it('should not show alert when KYC status is approved', () => {
      const { isAlertShow } = useInvestOwnership();
      expect(isAlertShow.value).toBe(false);
    });

    it('should return correct route parameters', () => {
      const { slug, id, profileId } = useInvestOwnership();
      expect(slug).toBe('test-slug');
      expect(id).toBe('test-id');
      expect(profileId).toBe('test-profile-id');
    });
  });

  describe('continueHandler', () => {
    it('should handle successful profile update and ownership setting', async () => {
      mockProfilesRepository.setProfileById.mockResolvedValue(undefined);
      mockInvestmentRepository.setOwnership.mockResolvedValue(undefined);
      mockInvestmentRepository.setOwnershipState.value.data = { success: true };

      const { continueHandler } = useInvestOwnership();
      
      await continueHandler();
      
      expect(mockProfilesRepository.setProfileById).toHaveBeenCalled();
      expect(mockInvestmentRepository.setOwnership).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith({ name: ROUTE_INVEST_SIGNATURE });
    });

    it('should handle profile update error', async () => {
      mockProfilesRepository.setProfileByIdState.value.error = { message: 'Update failed' };

      const { continueHandler } = useInvestOwnership();
      
      await continueHandler();
      
      expect(mockInvestmentRepository.setOwnership).not.toHaveBeenCalled();
    });
  });
}); 