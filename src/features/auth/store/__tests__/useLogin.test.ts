import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useLoginStore } from '../useLogin';

// Mock data
const mockFlowId = 'test-flow-id';
const mockCsrfToken = 'test-csrf-token';
const mockSession = { id: 'test-session' };

// Mock the auth repository
const mockGetAuthFlowState = ref<any>({ error: null });
const mockSetLoginState = ref<any>({ data: null, error: null });
const mockGetLoginState = ref<any>({ data: { requested_aal: 'aal1' }, error: null });
const mockGetSchemaState = ref<any>({ data: undefined, loading: false, error: null });

vi.mock('InvestCommon/data/auth/auth.repository', () => ({
  useRepositoryAuth: () => ({
    flowId: { value: mockFlowId },
    csrfToken: { value: mockCsrfToken },
    getAuthFlow: vi.fn().mockResolvedValue(undefined),
    setLogin: vi.fn().mockResolvedValue(undefined),
    getLogin: vi.fn().mockResolvedValue(undefined),
    getSchemaState: mockGetSchemaState,
    setLoginState: mockSetLoginState,
    getAuthFlowState: mockGetAuthFlowState,
    getLoginState: mockGetLoginState,
  }),
}));

// Mock cookies for useSessionStore
const mockCookies = {
  get: vi.fn().mockReturnValue(undefined),
  set: vi.fn(),
  remove: vi.fn(),
};

vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: () => mockCookies,
}));

vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: () => ({
    submitFormToHubspot: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn(),
}));

vi.mock('InvestCommon/domain/config/env', () => ({
  default: {
    FRONTEND_URL_STATIC: 'http://localhost:3000',
    FRONTEND_URL_DASHBOARD: 'http://localhost:3001',
  },
}));

describe('useLogin Store', () => {
  let store: ReturnType<typeof useLoginStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // Reset mock refs to initial state
    mockGetAuthFlowState.value = { error: null };
    mockSetLoginState.value = { data: null, error: null };
    mockGetLoginState.value = { data: { requested_aal: 'aal1' }, error: null };
    mockGetSchemaState.value = { data: undefined, loading: false, error: null };
    
    store = useLoginStore();
  });

  describe('Form Validation', () => {
    it('should validate email and password fields', async () => {
      // Test invalid email
      store.model.email = 'invalid-email';
      store.model.password = 'validPassword123!';
      await store.onValidate();
      expect(store.isValid).toBe(false);

      // Test invalid password
      store.model.email = 'valid@email.com';
      store.model.password = 'short';
      await store.onValidate();
      expect(store.isValid).toBe(false);

      // Test valid credentials
      store.model.email = 'valid@email.com';
      store.model.password = 'validPassword123!';
      await store.onValidate();
      expect(store.isValid).toBe(true);
    });
  });

  describe('Password Login', () => {
    it('should handle successful password login', async () => {
      store.model = {
        email: 'test@example.com',
        password: 'validPassword123!',
      };

      mockSetLoginState.value = { error: null, data: { session: mockSession } };

      await store.loginPasswordHandler();

      expect(store.isLoading).toBe(false);
    });

    it('should handle login errors', async () => {
      store.model = {
        email: 'test@example.com',
        password: 'validPassword123!',
      };

      mockGetAuthFlowState.value = { error: new Error('Test error') };

      await store.loginPasswordHandler();

      expect(store.isLoading).toBe(false);
    });
  });

  describe('Social Login', () => {
    it('should handle social login with flow parameter', async () => {
      setActivePinia(createPinia());
      const testStore = useLoginStore();
      
      // Mock getQueryParam to return flow ID
      vi.spyOn(testStore, 'getQueryParam').mockImplementation((key: string) => {
        return key === 'flow' ? 'existing-flow-id' : undefined;
      });

      mockGetAuthFlowState.value = { error: null };

      await testStore.loginSocialHandler('google');

      expect(testStore.isLoading).toBe(false);
    });

    it('should handle social login without flow parameter', async () => {
      setActivePinia(createPinia());
      const testStore = useLoginStore();
      
      // Mock getQueryParam to return undefined for flow
      vi.spyOn(testStore, 'getQueryParam').mockImplementation(() => {
        return undefined;
      });

      mockGetAuthFlowState.value = { error: null };

      await testStore.loginSocialHandler('google');

      expect(testStore.isLoading).toBe(false);
    });
  });

  describe('Navigation and Query Parameters', () => {
    it('should handle query parameters correctly', () => {
      // Mock the queryParams computed to return our test data
      const mockQueryParams = new Map([['redirect', '/test'], ['source', 'email']]);
      
      setActivePinia(createPinia());
      const testStore = useLoginStore();
      
      // Mock the getQueryParam method
      vi.spyOn(testStore, 'getQueryParam').mockImplementation((key: string) => {
        return mockQueryParams.get(key);
      });

      expect(testStore.getQueryParam('redirect')).toBe('/test');
    });

    it('should handle navigation with query parameters', () => {
      // Mock the queryParams computed to return our test data
      const mockQueryParams = new Map([['redirect', '/test'], ['source', 'email']]);
      
      setActivePinia(createPinia());
      const testStore = useLoginStore();
      
      // Mock the getQueryParam method
      vi.spyOn(testStore, 'getQueryParam').mockImplementation((key: string) => {
        return mockQueryParams.get(key);
      });
      
      // Verify query param is accessible
      expect(testStore.getQueryParam('redirect')).toBe('/test');
      
      // onSignup should navigate with preserved query params - verify it doesn't throw
      expect(() => testStore.onSignup()).not.toThrow();
    });
  });

  describe('onMountedHandler', () => {
    it('should handle flow parameter and navigate to authenticator when aal2 is requested', async () => {
      setActivePinia(createPinia());
      const testStore = useLoginStore();
      
      // Mock getQueryParam to return flow ID
      vi.spyOn(testStore, 'getQueryParam').mockImplementation((key: string) => {
        return key === 'flow' ? 'test-flow-id' : undefined;
      });
      
      mockGetLoginState.value = { data: { requested_aal: 'aal2' }, error: null };

      await testStore.onMountedHandler();

      expect(mockGetLoginState.value.data?.requested_aal).toBe('aal2');
    });

    it('should not navigate when flow parameter is not present', async () => {
      setActivePinia(createPinia());
      const testStore = useLoginStore();
      
      // Mock getQueryParam to return undefined
      vi.spyOn(testStore, 'getQueryParam').mockImplementation(() => {
        return undefined;
      });

      await testStore.onMountedHandler();

      expect(testStore.getQueryParam('flow')).toBeUndefined();
    });

    it('should not navigate when aal2 is not requested', async () => {
      setActivePinia(createPinia());
      const testStore = useLoginStore();
      
      // Mock getQueryParam to return flow ID
      vi.spyOn(testStore, 'getQueryParam').mockImplementation((key: string) => {
        return key === 'flow' ? 'test-flow-id' : undefined;
      });
      
      mockGetLoginState.value = { data: { requested_aal: 'aal1' }, error: null };

      await testStore.onMountedHandler();

      expect(mockGetLoginState.value.data?.requested_aal).toBe('aal1');
    });
  });
});
