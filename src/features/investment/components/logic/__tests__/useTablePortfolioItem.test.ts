import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { ref, nextTick, type Ref } from 'vue';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';
import { useTablePortfolioItem } from '../useTablePortfolioItem';

interface UseTablePortfolioItemProps {
  item: Ref<IInvestmentFormatted> | IInvestmentFormatted;
  activeId?: Ref<number> | number;
}

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => {
  const mockSelectedUserProfileData = ref({
    data: {
      first_name: 'John',
      last_name: 'Doe',
    },
  });

  const mockProfilesStore = {
    selectedUserProfileData: mockSelectedUserProfileData,
  };

  return {
    useProfilesStore: () => mockProfilesStore,
  };
});

vi.mock('pinia', () => ({
  storeToRefs: (store: any) => ({
    selectedUserProfileData: store.selectedUserProfileData,
  }),
}));

vi.mock('UiKit/composables/useSyncWithUrl', () => {
  const mockUseSyncWithUrl = vi.fn(() => ref(0));
  return {
    useSyncWithUrl: mockUseSyncWithUrl,
  };
});

const mockScrollIntoView = vi.fn();
const mockGetElementById = vi.fn(() => ({
  scrollIntoView: mockScrollIntoView,
}));

Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true,
});

vi.useFakeTimers();

describe('useTablePortfolioItem', () => {
  let props: UseTablePortfolioItemProps;
  let composable: ReturnType<typeof useTablePortfolioItem>;

  const mockInvestment: IInvestmentFormatted = {
    id: 123,
    closed_at: new Date(),
    offer: {} as any,
    profile_id: 1,
    user_id: 1,
    price_per_share: 10,
    number_of_shares: 100,
    amount: 1000,
    step: 'funding' as any,
    status: 'confirmed' as any,
    created_at: new Date(),
    submited_at: new Date(),
    funding_type: 'wire' as any,
    funding_status: 'received' as any,
    signature_data: {} as any,
    escrow_data: {} as any,
    payment_data: {} as any,
    payment_type: 'wire',
    escrow_type: 'standard',
    entity_id: 'entity-123',
    transaction_ref: 'tx-123',
    amountFormatted: '$1,000',
    amountFormattedZero: '$0',
    amountWithSign: '+$1,000',
    numberOfSharesFormatted: '100',
    pricePerShareFormatted: '$10',
    createdAtFormatted: '2024-01-15',
    createdAtTime: '10:30 AM',
    submitedAtFormatted: '2024-01-15',
    submitedAtTime: '10:30 AM',
    paymentDataCreatedAtFormatted: '2024-01-15',
    paymentDataCreatedAtTime: '10:30 AM',
    paymentDataUpdatedAtFormatted: '2024-01-15',
    paymentDataUpdatedAtTime: '10:30 AM',
    fundingStatusFormatted: 'Received',
    isFundingTypeWire: true,
    statusFormatted: {
      text: 'Confirmed',
      tooltip: 'Investment confirmed',
      color: 'green',
    },
    isActive: true,
    isCompleted: true,
    isCancelled: false,
    isPending: false,
    isFundingClickable: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    props = {
      item: mockInvestment,
      activeId: 123,
    };

    composable = useTablePortfolioItem(props);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('isActiveId', () => {
    it('should return true when item id matches active id', () => {
      expect(composable.isActiveId.value).toBe(true);
    });

    it('should return false when item id does not match active id', () => {
      props.activeId = 999;
      composable = useTablePortfolioItem(props);

      expect(composable.isActiveId.value).toBe(false);
    });

    it('should handle undefined active id', () => {
      props.activeId = undefined;
      composable = useTablePortfolioItem(props);

      expect(composable.isActiveId.value).toBe(false);
    });
  });

  describe('useSyncWithUrl Integration', () => {
    it('should have isOpenId property', () => {
      expect(composable.isOpenId).toBeDefined();
      expect(typeof composable.isOpenId.value).toBe('number');
    });

    it('should initialize isOpenId correctly', () => {
      expect(composable.isOpenId.value).toBe(0);
    });
  });

  describe('Scroll Behavior', () => {
    it('should have correct scrollTarget computed property', () => {
      const testProps = {
        item: mockInvestment,
        activeId: 123,
      };
      const testComposable = useTablePortfolioItem(testProps);

      expect(testComposable.scrollTarget.value).toBe('scrollTarget123');
    });

    it('should have correct isActiveId computed property', () => {
      const testProps = {
        item: mockInvestment,
        activeId: 123,
      };
      const testComposable = useTablePortfolioItem(testProps);

      expect(testComposable.isActiveId.value).toBe(true);
    });

    it('should not be active when activeId does not match', () => {
      const testProps = {
        item: mockInvestment,
        activeId: 999,
      };
      const testComposable = useTablePortfolioItem(testProps);

      expect(testComposable.isActiveId.value).toBe(false);
    });

    it('should not be active when activeId is undefined', () => {
      const testProps = {
        item: mockInvestment,
        activeId: undefined,
      };
      const testComposable = useTablePortfolioItem(testProps);

      expect(testComposable.isActiveId.value).toBe(false);
    });
  });
});
