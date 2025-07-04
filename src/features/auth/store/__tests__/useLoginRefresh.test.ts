/* eslint-disable no-shadow */
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { ref } from 'vue';
import { SELFSERVICE } from '../type';
import { useLoginRefreshStore } from '../useLoginRefresh';

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
    })),
  };
});

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    updateSession: mockUpdateSession,
  })),
}));

vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn(() => {
    const model = ref({ email: '', password: '' });
    const isValid = ref(true);
    const validation = ref({});

    const onValidate = vi.fn().mockImplementation(() => {
      // Simple validation logic for testing
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(model.value.email);
      const passwordValid = model.value.password.length >= 8;

      isValid.value = emailValid && passwordValid;
      validation.value = {
        email: !emailValid ? ['Invalid email format'] : [],
        password: !passwordValid ? ['Password must be at least 8 characters'] : [],
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

vi.mock('InvestCommon/domain/dialogs/store/useDialogs', () => ({
  useDialogs: vi.fn(() => ({
    isDialogRefreshSessionOpen: ref(false),
  })),
}));

describe('useLoginRefresh Store', () => {
  let store: ReturnType<typeof useLoginRefreshStore>;
  let mockAuthRepository: ReturnType<typeof useRepositoryAuth>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    store = useLoginRefreshStore();
    mockAuthRepository = useRepositoryAuth();
  });

  describe('Form Validation', () => {
    it('should validate email and password fields', async () => {
      const store = useLoginRefreshStore();

      // Test invalid email
      store.model.email = 'invalid-email';
      store.model.password = 'validPassword123!';
      await store.onValidate();
      expect(store.isValid).toBe(false);
      expect(store.validation.email.length).toBeGreaterThan(0);

      // Test invalid password
      store.model.email = 'valid@email.com';
      store.model.password = 'short';
      await store.onValidate();
      expect(store.isValid).toBe(false);
      expect(store.validation.password.length).toBeGreaterThan(0);

      // Test valid credentials
      store.model.email = 'valid@email.com';
      store.model.password = 'validPassword123!';
      await store.onValidate();
      expect(store.isValid).toBe(true);
      expect(store.validation.email.length).toBe(0);
      expect(store.validation.password.length).toBe(0);
    });

    it('should handle form validation with backend schema', async () => {
      const store = useLoginRefreshStore();

      // Mock backend schema
      const backendSchema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
        required: ['email', 'password'],
      };

      useRepositoryAuth().getSchemaState.value = { data: backendSchema };

      // Test with invalid data
      store.model.email = 'invalid';
      store.model.password = '123';
      await store.onValidate();
      expect(store.isValid).toBe(false);

      // Test with valid data
      store.model.email = 'valid@example.com';
      store.model.password = 'validPassword123!';
      await store.onValidate();
      expect(store.isValid).toBe(true);
    });
  });

  describe('Password Login', () => {
    it('should handle successful password login', async () => {
      const store = useLoginRefreshStore();
      store.model = {
        email: 'test@example.com',
        password: 'validPassword123!',
      };

      const mockSession = { id: 'test-session' };
      vi.mocked(useRepositoryAuth).mockReturnValueOnce({
        ...useRepositoryAuth(),
        setLoginState: { value: { error: null, data: { session: mockSession } } },
      });

      await store.loginPasswordHandler();
      expect(store.isLoading).toBe(false);
    });

    it('should handle login errors', async () => {
      const store = useLoginRefreshStore();
      store.model = {
        email: 'test@example.com',
        password: 'validPassword123!',
      };

      vi.mocked(useRepositoryAuth).mockReturnValueOnce({
        ...useRepositoryAuth(),
        getAuthFlowState: { value: { error: 'Test error' } },
      });

      await store.loginPasswordHandler();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('Social Login', () => {
    it('should handle social login with existing flow ID', async () => {
      // Mock URL with flow parameter
      Object.defineProperty(window, 'location', {
        value: { search: '?flow=existing-flow-id' },
        writable: true,
      });

      await store.loginSocialHandler('google');

      expect(mockAuthRepository.setLogin).toHaveBeenCalledWith(
        'existing-flow-id',
        expect.objectContaining({
          provider: 'google',
          method: 'oidc',
          csrf_token: 'test-csrf-token',
        }),
      );
      expect(store.isLoading).toBe(false);
    });

    it('should handle social login without flow ID', async () => {
      // Mock URL without flow parameter
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      });

      await store.loginSocialHandler('google');

      expect(mockAuthRepository.getAuthFlow).toHaveBeenCalledWith(SELFSERVICE.login, { refresh: true });
      expect(mockAuthRepository.setLogin).toHaveBeenCalledWith(
        'test-flow-id',
        expect.objectContaining({
          provider: 'google',
          method: 'oidc',
          csrf_token: 'test-csrf-token',
        }),
      );
      expect(store.isLoading).toBe(false);
    });
  });

  describe('Query Parameters', () => {
    it('should handle query parameters correctly', () => {
      // Mock URL with multiple query parameters
      Object.defineProperty(window, 'location', {
        value: { search: '?redirect=/test&source=email' },
        writable: true,
      });

      expect(store.getQueryParam('redirect')).toBe('/test');
      expect(store.getQueryParam('source')).toBe('email');
    });

    it('should return undefined for non-existent query parameters', () => {
      // Mock URL with no query parameters
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      });

      expect(store.getQueryParam('nonexistent')).toBeUndefined();
    });
  });
});
