import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { ref } from 'vue';
// use real form validation; no mock import needed
import { useSignupStore } from '../useSignup';

const mockDemoAccountAuthenticate = vi.fn().mockResolvedValue(true);
const mockIsDemoAccountAvailable = ref(true);
const mockIsDemoAccountLoading = ref(false);
const mockGetSchemaState = ref({ data: {} });
const mockSetSignupState = ref({ error: null, data: null });
const mockGetSignupState = ref({ data: null });
const mockGetAuthFlowState = ref({ error: null });
const mockFlowId = { value: 'test-flow-id' };
const mockCsrfToken = { value: 'test-csrf-token' };
const mockGetAuthFlow = vi.fn().mockResolvedValue({ id: 'test-flow-id', ui: {} });
const mockSetSignup = vi.fn().mockResolvedValue(undefined);
const mockGetSignup = vi.fn().mockResolvedValue(undefined);

// Mock the dependencies
vi.mock('InvestCommon/data/auth/auth.repository', () => ({
  useRepositoryAuth: vi.fn(() => ({
    getSchemaState: mockGetSchemaState,
    setSignupState: mockSetSignupState,
    getSignupState: mockGetSignupState,
    getAuthFlowState: mockGetAuthFlowState,
    flowId: mockFlowId,
    csrfToken: mockCsrfToken,
    getAuthFlow: mockGetAuthFlow,
    setSignup: mockSetSignup,
    getSignup: mockGetSignup,
  })),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    updateSession: vi.fn(),
  })),
}));

// no mock for useFormValidation – use the real implementation

vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: vi.fn(),
  })),
}));

vi.mock('InvestCommon/domain/analytics/useSendAnalyticsEvent', () => ({
  useSendAnalyticsEvent: () => ({
    sendEvent: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('InvestCommon/domain/error/oryResponseHandling', () => ({
  oryResponseHandling: vi.fn(),
}));

vi.mock('InvestCommon/domain/error/oryErrorHandling', () => ({
  oryErrorHandling: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('InvestCommon/features/auth/composables/useDemoAccountAuth', () => ({
  useDemoAccountAuth: () => ({
    authenticate: mockDemoAccountAuthenticate,
    isAvailable: mockIsDemoAccountAvailable,
    isLoading: mockIsDemoAccountLoading,
  }),
}));

describe('useSignup Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    const authRepository = useRepositoryAuth() as any;
    authRepository.getSchemaState.value = { data: {} };
    authRepository.setSignupState.value = { error: null, data: null };
    authRepository.getSignupState.value = { data: null };
    authRepository.getAuthFlowState.value = { error: null };
    authRepository.flowId.value = 'test-flow-id';
    authRepository.csrfToken.value = 'test-csrf-token';
    authRepository.getAuthFlow.mockReset().mockResolvedValue(undefined);
    authRepository.setSignup.mockReset().mockResolvedValue(undefined);
    authRepository.getSignup.mockReset().mockResolvedValue(undefined);
    mockDemoAccountAuthenticate.mockReset().mockResolvedValue(true);
    mockIsDemoAccountAvailable.value = true;
    mockIsDemoAccountLoading.value = false;
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const store = useSignupStore();
      expect(store.isLoading).toBe(false);
      expect(store.checkbox).toBe(false);
      expect(store.isDisabledButton).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should validate form successfully', () => {
      const store = useSignupStore();
      store.model.first_name = 'John';
      store.model.last_name = 'Doe';
      store.model.email = 'john@example.com';
      store.model.create_password = 'Password123!';
      store.model.repeat_password = 'Password123!';

      const result = store.validateForm();
      expect(result).toBe(true);
    });

    it('should handle invalid form validation', () => {
      const store = useSignupStore();
      store.model.first_name = '';
      store.model.last_name = '';
      store.model.email = 'invalid';
      store.model.create_password = 'short';
      store.model.repeat_password = 'mismatch';
      const result = store.validateForm();
      expect(result).toBe(false);
    });
  });

  describe('Signup Handlers', () => {
    it('should handle password signup successfully', async () => {
      const store = useSignupStore();
      const authRepository = useRepositoryAuth() as any;
      store.checkbox = true;
      store.model.email = 'test@example.com';
      store.model.first_name = 'John';
      store.model.last_name = 'Doe';
      store.model.create_password = 'password123';
      store.model.repeat_password = 'password123';

      const mockSession: any = { id: 'test-session' };
      authRepository.getAuthFlow.mockImplementationOnce(async () => {
        authRepository.csrfToken.value = 'fresh-signup-csrf-token';
      });
      authRepository.setSignupState.value = {
        error: null,
        data: { session: mockSession, session_token: 'token' },
      };

      await store.signupPasswordHandler();
      expect(store.isLoading).toBe(false);
      expect(authRepository.setSignup).toHaveBeenCalledWith(
        'test-flow-id',
        expect.objectContaining({
          csrf_token: 'fresh-signup-csrf-token',
          password: 'password123',
        }),
      );
    });

    it('should handle social signup successfully', async () => {
      const store = useSignupStore();
      await store.signupSocialHandler('google');
      expect(store.isLoading).toBe(false);
    });

    it('should handle signup errors', async () => {
      const store = useSignupStore();
      const authRepository = useRepositoryAuth() as any;
      store.checkbox = true;

      authRepository.getAuthFlowState.value = {
        data: undefined,
        loading: false,
        error: new Error('Test error'),
      };

      await store.signupPasswordHandler();
      expect(store.isLoading).toBe(false);
    });

    it('should delegate demo account signup to the shared demo auth helper without requiring form validation', async () => {
      const store = useSignupStore();

      await store.demoAccountHandler();

      expect(mockDemoAccountAuthenticate).toHaveBeenCalledTimes(1);
      expect(store.checkbox).toBe(false);
      expect(store.isDemoAccountAvailable).toBe(true);
      expect(store.isDemoAccountLoading).toBe(false);
    });
  });

  describe('Form Field Mapping', () => {
    it('should map form fields correctly', () => {
      const store = useSignupStore();
      const nodes = [
        {
          attributes: {
            name: 'traits.email',
            value: 'test@example.com',
          },
        },
        {
          attributes: {
            name: 'traits.first_name',
            value: 'John',
          },
        },
        {
          attributes: {
            name: 'traits.last_name',
            value: 'Doe',
          },
        },
      ];

      store.mapFormFields(nodes);
      expect(store.model.email).toBe('test@example.com');
      expect(store.model.first_name).toBe('John');
      expect(store.model.last_name).toBe('Doe');
    });

    it('should handle full name splitting', () => {
      const store = useSignupStore();
      const nodes = [
        {
          attributes: {
            name: 'traits.name',
            value: 'John Doe',
          },
        },
      ];

      store.mapFormFields(nodes);
      expect(store.model.first_name).toBe('John');
      expect(store.model.last_name).toBe('Doe');
    });
  });

  describe('Query Parameters', () => {
    it('should handle query parameters correctly', () => {
      // Mock window.location.search
      Object.defineProperty(window, 'location', {
        value: {
          search: '?flow=test-flow&redirect=/profile',
        },
        writable: true,
      });

      // Create a new pinia instance for this test
      const pinia = createPinia();
      setActivePinia(pinia);

      // Create the store after mocking
      const store = useSignupStore();

      // Test the query parameters
      expect(store.queryFlow).toBe('test-flow');
      expect(store.title).toBe('Finish Registration');
    });
  });
});
