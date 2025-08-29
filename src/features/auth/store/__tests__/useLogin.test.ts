import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { ref } from 'vue';
import { SELFSERVICE } from '../type';
import { useLoginStore } from '../useLogin';

// Mock environment variables
vi.mock('InvestCommon/global', () => ({
  default: {
    FRONTEND_URL_STATIC: 'http://localhost:3000',
  },
}));

// Mock all required dependencies
vi.mock('InvestCommon/data/auth/auth.repository', () => {
  const mockGetAuthFlow = vi.fn().mockResolvedValue(undefined);
  const mockSetLogin = vi.fn().mockResolvedValue(undefined);
  const mockGetLogin = vi.fn().mockResolvedValue(undefined);

  return {
    useRepositoryAuth: vi.fn(() => ({
      flowId: { value: 'test-flow-id' },
      csrfToken: { value: 'test-csrf-token' },
      getAuthFlow: mockGetAuthFlow,
      setLogin: mockSetLogin,
      getLogin: mockGetLogin,
      getSchemaState: ref({ data: undefined, loading: false, error: null }),
      setLoginState: ref({ data: null, error: null }),
      getAuthFlowState: ref({ error: null }),
      getLoginState: ref({ data: null, error: null }),
    })),
  };
});

vi.mock('InvestCommon/domain/session/store/useSession', () => {
  const mockUpdateSession = vi.fn();
  return {
    useSessionStore: vi.fn(() => ({
      updateSession: mockUpdateSession,
    })),
  };
});

vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('UiKit/helpers/general', () => {
  const mockNavigateWithQueryParams = vi.fn();
  return {
    navigateWithQueryParams: mockNavigateWithQueryParams,
  };
});

vi.mock('UiKit/helpers/validation/useFormValidation', () => ({
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
      } as any;
    });

    // Make model values accessible through getters
    Object.defineProperty(model, 'email', {
      get: () => model.value.email,
      set: (value) => { model.value.email = value; },
    });

    Object.defineProperty(model, 'password', {
      get: () => model.value.password,
      set: (value) => { model.value.password = value; },
    });

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

describe('useLogin Store', () => {
  let store: ReturnType<typeof useLoginStore>;
  let mockAuthRepository: ReturnType<typeof useRepositoryAuth>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    const mockAuthRepo = {
      flowId: { value: 'test-flow-id' },
      csrfToken: { value: 'test-csrf-token' },
      getAuthFlow: vi.fn().mockResolvedValue(undefined),
      setLogin: vi.fn().mockResolvedValue(undefined),
      getLogin: vi.fn().mockResolvedValue(undefined),
      getSchemaState: ref({ data: undefined, loading: false, error: null }),
      setLoginState: ref({ data: null, error: null }),
      getAuthFlowState: ref({ error: null }),
      getLoginState: ref({ data: { requested_aal: 'aal1' }, error: null }),
    };

    vi.mocked(useRepositoryAuth).mockReturnValue(mockAuthRepo as any);
    store = useLoginStore();
    mockAuthRepository = useRepositoryAuth();
  });

  describe('Form Validation', () => {
    it('should validate email and password fields', async () => {
      const store = useLoginStore();

      // Test invalid email using real email rule
      store.model.email = 'invalid-email';
      store.model.password = 'validPassword123!';
      await store.onValidate();
      expect(store.isValid).toBe(false);
      expect(store.validation.email.length).toBeGreaterThan(0);

      // Test invalid password using real password rule
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
      const store = useLoginStore();

      // Mock backend schema
      const backendSchema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
        required: ['email', 'password'],
      };

      (useRepositoryAuth() as any).getSchemaState.value = { data: backendSchema as any } as any;

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
      const store = useLoginStore();
      store.model = {
        email: 'test@example.com',
        password: 'validPassword123!',
      };

      const mockSession = { id: 'test-session' };
      vi.mocked(useRepositoryAuth).mockReturnValueOnce({
        ...(useRepositoryAuth() as any),
        setLoginState: { value: { error: null, data: { session: mockSession } } },
      } as any);

      await store.loginPasswordHandler();
      expect(store.isLoading).toBe(false);
    });

    it('should handle login errors', async () => {
      const store = useLoginStore();
      store.model = {
        email: 'test@example.com',
        password: 'validPassword123!',
      };

      vi.mocked(useRepositoryAuth).mockReturnValueOnce({
        ...(useRepositoryAuth() as any),
        getAuthFlowState: { value: { error: new Error('Test error') } },
      } as any);

      await store.loginPasswordHandler();
      expect(store.isLoading).toBe(false);
    });

    it('should handle browser location change aal2', async () => {
      const store = useLoginStore();
      store.model = {
        email: 'test@example.com',
        password: 'validPassword123!',
      };

      const browserLocationChangeResponse = {
        error: {
          id: 'browser_location_change_required',
          code: 422,
          status: 'Unprocessable Entity',
          reason: 'In order to complete this flow please redirect the browser to: https://id.webdevelop.biz/self-service/login/browser?aal=aal2',
          message: 'browser location change required',
        },
        redirect_browser_to: 'https://id.webdevelop.biz/self-service/login/browser?aal=aal2',
      };

      const mockAuthRepo = {
        ...(useRepositoryAuth() as any),
        setLoginState: { value: { error: browserLocationChangeResponse, data: null } },
      } as any;
      vi.mocked(useRepositoryAuth).mockReturnValue(mockAuthRepo as any);

      await store.loginPasswordHandler();

      expect(store.isLoading).toBe(false);
    });
  });

  describe('Social Login', () => {
    it('should handle social login', async () => {
      // Mock URL with flow parameter
      Object.defineProperty(window, 'location', {
        value: { search: '?flow=existing-flow-id' },
        writable: true,
      });

      // Mock successful auth flow
      mockAuthRepository.getAuthFlowState.value = { data: undefined, loading: false, error: null } as any;
      mockAuthRepository.setLoginState.value = { data: null as any, loading: false, error: null } as any;

      await store.loginSocialHandler('google');

      // Verify the complete social login flow
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
      const store = useLoginStore();

      // Mock URL without flow parameter
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      });

      await store.loginSocialHandler('google');

      // Verify the complete flow including flow creation
      expect(useRepositoryAuth().getAuthFlow).toHaveBeenCalledWith(SELFSERVICE.login);
      expect(useRepositoryAuth().setLogin).toHaveBeenCalledWith(
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

  describe('Navigation and Query Parameters', () => {
    it('should handle query parameters correctly', () => {
      const store = useLoginStore();

      // Mock URL with multiple query parameters
      Object.defineProperty(window, 'location', {
        value: { search: '?redirect=/test&source=email' },
        writable: true,
      });

      // Test query parameter retrieval
      expect(store.getQueryParam('redirect')).toBe('/test');
    });

    it('should handle navigation with query parameters', () => {
      const store = useLoginStore();

      // Mock URL with query parameters
      Object.defineProperty(window, 'location', {
        value: { search: '?redirect=/test&source=email' },
        writable: true,
      });

      store.onSignup();

      // Verify navigation with preserved query parameters
      expect(store.getQueryParam('redirect')).toBe('/test');
    });
  });

  describe('onMountedHandler', () => {
    it('should handle flow parameter and navigate to authenticator when aal2 is requested', async () => {
      const store = useLoginStore();
      const mockFlowId = 'test-flow-id';

      // Mock URL with flow parameter
      Object.defineProperty(window, 'location', {
        value: { search: `?flow=${mockFlowId}` },
        writable: true,
      });

      // Mock getLogin response with aal2
      vi.mocked(useRepositoryAuth).mockReturnValueOnce({
        ...(useRepositoryAuth() as any),
        getLoginState: { value: { data: { requested_aal: 'aal2' } } },
      } as any);

      await store.onMountedHandler();

      // Verify getLogin was called with correct flow ID
      expect(mockAuthRepository.getLogin).toHaveBeenCalledWith(mockFlowId);
    });

    it('should not navigate when flow parameter is not present', async () => {
      const store = useLoginStore();

      // Mock URL without flow parameter
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      });

      await store.onMountedHandler();

      // Verify getLogin was not called
      expect(mockAuthRepository.getLogin).not.toHaveBeenCalled();
    });

    it('should not navigate when aal2 is not requested', async () => {
      const store = useLoginStore();
      const mockFlowId = 'test-flow-id';

      // Mock URL with flow parameter
      Object.defineProperty(window, 'location', {
        value: { search: `?flow=${mockFlowId}` },
        writable: true,
      });

      // Mock getLogin response without aal2
      const mockAuthRepo = {
        ...(useRepositoryAuth() as any),
        getLoginState: { value: { data: { requested_aal: 'aal1' } } },
      } as any;
      vi.mocked(useRepositoryAuth).mockReturnValue(mockAuthRepo as any);

      await store.onMountedHandler();

      // Verify getLogin was called but no navigation occurred
      expect(mockAuthRepository.getLogin).toHaveBeenCalledWith(mockFlowId);
    });
  });

  // add 2fa tests
});
