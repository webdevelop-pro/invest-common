import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useEarnDepositCard } from '../useEarnDepositCard';

// Mock useFormValidation
const mockModel = ref({ amount: null as number | null });
const mockValidation = ref({});
const mockIsValid = ref(true);
const mockOnValidate = vi.fn();
const mockScrollToError = vi.fn();
const mockFormErrors = {
  clearErrors: vi.fn(),
};
const mockIsFieldRequired = vi.fn();
const mockGetErrorText = vi.fn();
const mockGetOptions = vi.fn();
const mockGetReferenceType = vi.fn();
const mockResetValidation = vi.fn();

vi.mock('UiKit/helpers/validation/useFormValidation', () => ({
  useFormValidation: vi.fn(() => ({
    model: mockModel,
    validation: mockValidation,
    isValid: mockIsValid,
    onValidate: mockOnValidate,
    scrollToError: mockScrollToError,
    formErrors: mockFormErrors,
    isFieldRequired: mockIsFieldRequired,
    getErrorText: mockGetErrorText,
    getOptions: mockGetOptions,
    getReferenceType: mockGetReferenceType,
    resetValidation: mockResetValidation,
  })),
}));

// Mock toast
const mockToast = vi.fn();

vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock vue-router
const mockRouterPush = vi.fn().mockResolvedValue(undefined);

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useRoute: () => ({
    query: {},
  }),
}));

// Mock earn repository
const mockDepositState = ref({
  loading: false,
  error: null,
  data: undefined,
});

const mockDeposit = vi.fn().mockResolvedValue({
  poolId: 'pool-123',
  profileId: 1,
  amount: 1000,
  status: 'success',
  txId: 'tx-123',
});

const mockGetPositions = vi.fn().mockResolvedValue(undefined);

vi.mock('InvestCommon/data/earn/earn.repository', () => ({
  useRepositoryEarn: vi.fn(() => ({
    deposit: mockDeposit,
    getPositions: mockGetPositions,
    depositState: mockDepositState,
    mockApprovalTransaction: vi.fn(),
  })),
}));

describe('useEarnDepositCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // Reset mocks
    mockModel.value = { amount: null };
    mockIsValid.value = true;
    mockValidation.value = {};
    mockDepositState.value = {
      loading: false,
      error: null,
      data: undefined,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const composable = useEarnDepositCard();
      
      expect(composable.model).toBeDefined();
      expect(composable.isSubmitting.value).toBe(false);
      expect(composable.isValid.value).toBe(true);
    });

    it('should accept options with refs', () => {
      const maxAmount = ref(5000);
      const composable = useEarnDepositCard({ maxAmount });
      
      expect(composable.model).toBeDefined();
    });
  });

  describe('Schema', () => {
    it('should create schema with maxAmount from options', () => {
      const maxAmount = ref(5000);
      const composable = useEarnDepositCard({ maxAmount });
      
      // Schema is computed internally, but we can verify it's created
      expect(composable.model).toBeDefined();
    });

    it('should handle undefined maxAmount', () => {
      const composable = useEarnDepositCard();
      
      expect(composable.model).toBeDefined();
    });
  });

  describe('submitHandler', () => {
    it('should validate form before submitting', async () => {
      const composable = useEarnDepositCard({
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
      });
      
      mockIsValid.value = false;
      composable.model.amount = 1000;
      
      await composable.submitHandler();
      
      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockDeposit).not.toHaveBeenCalled();
    });

    it('should scroll to error when validation fails and scrollId is provided', async () => {
      const scrollId = ref('error-scroll-id');
      const composable = useEarnDepositCard({
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
        scrollId,
      });
      
      mockIsValid.value = false;
      composable.model.amount = 1000;
      
      await composable.submitHandler();
      await nextTick();
      
      expect(mockScrollToError).toHaveBeenCalledWith('error-scroll-id');
    });

    it('should call deposit when form is valid and poolId/profileId are provided', async () => {
      const composable = useEarnDepositCard({
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
      });
      
      mockIsValid.value = true;
      composable.model.amount = 1000;
      
      await composable.submitHandler();
      
      expect(mockDeposit).toHaveBeenCalledWith({
        poolId: 'pool-123',
        profileId: 1,
        amount: 1000,
        symbol: 'USDC',
      });
    });

    it('should call getPositions after successful deposit', async () => {
      const composable = useEarnDepositCard({
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
      });
      
      mockIsValid.value = true;
      composable.model.amount = 1000;
      
      await composable.submitHandler();
      
      expect(mockGetPositions).toHaveBeenCalledWith('pool-123', 1);
    });

    it('should call custom onSubmit handler when provided', async () => {
      const customSubmit = vi.fn().mockResolvedValue(undefined);
      const composable = useEarnDepositCard({
        onSubmit: customSubmit,
      });
      
      mockIsValid.value = true;
      composable.model.amount = 1000;
      
      await composable.submitHandler();
      
      expect(customSubmit).toHaveBeenCalledWith(1000);
      expect(mockDeposit).not.toHaveBeenCalled();
    });

    it('should reset amount after successful submission', async () => {
      const composable = useEarnDepositCard({
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
      });
      
      mockIsValid.value = true;
      composable.model.amount = 1000;
      
      await composable.submitHandler();
      
      expect(composable.model.amount).toBeNull();
    });

    it('should set isSubmitting during submission', async () => {
      const composable = useEarnDepositCard({
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
      });
      
      mockIsValid.value = true;
      composable.model.amount = 1000;
      
      const submitPromise = composable.submitHandler();
      await nextTick();
      
      expect(composable.isSubmitting.value).toBe(true);
      
      await submitPromise;
      
      expect(composable.isSubmitting.value).toBe(false);
    });

    it('should not submit when amount is invalid', async () => {
      const composable = useEarnDepositCard({
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
      });
      
      mockIsValid.value = true;
      composable.model.amount = null;
      
      await composable.submitHandler();
      
      expect(mockDeposit).not.toHaveBeenCalled();
    });

    it('should not submit when amount is NaN', async () => {
      const composable = useEarnDepositCard({
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
      });
      
      mockIsValid.value = true;
      composable.model.amount = NaN as any;
      
      await composable.submitHandler();
      
      expect(mockDeposit).not.toHaveBeenCalled();
    });

    it('should not submit when amount is <= 0', async () => {
      const composable = useEarnDepositCard({
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
      });
      
      mockIsValid.value = true;
      composable.model.amount = 0;
      
      await composable.submitHandler();
      
      expect(mockDeposit).not.toHaveBeenCalled();
    });

    it('should handle errors during submission', async () => {
      const error = new Error('Deposit failed');
      mockDeposit.mockRejectedValueOnce(error);
      
      const composable = useEarnDepositCard({
        poolId: 'pool-123',
        profileId: 1,
        symbol: 'USDC',
      });
      
      mockIsValid.value = true;
      composable.model.amount = 1000;
      
      await expect(composable.submitHandler()).rejects.toThrow('Deposit failed');
      expect(composable.isSubmitting.value).toBe(false);
    });
  });

  describe('onMax', () => {
    it('should set amount to maxAmount when provided', () => {
      const maxAmount = ref(5000);
      const composable = useEarnDepositCard({ maxAmount });
      
      composable.onMax();
      
      expect(composable.model.amount).toBe(5000);
    });

    it('should set amount to default 1000 when maxAmount is undefined', () => {
      const composable = useEarnDepositCard();
      
      composable.onMax();
      
      expect(composable.model.amount).toBe(1000);
    });

    it('should set amount to default 1000 when maxAmount is null', () => {
      const maxAmount = ref(null);
      const composable = useEarnDepositCard({ maxAmount });
      
      composable.onMax();
      
      expect(composable.model.amount).toBe(1000);
    });
  });

  describe('resetFormValidation', () => {
    it('should reset validation and clear errors', () => {
      const composable = useEarnDepositCard();
      
      composable.resetFormValidation();
      
      expect(mockResetValidation).toHaveBeenCalled();
      expect(mockFormErrors.clearErrors).toHaveBeenCalled();
    });
  });

  describe('errorData', () => {
    it('should return error data from depositState', () => {
      const errorResponse = {
        data: {
          responseJson: {
            amount: ['Invalid amount'],
          },
        },
      };
      
      mockDepositState.value.error = errorResponse as any;
      
      const composable = useEarnDepositCard();
      
      expect(composable.errorData.value).toEqual({
        amount: ['Invalid amount'],
      });
    });

    it('should return empty object when no error', () => {
      mockDepositState.value.error = null;
      
      const composable = useEarnDepositCard();
      
      expect(composable.errorData.value).toEqual({});
    });
  });

  describe('depositState', () => {
    it('should expose depositState from repository', () => {
      const composable = useEarnDepositCard();
      
      // depositState is returned from storeToRefs, so it should be a ref
      expect(composable.depositState).toBeDefined();
      expect(composable.depositState.value).toBe(mockDepositState.value);
    });
  });
});

