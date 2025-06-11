import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { ref } from 'vue';
import { SELFSERVICE } from '../type';
import { useAuthenticatorStore } from '../useAuthenticator';
import { useUserSession } from 'InvestCommon/store/useUserSession';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';

// Mock environment variables
vi.mock('InvestCommon/global', () => ({
  default: {
    FRONTEND_URL_STATIC: 'http://localhost:3000',
  },
}));

// Add at the top of your file, before vi.mock:
export const mockUpdateSession = vi.fn();

// Mock all required dependencies
vi.mock('InvestCommon/data/auth/auth.repository', () => {
  const mockGetAuthFlow = vi.fn().mockResolvedValue(undefined);
  const mockSetLogin = vi.fn().mockResolvedValue(undefined);

  return {
    useRepositoryAuth: vi.fn(() => ({
      flowId: { value: 'test-flow-id' },
      csrfToken: { value: 'test-csrf-token' },
      getAuthFlow: mockGetAuthFlow,
      setLogin: mockSetLogin,
      getSchemaState: ref({ data: undefined, loading: false, error: null }),
      setLoginState: ref({ data: null, error: null }),
      getAuthFlowState: ref({ error: null }),
      onLogout: vi.fn(),
    })),
  };
});

vi.mock('InvestCommon/store/useUserSession', () => ({
  useUserSession: vi.fn(() => ({
    updateSession: mockUpdateSession,
  })),
}));

vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn(() => {
    const model = ref({ totp_code: '' });
    const isValid = ref(true);
    const validation = ref({});

    const onValidate = vi.fn().mockImplementation(() => {
      // Simple validation logic for testing
      const totpValid = /^\d{6}$/.test(model.value.totp_code);

      isValid.value = totpValid;
      validation.value = {
        totp_code: !totpValid ? ['Invalid TOTP code format'] : [],
      };
    });

    return {
      model,
      validation,
      isValid,
      onValidate,
    };
  }),
}));

// Mock navigation
vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn().mockResolvedValue(undefined),
}));

describe('useAuthenticator Store', () => {
  let store: ReturnType<typeof useAuthenticatorStore>;
  let mockAuthRepository: ReturnType<typeof useRepositoryAuth>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    store = useAuthenticatorStore();
    mockAuthRepository = useRepositoryAuth();
  });

  describe('Form Validation', () => {
    it('should validate TOTP code field', async () => {
      const store = useAuthenticatorStore();

      // Test invalid TOTP code
      store.model.totp_code = '12345';
      await store.onValidate();
      expect(store.isValid).toBe(false);
      expect(store.validation.totp_code.length).toBeGreaterThan(0);

      // Test valid TOTP code
      store.model.totp_code = '123456';
      await store.onValidate();
      expect(store.isValid).toBe(true);
      expect(store.validation.totp_code.length).toBe(0);
    });

    it('should handle form validation with backend schema', async () => {
      const store = useAuthenticatorStore();

      // Mock backend schema
      const backendSchema = {
        type: 'object',
        properties: {
          totp_code: { type: 'string', pattern: '^\\d{6}$' },
        },
        required: ['totp_code'],
      };

      useRepositoryAuth().getSchemaState.value = { data: backendSchema };

      // Test with invalid data
      store.model.totp_code = '12345';
      await store.onValidate();
      expect(store.isValid).toBe(false);

      // Test with valid data
      store.model.totp_code = '123456';
      await store.onValidate();
      expect(store.isValid).toBe(true);
    });
  });

  describe('TOTP Handler', () => {
    it('should handle successful TOTP verification', async () => {
      const store = useAuthenticatorStore();
      store.model = {
        totp_code: 123456,
        email: 'test@example.com'
      };

      const mockSession = { id: 'test-session' };
      
      // Mock useRepositoryAuth with successful response
      vi.mocked(useRepositoryAuth).mockReturnValue({
        ...useRepositoryAuth(),
        setLoginState: { value: { error: null, data: { session: mockSession } } },
        flowId: { value: 'test-flow-id' },
        csrfToken: { value: 'test-csrf-token' },
        setLogin: vi.fn().mockResolvedValue(undefined),
      });

      await store.totpHandler();
      expect(store.isLoading).toBe(false);
    });

    it('should handle TOTP verification errors', async () => {
      const store = useAuthenticatorStore();
      store.model = {
        totp_code: '123456',
      };

      vi.mocked(useRepositoryAuth).mockReturnValueOnce({
        ...useRepositoryAuth(),
        setLoginState: { value: { error: 'Invalid TOTP code', data: null } },
      });

      await store.totpHandler();
      expect(store.isLoading).toBe(false);
      expect(useUserSession().updateSession).not.toHaveBeenCalled();
    });
  });

  describe('Navigation and Query Parameters', () => {
    it('should handle query parameters correctly', () => {
      const store = useAuthenticatorStore();

      // Mock URL with multiple query parameters
      Object.defineProperty(window, 'location', {
        value: { search: '?redirect=/test&source=email' },
        writable: true,
      });

      // Test query parameter retrieval
      expect(store.getQueryParam('redirect')).toBe('/test');
    });

    it('should handle navigation with query parameters', () => {
      const store = useAuthenticatorStore();

      // Mock URL with query parameters
      Object.defineProperty(window, 'location', {
        value: { search: '?redirect=/test&source=email' },
        writable: true,
      });

      store.navigateToProfile();

      // Verify navigation with preserved query parameters
      expect(store.getQueryParam('redirect')).toBe('/test');
    });
  });

  describe('Mount Handler', () => {
    it('should initialize auth flow on mount', async () => {
      const store = useAuthenticatorStore();
      await store.onMoutedHandler();
      expect(mockAuthRepository.getAuthFlow).toHaveBeenCalledWith(`${SELFSERVICE.login}?aal=aal2`);
    });
  });
}); 