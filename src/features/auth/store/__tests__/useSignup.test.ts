import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia, defineStore } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { ref } from 'vue';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
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

vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn(() => ({
    model: {
      email: '',
      first_name: '',
      last_name: '',
      create_password: '',
      repeat_password: '',
    },
    validation: {},
    isValid: true,
    onValidate: vi.fn(),
  })),
}));

vi.mock('InvestCommon/composable/useHubspotForm', () => ({
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
      // Set up the mock before creating the store
      const mockOnValidate = vi.fn();
      vi.mocked(useFormValidation).mockReturnValue({
        model: {
          email: '',
          first_name: '',
          last_name: '',
          create_password: '',
          repeat_password: '',
        },
        validation: {},
        isValid: ref(true),
        onValidate: mockOnValidate,
      });

      const store = useSignupStore();
      const result = store.validateForm();
      expect(mockOnValidate).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle invalid form validation', () => {
      // Set up the mock before creating the store
      const mockOnValidate = vi.fn();
      vi.mocked(useFormValidation).mockReturnValue({
        model: {},
        validation: {},
        isValid: ref(false),
        onValidate: mockOnValidate,
      });

      const store = useSignupStore();
      const result = store.validateForm();
      expect(mockOnValidate).toHaveBeenCalled();
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

      const mockSession = { id: 'test-session' };
      vi.mocked(useRepositoryAuth).mockReturnValueOnce({
        ...useRepositoryAuth(),
        setSignupState: { value: { error: null, data: { session: mockSession } } },
      });

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
        ...useRepositoryAuth(),
        getAuthFlowState: { value: { error: 'Test error' } },
      });

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
      vi.mocked(useRepositoryAuth).mockReturnValue(mockAuthStore());

      // Create the store after mocking
      const store = useSignupStore();

      // Test the query parameters
      expect(store.queryFlow).toBe('test-flow');
      expect(store.title).toBe('Finish Registration');
    });
  });
});
