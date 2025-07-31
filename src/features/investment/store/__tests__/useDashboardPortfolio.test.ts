import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick, ref } from 'vue';
import { useDashboardPortfolioStore } from '../useDashboardPortfolio';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { IInvestmentFormatted, InvestmentStatuses, InvestStepTypes, InvestFundingStatuses } from 'InvestCommon/data/investment/investment.types';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';

vi.mock('InvestCommon/data/investment/investment.repository');
vi.mock('InvestCommon/domain/profiles/store/useProfiles');
vi.mock('UiKit/composables/useReactiveQuery', () => ({
  useReactiveQuery: vi.fn(() => new Map([['id', '1']])),
}));

const mockUseRepositoryInvestment = vi.mocked(useRepositoryInvestment);
const mockUseProfilesStore = vi.mocked(useProfilesStore);

const mockInvestmentData: IInvestmentFormatted[] = [
  {
    id: 1,
    offer: {
      id: 1,
      name: 'Test Offer 1',
      description: 'Test Description 1',
    } as any,
    funding_type: FundingTypes.wire,
    status: InvestmentStatuses.confirmed,
    amount: 1000,
    number_of_shares: 10,
    price_per_share: 100,
    profile_id: 1,
    user_id: 1,
    step: InvestStepTypes.amount,
    created_at: new Date(),
    submited_at: new Date(),
    funding_status: InvestFundingStatuses.received,
    signature_data: {} as any,
    escrow_data: {} as any,
    payment_data: {} as any,
    payment_type: 'wire',
    escrow_type: 'escrow',
    entity_id: 'entity1',
    transaction_ref: 'ref1',
    closed_at: new Date(),
    amountFormatted: '$1,000.00',
    amountFormattedZero: '$1,000.00',
    amountWithSign: '+$1,000.00',
    numberOfSharesFormatted: '10',
    pricePerShareFormatted: '$100.00',
    createdAtFormatted: '2024-01-01',
    createdAtTime: '12:00 PM',
    submitedAtFormatted: '2024-01-01',
    submitedAtTime: '12:00 PM',
    paymentDataCreatedAtFormatted: '2024-01-01',
    paymentDataCreatedAtTime: '12:00 PM',
    paymentDataUpdatedAtFormatted: '2024-01-01',
    paymentDataUpdatedAtTime: '12:00 PM',
    fundingStatusFormatted: 'Received',
    fundingTypeFormatted: 'Wire',
    isFundingTypeWire: true,
    statusFormatted: {
      text: 'Confirmed',
      color: 'green',
    },
    isActive: true,
    isCompleted: false,
    isCancelled: false,
    isPending: false,
    isFundingClickable: true,
  },
  {
    id: 2,
    offer: {
      id: 2,
      name: 'Test Offer 2',
      description: 'Test Description 2',
    } as any,
    funding_type: FundingTypes.wallet,
    status: InvestmentStatuses.legally_confirmed,
    amount: 2000,
    number_of_shares: 20,
    price_per_share: 100,
    profile_id: 1,
    user_id: 1,
    step: InvestStepTypes.amount,
    created_at: new Date(),
    submited_at: new Date(),
    funding_status: InvestFundingStatuses.settled,
    signature_data: {} as any,
    escrow_data: {} as any,
    payment_data: {} as any,
    payment_type: 'wallet',
    escrow_type: 'escrow',
    entity_id: 'entity2',
    transaction_ref: 'ref2',
    closed_at: new Date(),
    amountFormatted: '$2,000.00',
    amountFormattedZero: '$2,000.00',
    amountWithSign: '+$2,000.00',
    numberOfSharesFormatted: '20',
    pricePerShareFormatted: '$100.00',
    createdAtFormatted: '2024-01-01',
    createdAtTime: '12:00 PM',
    submitedAtFormatted: '2024-01-01',
    submitedAtTime: '12:00 PM',
    paymentDataCreatedAtFormatted: '2024-01-01',
    paymentDataCreatedAtTime: '12:00 PM',
    paymentDataUpdatedAtFormatted: '2024-01-01',
    paymentDataUpdatedAtTime: '12:00 PM',
    fundingStatusFormatted: 'Settled',
    fundingTypeFormatted: 'Wallet',
    isFundingTypeWire: false,
    statusFormatted: {
      text: 'Legally Confirmed',
      color: 'blue',
    },
    isActive: true,
    isCompleted: false,
    isCancelled: false,
    isPending: false,
    isFundingClickable: true,
  },
  {
    id: 3,
    offer: {
      id: 3,
      name: 'ACH Test Offer',
      description: 'ACH Test Description',
    } as any,
    funding_type: FundingTypes.ach,
    status: InvestmentStatuses.successfully_closed,
    amount: 3000,
    number_of_shares: 30,
    price_per_share: 100,
    profile_id: 1,
    user_id: 1,
    step: InvestStepTypes.amount,
    created_at: new Date(),
    submited_at: new Date(),
    funding_status: InvestFundingStatuses.settled,
    signature_data: {} as any,
    escrow_data: {} as any,
    payment_data: {} as any,
    payment_type: 'ach',
    escrow_type: 'escrow',
    entity_id: 'entity3',
    transaction_ref: 'ref3',
    closed_at: new Date(),
    amountFormatted: '$3,000.00',
    amountFormattedZero: '$3,000.00',
    amountWithSign: '+$3,000.00',
    numberOfSharesFormatted: '30',
    pricePerShareFormatted: '$100.00',
    createdAtFormatted: '2024-01-01',
    createdAtTime: '12:00 PM',
    submitedAtFormatted: '2024-01-01',
    submitedAtTime: '12:00 PM',
    paymentDataCreatedAtFormatted: '2024-01-01',
    paymentDataCreatedAtTime: '12:00 PM',
    paymentDataUpdatedAtFormatted: '2024-01-01',
    paymentDataUpdatedAtTime: '12:00 PM',
    fundingStatusFormatted: 'Settled',
    fundingTypeFormatted: 'ACH',
    isFundingTypeWire: false,
    statusFormatted: {
      text: 'Successfully Closed',
      color: 'green',
    },
    isActive: false,
    isCompleted: true,
    isCancelled: false,
    isPending: false,
    isFundingClickable: false,
  },
];

describe('useDashboardPortfolioStore', () => {
  let store: ReturnType<typeof useDashboardPortfolioStore>;
  let mockInvestmentRepository: any;
  let mockProfilesStore: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockInvestmentRepository = {
      getInvestments: vi.fn(),
      getInvestmentsState: ref({
        data: {
          data: mockInvestmentData,
        },
      }),
    };
    mockUseRepositoryInvestment.mockReturnValue(mockInvestmentRepository);

    const mockSelectedUserProfileId = ref(1);
    mockProfilesStore = {
      selectedUserProfileId: mockSelectedUserProfileId,
    };
    mockUseProfilesStore.mockReturnValue(mockProfilesStore);

    store = useDashboardPortfolioStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Getters', () => {
    describe('isFiltering', () => {
      it('should return false when no filters are applied', () => {
        expect(store.isFiltering).toBe(false);
      });

      it('should return true when search is applied', () => {
        store.setSearch('test');
        expect(store.isFiltering).toBe(true);
      });

      it('should return true when funding type filter is applied', () => {
        const updatedFilters = [...store.filterPortfolio];
        updatedFilters[0].model = ['Wire'];
        store.onApplyFilter(updatedFilters);
        expect(store.isFiltering).toBe(true);
      });

      it('should return true when status filter is applied', () => {
        const updatedFilters = [...store.filterPortfolio];
        updatedFilters[1].model = ['Confirmed'];
        store.onApplyFilter(updatedFilters);
        expect(store.isFiltering).toBe(true);
      });

      it('should return true when multiple filters are applied', () => {
        store.setSearch('test');
        const updatedFilters = [...store.filterPortfolio];
        updatedFilters[0].model = ['Wire'];
        store.onApplyFilter(updatedFilters);
        expect(store.isFiltering).toBe(true);
      });
    });

    describe('filteredData', () => {
      it('should return all data when no filters are applied', () => {
        expect(store.filteredData).toEqual(mockInvestmentData);
      });

      it('should filter by funding type', () => {
        const updatedFilters = [...store.filterPortfolio];
        updatedFilters[0].model = ['Wire'];
        store.onApplyFilter(updatedFilters);

        const filtered = store.filteredData;
        expect(filtered).toHaveLength(1);
        expect(filtered[0].funding_type).toBe(FundingTypes.wire);
      });

      it('should filter by multiple funding types', () => {
        const updatedFilters = [...store.filterPortfolio];
        updatedFilters[0].model = ['Wire', 'Wallet'];
        store.onApplyFilter(updatedFilters);

        const filtered = store.filteredData;
        expect(filtered).toHaveLength(2);
        expect(filtered.every(item => [FundingTypes.wire, FundingTypes.wallet].includes(item.funding_type))).toBe(true);
      });

      it('should filter by status', () => {
        const updatedFilters = [...store.filterPortfolio];
        updatedFilters[1].model = ['Confirmed'];
        store.onApplyFilter(updatedFilters);

        const filtered = store.filteredData;
        expect(filtered).toHaveLength(1);
        expect(filtered[0].status).toBe(InvestmentStatuses.confirmed);
      });

      it('should filter by multiple statuses', () => {
        const updatedFilters = [...store.filterPortfolio];
        updatedFilters[1].model = ['Confirmed', 'Legally Confirmed'];
        store.onApplyFilter(updatedFilters);

        const filtered = store.filteredData;
        expect(filtered).toHaveLength(2);
        expect(filtered.every(item => [InvestmentStatuses.confirmed, InvestmentStatuses.legally_confirmed].includes(item.status))).toBe(true);
      });

      it('should filter by search term (investment ID)', () => {
        store.setSearch('1');
        const filtered = store.filteredData;
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe(1);
      });

      it('should filter by search term (offer name)', () => {
        store.setSearch('Test Offer 1');
        const filtered = store.filteredData;
        expect(filtered).toHaveLength(1);
        expect(filtered[0].offer.name).toBe('Test Offer 1');
      });

      it('should filter by search term (case insensitive)', () => {
        store.setSearch('test offer');
        const filtered = store.filteredData;
        expect(filtered).toHaveLength(3);
      });

      it('should combine multiple filters', () => {
        store.setSearch('Test');
        const updatedFilters = [...store.filterPortfolio];
        updatedFilters[0].model = ['Wire'];
        store.onApplyFilter(updatedFilters);

        const filtered = store.filteredData;
        expect(filtered).toHaveLength(1);
        expect(filtered[0].funding_type).toBe(FundingTypes.wire);
        expect(filtered[0].offer.name).toContain('Test');
      });

      it('should handle empty search term', () => {
        store.setSearch('');
        expect(store.filteredData).toEqual(mockInvestmentData);
      });

      it('should handle undefined search value', () => {
        store.setSearch(undefined as any);
        expect(store.filteredData).toEqual(mockInvestmentData);
      });
    });
  });

  describe('Watchers', () => {
    it('should call getInvestments when selectedUserProfileId changes to valid value', async () => {
      vi.clearAllMocks();
      
      mockProfilesStore.selectedUserProfileId.value = 2;
      
      await nextTick();
      
      expect(mockInvestmentRepository.getInvestments).toHaveBeenCalledWith(2);
    });

    it('should not call getInvestments when selectedUserProfileId is 0', async () => {
      const mockProfilesStoreWithZero = {
        selectedUserProfileId: ref(0),
      } as any;
      mockUseProfilesStore.mockReturnValue(mockProfilesStoreWithZero);
      
      vi.clearAllMocks();
      store = useDashboardPortfolioStore();
      await nextTick();
      
      expect(mockInvestmentRepository.getInvestments).not.toHaveBeenCalled();
    });

    it('should not call getInvestments when selectedUserProfileId is negative', async () => {
      const mockProfilesStoreWithNegative = {
        selectedUserProfileId: ref(-1),
      } as any;
      mockUseProfilesStore.mockReturnValue(mockProfilesStoreWithNegative);
      
      vi.clearAllMocks();
      store = useDashboardPortfolioStore();
      await nextTick();
      
      expect(mockInvestmentRepository.getInvestments).not.toHaveBeenCalled();
    });

    it('should call getInvestments on initial load with valid profile ID', () => {
      expect(mockInvestmentRepository.getInvestments).toHaveBeenCalledWith(1);
    });
  });
}); 