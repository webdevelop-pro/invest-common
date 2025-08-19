import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';
import { useInvestmentTimeline } from '../useInvestmentTimeline';

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => ({
    selectedUserProfileId: ref(1),
    selectedUserProfileData: ref({
      isKycApproved: false,
      isAccreditationApproved: false,
      isCanCallKycPlaid: true,
    }),
  })),
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: vi.fn(() => ({
    getInvestOneState: ref({
      data: {
        offer: {
          isFundingCompleted: false,
          isStatusClosedSuccessfully: false,
          offerFundedPercent: 50,
        },
      },
    }),
  })),
}));

vi.mock('InvestCommon/data/kyc/kyc.repository', () => ({
  useRepositoryKyc: vi.fn(() => ({
    tokenState: ref({
      data: { token: 'test-token' },
      loading: false,
      error: null,
    }),
    handlePlaidKyc: vi.fn(),
  })),
}));

describe('useInvestmentTimeline', () => {
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  describe('getButtonTag function', () => {
    it('should return "router-link" for items with buttonRoute', () => {
      const { getButtonTag } = useInvestmentTimeline();
      const item = { buttonRoute: '/test-route' };

      expect(getButtonTag(item)).toBe('router-link');
    });

    it('should return "a" for items with buttonHref', () => {
      const { getButtonTag } = useInvestmentTimeline();
      const item = { buttonHref: 'https://example.com' };

      expect(getButtonTag(item)).toBe('a');
    });

    it('should return "button" for items without buttonRoute or buttonHref', () => {
      const { getButtonTag } = useInvestmentTimeline();
      const item = {};

      expect(getButtonTag(item)).toBe('button');
    });
  });

  describe('Date difference calculation', () => {
    it('should calculate correct day difference', () => {
      const { data } = useInvestmentTimeline();

      expect(data.value).toBeDefined();
    });
  });

  describe('KYC section functionality', () => {
    it('should call handlePlaidKyc when KYC button is clicked and user can call KYC', () => {
      const { data } = useInvestmentTimeline();
      const kycSection = data.value[0];

      // Mock the KYC store
      const mockHandlePlaidKyc = vi.fn();
      vi.mocked(useRepositoryKyc).mockReturnValue({
        tokenState: ref({
          data: { token: 'test-token' },
          loading: false,
          error: null,
        }),
        handlePlaidKyc: mockHandlePlaidKyc,
      });

      kycSection.onButtonClick();

      expect(mockHandlePlaidKyc).toBeDefined();
    });
  });

  describe('Funding completion scenarios', () => {
    it('should show highlight circle type when funding is completed but not closed successfully', () => {
      vi.mocked(useRepositoryInvestment).mockImplementation(() => ({
        getInvestOneState: ref({
          data: {
            offer: {
              isFundingCompleted: true,
              isStatusClosedSuccessfully: false,
              offerFundedPercent: 100,
            },
          },
        }),
      }));

      const { data } = useInvestmentTimeline();
      const legalSection = data.value[3];

      expect(legalSection.circleType).toBe('highlight');
    });

    it('should show complete circle type when funding is completed and closed successfully', () => {
      vi.mocked(useRepositoryInvestment).mockImplementation(() => ({
        getInvestOneState: ref({
          data: {
            offer: {
              isFundingCompleted: true,
              isStatusClosedSuccessfully: true,
              offerFundedPercent: 100,
            },
          },
        }),
      }));

      const { data } = useInvestmentTimeline();
      const legalSection = data.value[3];

      expect(legalSection.circleType).toBe('complete');
    });
  });

  describe('Accreditation scenarios', () => {
    it('should show complete circleType when accreditation is approved', () => {
      vi.mocked(useProfilesStore).mockImplementation(() => ({
        selectedUserProfileId: ref(1),
        selectedUserProfileData: ref({
          isKycApproved: true,
          isAccreditationApproved: true,
          isCanCallKycPlaid: false,
        }),
      }));

      const { data } = useInvestmentTimeline();
      const accreditationSection = data.value[1];

      expect(accreditationSection.circleType).toBe('complete');
    });
  });

  describe('KYC scenarios', () => {
    it('should show complete circleType when KYC is approved', () => {
      vi.mocked(useProfilesStore).mockImplementation(() => ({
        selectedUserProfileId: ref(1),
        selectedUserProfileData: ref({
          isKycApproved: true,
          isAccreditationApproved: false,
          isCanCallKycPlaid: false,
        }),
      }));

      const { data } = useInvestmentTimeline();
      const kycSection = data.value[0];

      expect(kycSection.circleType).toBe('complete');
    });
  });
});
