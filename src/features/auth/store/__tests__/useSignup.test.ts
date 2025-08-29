import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia, defineStore } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { ref } from 'vue';
// use real form validation; no mock import needed
import { useSignupStore } from '../useSignup';

// Create a mock auth store
const mockAuthStore = defineStore('auth', () => {
  const getSchemaState = ref({ data: {} });
  const setSignupState = ref({ error: null, data: null });
  const getSignupState = ref({ data: null });
  const getAuthFlowState = ref({ error: null });
  const flowId = ref('test-flow-id');
  const csrfToken = ref('test-csrf-token');

  return {
    getSchemaState,
    setSignupState,
    getSignupState,
    getAuthFlowState,
    flowId,
    csrfToken,
    getAuthFlow: vi.fn(),
    setSignup: vi.fn(),
    getSignup: vi.fn(),
  };
});

// Mock the dependencies
vi.mock('InvestCommon/data/auth/auth.repository', () => ({
  useRepositoryAuth: vi.fn(() => mockAuthStore()),
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

describe('useSignup Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
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
      store.checkbox = true;
      store.model = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        create_password: 'password123',
        repeat_password: 'password123',
      };

      const mockSession: any = { id: 'test-session' };
      vi.mocked(useRepositoryAuth).mockReturnValueOnce({
        ...(useRepositoryAuth() as any),
        setSignupState: { value: { error: null, data: { session: mockSession, session_token: 'token' } } },
      } as any);

      await store.signupPasswordHandler();
      expect(store.isLoading).toBe(false);
    });

    it('should handle social signup successfully', async () => {
      const store = useSignupStore();
      await store.signupSocialHandler('google');
      expect(store.isLoading).toBe(false);
    });

    it('should handle signup errors', async () => {
      const store = useSignupStore();
      store.checkbox = true;

      vi.mocked(useRepositoryAuth).mockReturnValueOnce({
        ...(useRepositoryAuth() as any),
        getAuthFlowState: { value: { data: undefined, loading: false, error: new Error('Test error') } },
      } as any);

      await store.signupPasswordHandler();
      expect(store.isLoading).toBe(false);
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

      // Create a mock auth store
      const mockAuthStore = defineStore('auth', () => {
        const getSchemaState = ref({ data: {} });
        const setSignupState = ref({ error: null, data: null });
        const getSignupState = ref({ data: null });
        const getAuthFlowState = ref({ error: null });
        const flowId = ref('test-flow-id');
        const csrfToken = ref('test-csrf-token');

        return {
          getSchemaState,
          setSignupState,
          getSignupState,
          getAuthFlowState,
          flowId,
          csrfToken,
          getAuthFlow: vi.fn(),
          setSignup: vi.fn(),
          getSignup: vi.fn(),
        };
      });

      // Mock the repository before creating the store
      vi.mocked(useRepositoryAuth).mockReturnValue(mockAuthStore() as any);

      // Create the store after mocking
      const store = useSignupStore();

      // Test the query parameters
      expect(store.queryFlow).toBe('test-flow');
      expect(store.title).toBe('Finish Registration');
    });
  });
});
