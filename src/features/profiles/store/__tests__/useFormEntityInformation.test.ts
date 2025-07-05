import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { ROUTE_DASHBOARD_ACCOUNT } from '../../../../helpers/enums/routes';
import { useFormEntityInformation } from '../useFormEntityInformation';


const mockFormRef = ref<any>(null);

vi.mock('vue', async () => {
  const vue = await vi.importActual('vue');
  return {
    ...vue,
    useTemplateRef: vi.fn((name: string) => {
      if (name === 'entityInformationFormChild') {
        return mockFormRef;
      }
      return ref(null);
    }),
  };
});


const mockRouterInstance = {
  push: vi.fn(),
  currentRoute: {
    value: {
      query: {},
    },
  },
};

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => mockRouterInstance),
}));


vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => ({
    selectedUserProfileId: ref('123'),
    selectedUserProfileType: ref('individual'),
    selectedUserProfileData: ref({
      data: {
        entity_name: 'Test Entity',
        entity_type: 'corporation',
        tax_id: '123456789',
        address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zip_code: '12345',
      },
      user_id: 'user123',
      id: 'profile123',
    }),
  })),
}));


vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => ({
    setProfileById: vi.fn(),
    getProfileById: vi.fn(),
    setProfileByIdState: ref({ error: null }),
    getProfileByIdOptionsState: ref({ data: { schema: 'test-schema' } }),
  })),
}));


vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    userSessionTraits: ref({ email: 'test@example.com' }),
  })),
}));


vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: vi.fn(),
  })),
}));


vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));


vi.mock('InvestCommon/global', () => ({
  default: {
    HUBSPOT_FORM_ID_ENTITY_INFORMATION: 'test-entity-info-form-id',
  },
}));


vi.mock('InvestCommon/types/form', () => ({
  FormChild: vi.fn(),
}));

describe('useFormEntityInformation', () => {
  let store: ReturnType<typeof useFormEntityInformation>;
  let mockRouter: any;
  let mockProfilesStore: any;
  let mockRepositoryProfiles: any;
  let mockSessionStore: any;
  let mockHubspotForm: any;
  let mockScrollToError: any;

  beforeEach(() => {
    setActivePinia(createPinia());


    mockFormRef.value = null;

    mockRouter = vi.mocked(useRouter)();
    mockProfilesStore = vi.mocked(useProfilesStore)();
    mockRepositoryProfiles = vi.mocked(useRepositoryProfiles)();
    mockSessionStore = vi.mocked(useSessionStore)();
    mockHubspotForm = vi.mocked(useHubspotForm)('test-entity-info-form-id');
    mockScrollToError = vi.mocked(scrollToError);

    vi.clearAllMocks();

    store = useFormEntityInformation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(store.backButtonText).toBe('Back to Profile Details');
      expect(store.isLoading).toBe(false);
    });

    it('should compute breadcrumbs correctly', () => {
      expect(store.breadcrumbs).toEqual([
        {
          text: 'Dashboard',
          to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: '123' } },
        },
        {
          text: 'Profile Details',
          to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: '123' } },
        },
        {
          text: 'Entity Information',
        },
      ]);
    });

    it('should compute model data correctly', () => {
      expect(store.modelData).toEqual({
        entity_name: 'Test Entity',
        entity_type: 'corporation',
        tax_id: '123456789',
        address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zip_code: '12345',
      });
    });
  });

  describe('handleSave - Validation failure', () => {
    it('should not proceed when form validation fails', async () => {
      await store.handleSave();

      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardEntityInformation');
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - Success scenarios', () => {
    beforeEach(() => {
      mockRepositoryProfiles.setProfileById.mockResolvedValue(undefined);
      mockRepositoryProfiles.getProfileById.mockResolvedValue(undefined);
    });

    it('should save profile successfully and navigate to account page', async () => {

      mockFormRef.value = {
        onValidate: vi.fn(),
        isValid: true,
        model: {
          entity_name: 'Updated Entity',
          entity_type: 'llc',
        },
      };

      await nextTick();

      await store.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        {
          entity_name: 'Updated Entity',
          entity_type: 'llc',
        },
        'individual',
        '123',
      );
      expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
        email: 'test@example.com',
        entity_name: 'Updated Entity',
        entity_type: 'llc',
      });
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
    });

    it('should set loading state correctly during save operation', async () => {
      mockFormRef.value = {
        onValidate: vi.fn(),
        isValid: true,
        model: { entity_name: 'Test' },
      };

      await nextTick();

      const savePromise = store.handleSave();
      expect(store.isLoading).toBe(true);

      await savePromise;
      expect(store.isLoading).toBe(false);
    });
  });

  describe('handleSave - Error scenarios', () => {
    it('should not proceed with hubspot submission and navigation when setProfileById fails', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('API Error'));

      await store.handleSave();

      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardEntityInformation');
    });

    it('should not proceed when setProfileByIdState has error', async () => {
      mockRepositoryProfiles.setProfileByIdState.value.error = 'Validation error';

      await store.handleSave();

      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardEntityInformation');
    });

    it('should set loading to false even when error occurs', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('API Error'));

      await store.handleSave();

      expect(store.isLoading).toBe(false);
    });

    it('should not submit to hubspot when setProfileById has error', async () => {
      mockRepositoryProfiles.setProfileByIdState.value.error = 'Error occurred';

      await store.handleSave();

      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
    });
  });

  describe('Form validation integration', () => {
    it('should call onValidate on form ref when handleSave is called', async () => {
      const mockOnValidate = vi.fn();
      mockFormRef.value = {
        onValidate: mockOnValidate,
        isValid: false,
        model: {},
      };

      await store.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
    });

    it('should use form model data when calling setProfileById', async () => {
      mockFormRef.value = {
        onValidate: vi.fn(),
        isValid: true,
        model: {
          entity_name: 'Custom Entity',
          entity_type: 'partnership',
          tax_id: '987654321',
        },
      };

      await nextTick();

      await store.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        {
          entity_name: 'Custom Entity',
          entity_type: 'partnership',
          tax_id: '987654321',
        },
        'individual',
        '123',
      );
    });
  });

  describe('Hubspot integration', () => {
    it('should submit form data to hubspot with correct parameters', async () => {
      mockFormRef.value = {
        onValidate: vi.fn(),
        isValid: true,
        model: {
          entity_name: 'Hubspot Test Entity',
          entity_type: 'corporation',
        },
      };

      await nextTick();

      await store.handleSave();

      expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
        email: 'test@example.com',
        entity_name: 'Hubspot Test Entity',
        entity_type: 'corporation',
      });
    });

    it('should not submit to hubspot when there is an error', async () => {
      mockRepositoryProfiles.setProfileByIdState.value.error = 'API Error';

      await store.handleSave();

      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to account page after successful save', async () => {
      mockFormRef.value = {
        onValidate: vi.fn(),
        isValid: true,
        model: { entity_name: 'Test' },
      };

      await store.handleSave();

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
    });

    it('should not navigate when validation fails', async () => {
      await store.handleSave();

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Repository calls', () => {
    beforeEach(() => {
      mockRepositoryProfiles.setProfileById.mockResolvedValue(undefined);
      mockRepositoryProfiles.getProfileById.mockResolvedValue(undefined);
      mockRepositoryProfiles.setProfileByIdState.value.error = null;
    });

    it('should call getProfileById after successful setProfileById', async () => {
      const isValid = ref(true);
      mockFormRef.value = {
        onValidate: vi.fn(),
        get isValid() { return isValid.value; },
        model: { entity_name: 'Test' },
      };

      store = useFormEntityInformation();

      await nextTick();
      await store.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
    });

    it('should not call getProfileById when form validation fails', async () => {
      const mockForm = {
        onValidate: vi.fn(),
        isValid: false,
        model: { entity_name: 'Test' },
      };
      
      mockFormRef.value = mockForm;

      await nextTick();

      await store.handleSave();

      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardEntityInformation');
    });

    it('should not call getProfileById when setProfileById fails', async () => {
      mockFormRef.value = {
        onValidate: vi.fn(),
        isValid: true,
        model: { entity_name: 'Test' },
      };

      await nextTick();

      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('API Error'));

      await store.handleSave();

      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
    });
  });

}); 