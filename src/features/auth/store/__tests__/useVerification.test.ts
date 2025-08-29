import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { ref, reactive, watch } from 'vue';
// useToast will be mocked below; no direct import to avoid alias/type issues
import { useVerificationStore } from '../useVerification';

// Mock environment variables
vi.mock('InvestCommon/domain/config/env', () => ({
  default: {
    FRONTEND_URL_STATIC: 'http://localhost:3000',
  },
}));

// Mock all required dependencies
vi.mock('InvestCommon/data/auth/auth.repository', () => {
  const mockGetAuthFlow = vi.fn().mockResolvedValue(undefined);
  const mockSetRecovery = vi.fn().mockResolvedValue(undefined);

  return {
    useRepositoryAuth: vi.fn(() => ({
      flowId: { value: 'test-flow-id' },
      csrfToken: { value: 'test-csrf-token' },
      getAuthFlow: mockGetAuthFlow,
      setRecovery: mockSetRecovery,
      getSchemaState: ref({ data: undefined, loading: false, error: null }),
      setRecoveryState: ref({ data: null, error: null }),
      getAuthFlowState: ref({ error: null }),
    })),
  };
});

vi.mock('UiKit/helpers/validation/useFormValidation', () => ({
  useFormValidation: vi.fn(() => {
    const model = reactive({ code: '' });
    const isValid = ref(true);
    const validation = ref({});

    const onValidate = vi.fn().mockImplementation(() => {
      // Simple validation logic for testing
      const codeValid = /^\d{6}$/.test(model.code);

      isValid.value = codeValid;
      validation.value = {
        code: !codeValid ? ['Code must be 6 digits'] : [],
      };
    });

    // Watch for model changes
    watch(() => model, () => {
      if (!isValid.value) onValidate();
    }, { deep: true });

    return {
      model,
      validation,
      isValid,
      onValidate,
      scrollToError: vi.fn(),
      formErrors: ref({}),
      isFieldRequired: vi.fn(),
      getErrorText: vi.fn(),
      getOptions: vi.fn(),
      getReferenceType: vi.fn(),
      resetValidation: vi.fn(),
      schemaObject: ref({}),
    } as any;
  }),
}));

// Mock navigation
vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn().mockResolvedValue(undefined),
}));

// No need to mock general scroll here; not asserted in tests

// Mock the dependencies
vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
    TOAST_REMOVE_DELAY: 10000,
  })),
}));

describe('useVerification Store', () => {
  let store: ReturnType<typeof useVerificationStore>;
  let mockAuthRepository: ReturnType<typeof useRepositoryAuth>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Mock URL with query parameters
    Object.defineProperty(window, 'location', {
      value: { search: '?flowId=test-flow-id&email=test@example.com' },
      writable: true,
    });

    store = useVerificationStore();
    mockAuthRepository = useRepositoryAuth();
  });

  describe('Query Parameters', () => {
    it('should correctly parse query parameters', () => {
      expect(store.flowId).toBe('test-flow-id');
      expect(store.email).toBe('test@example.com');
    });

    it('should handle missing query parameters', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      });

      const newStore = useVerificationStore();
      expect(newStore.flowId).toBeUndefined();
      expect(newStore.email).toBeUndefined();
    });
  });

  describe('Form Validation', () => {
    it('should validate verification code field', async () => {
      // Test invalid code
      store.model.code = '12345'; // Less than 6 digits
      await store.onValidate();
      expect(store.isValid).toBe(false);
      expect(store.validation.code.length).toBeGreaterThan(0);

      // Test valid code
      store.model.code = '123456';
      await store.onValidate();
      expect(store.isValid).toBe(true);
      expect(store.validation.code.length).toBe(0);
    });

    it('should handle form validation with backend schema', async () => {
      // Mock backend schema
      const backendSchema = { id: 'schema-id', schema: '{}', url: 'http://example.com/schema' } as any;
      (useRepositoryAuth() as any).getSchemaState.value = { data: backendSchema } as any;

      // Test with invalid data
      store.model.code = '12345';
      await store.onValidate();
      expect(store.isValid).toBe(false);

      // Test with valid data
      store.model.code = '123456';
      await store.onValidate();
      expect(store.isValid).toBe(true);
    });
  });

  describe('Verification Handler', () => {
    it('should handle successful verification', async () => {
      // Set up the model with a valid verification code
      store.model.code = '123456';
      await store.onValidate(); // Ensure validation is run
      mockAuthRepository.setRecoveryState.value = { data: { id: 'id', type: 'browser', active: true, expires_at: '', issued_at: '', request_url: '', state: 'success', ui: { action: '', method: 'POST', nodes: [] }, messages: [] } as any, error: null } as any;

      await store.verificationHandler();
      expect(store.isLoading).toBe(false);
      expect(mockAuthRepository.setRecovery).toHaveBeenCalledWith(
        'test-flow-id',
        expect.objectContaining({
          code: '123456',
          method: 'code',
          csrf_token: 'test-csrf-token',
        }),
      );
    });

    it('should handle verification errors', async () => {
      store.model.code = '123456';
      await store.onValidate(); // Ensure validation is run
      mockAuthRepository.setRecoveryState.value = { data: null as any, error: new Error('Verification failed') } as any;

      await store.verificationHandler();
      expect(store.isLoading).toBe(false);
    });

    it('should not proceed with invalid form', async () => {
      store.model.code = '12345'; // Invalid code
      await store.onValidate(); // Ensure validation is run
      await store.verificationHandler();
      expect(mockAuthRepository.setRecovery).not.toHaveBeenCalled();
    });
  });
});
