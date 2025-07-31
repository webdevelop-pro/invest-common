import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { ref } from 'vue';
import { ROUTE_DASHBOARD_PORTFOLIO } from 'InvestCommon/helpers/enums/routes';
import { useInvestmentTopInfo, type UseInvestmentTopInfoProps } from '../useInvestmentTopInfo';

const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}));

const mockGetInvestOneState = ref({
  data: {
    id: 123,
    createdAtFormatted: '2024-01-15',
    fundingTypeFormatted: 'Wire Transfer',
    isFundingClickable: true,
    isFundingTypeWire: true,
    offer: {
      securityTypeFormatted: 'Equity',
      valuationFormatted: '$5,000,000',
      closeAtFormatted: '2024-12-31',
    },
  } as any,
  loading: false,
  error: null,
});

const mockInvestmentRepository = {
  getInvestOneState: mockGetInvestOneState,
};

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: () => mockInvestmentRepository,
}));

vi.mock('pinia', () => ({
  storeToRefs: (store: any) => ({
    getInvestOneState: store.getInvestOneState,
  }),
}));

describe('useInvestmentTopInfo', () => {
  let props: UseInvestmentTopInfoProps;
  let composable: ReturnType<typeof useInvestmentTopInfo>;

  beforeEach(() => {
    vi.clearAllMocks();

    props = {
      investmentId: '123',
      profileData: {
        id: '456',
        type: 'individual',
        data: {
          first_name: 'John',
          last_name: 'Doe',
        },
      },
    };

    composable = useInvestmentTopInfo(props);
  });

  describe('Computed Properties', () => {
    describe('infoData', () => {
      it('should format info data correctly', () => {
        const expectedInfoData = [
          {
            text: 'Created Date:',
            value: '2024-01-15',
          },
          {
            text: 'Funding Type:',
            value: 'Wire Transfer',
            funding: true,
          },
          {
            text: 'Security Type:',
            value: 'Equity',
          },
          {
            text: 'Ownership:',
            value: 'Individual',
          },
          {
            text: 'Valuation:',
            value: '$5,000,000',
          },
          {
            text: 'Closed Date:',
            value: '2024-12-31',
          },
        ];

        expect(composable.infoData.value).toEqual(expectedInfoData);
      });

      it('should capitalize profile type correctly', () => {
        const composableWithCompany = useInvestmentTopInfo({
          investmentId: '123',
          profileData: {
            id: '456',
            type: 'individual',
            data: {
              first_name: 'John',
              last_name: 'Doe',
            },
          },
        });

        expect(composableWithCompany.infoData.value[3].value).toBe('Individual');
      });
    });
  });

  describe('Actions', () => {
    it('should navigate to portfolio with correct parameters', () => {
      composable.onBackClick();

      expect(mockPush).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_PORTFOLIO,
        params: { profileId: '456' },
        query: { id: '123' },
      });
    });

    it('should open cancel dialog onCancelInvestmentClick', () => {
      expect(composable.isDialogCancelOpen.value).toBe(false);

      composable.onCancelInvestmentClick();

      expect(composable.isDialogCancelOpen.value).toBe(true);
    });

    describe('onFundingType', () => {
      it('should open wire dialog when funding type is wire', () => {
        mockGetInvestOneState.value.data = {
          ...mockGetInvestOneState.value.data,
          isFundingClickable: true,
          isFundingTypeWire: true,
        };

        expect(composable.isDialogWireOpen.value).toBe(false);

        composable.onFundingType();

        expect(composable.isDialogWireOpen.value).toBe(true);
        expect(composable.isDialogTransactionOpen.value).toBe(false);
      });

      it('should open transaction dialog when funding type is not wire', () => {
        mockGetInvestOneState.value.data = {
          ...mockGetInvestOneState.value.data,
          isFundingClickable: true,
          isFundingTypeWire: false,
        };

        expect(composable.isDialogTransactionOpen.value).toBe(false);

        composable.onFundingType();

        expect(composable.isDialogTransactionOpen.value).toBe(true);
        expect(composable.isDialogWireOpen.value).toBe(false);
      });

      it('should not open any dialog when funding is not clickable', () => {
        mockGetInvestOneState.value.data = {
          ...mockGetInvestOneState.value.data,
          isFundingClickable: false,
        };

        composable.onFundingType();

        expect(composable.isDialogWireOpen.value).toBe(false);
        expect(composable.isDialogTransactionOpen.value).toBe(false);
      });

      it('should not open any dialog when investment data is missing', () => {
        mockGetInvestOneState.value.data = null as any;

        composable.onFundingType();

        expect(composable.isDialogWireOpen.value).toBe(false);
        expect(composable.isDialogTransactionOpen.value).toBe(false);
      });
    });

    describe('onContactUsClick', () => {
      it('should open contact us dialog', () => {
        expect(composable.isDialogContactUsOpen.value).toBe(false);

        composable.onContactUsClick();

        expect(composable.isDialogContactUsOpen.value).toBe(true);
      });
    });
  });
});
