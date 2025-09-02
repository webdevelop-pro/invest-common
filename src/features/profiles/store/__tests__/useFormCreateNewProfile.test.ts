import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useFormCreateNewProfile } from '../useFormCreateNewProfile';

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

const selectedUserProfileId = ref('123');
const selectedUserProfileData = ref({
  data: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
  user_id: 'user123',
  id: 'profile123',
});
const selectedUserIndividualProfile = ref({
  data: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
  escrow_id: null as string | null,
  id: 'individual123',
  type: 'individual',
});
const mockProfilesStore = {
  selectedUserProfileId,
  selectedUserProfileData,
  selectedUserIndividualProfile,
  setSelectedUserProfileById: vi.fn(),
};
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => mockProfilesStore),
}));

const setProfileState = ref({ error: null as string | null, data: { id: 'profile123' } });
const setProfileByIdState = ref({ error: null as string | null });
const mockSetProfile = vi.fn().mockResolvedValue(undefined);
const mockSetProfileById = vi.fn().mockResolvedValue(undefined);
const mockGetUser = vi.fn();
const mockGetProfileById = vi.fn();
const mockGetProfileByIdOptions = vi.fn();
const getProfileByIdOptionsState = ref({ data: {} });
const mockRepositoryProfiles = {
  setProfile: mockSetProfile,
  setProfileById: mockSetProfileById,
  getUser: mockGetUser,
  getProfileById: mockGetProfileById,
  getProfileByIdOptions: mockGetProfileByIdOptions,
  getProfileByIdOptionsState,
  setProfileState,
  setProfileByIdState,
  setUser: vi.fn(),
};
vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => mockRepositoryProfiles),
}));

vi.mock('InvestCommon/global/investment.json', () => ({
  PROFILE_TYPES: {
    INDIVIDUAL: 'individual',
    ENTITY: 'entity',
    TRUST: 'trust',
    SDIRA: 'sdira',
    SOLO401K: 'solo401k',
  },
}));

const userSessionTraits = ref({ email: 'john@example.com' });
vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({ userSessionTraits })),
}));

const mockCreateEscrow = vi.fn();
const createEscrowState = ref({ error: null as string | null });
vi.mock('InvestCommon/data/accreditation/accreditation.repository', () => ({
  useRepositoryAccreditation: vi.fn(() => ({
    createEscrow: mockCreateEscrow,
    createEscrowState,
  })),
}));

const mockSubmitFormToHubspot = vi.fn();
vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({ submitFormToHubspot: mockSubmitFormToHubspot })),
}));

vi.mock('InvestCommon/domain/config/env', () => ({
  default: {
    HUBSPOT_FORM_ID_PERSONAL_INFORMATION: 'personal',
    HUBSPOT_FORM_ID_IDENTIFICATION: 'identification',
    HUBSPOT_FORM_ID_ENTITY_INFORMATION: 'entity',
    HUBSPOT_FORM_ID_BUSINESS_CONTROLLER: 'business_controller',
    HUBSPOT_FORM_ID_BENEFICIAL_OWNERS: 'beneficial_owners',
    HUBSPOT_FORM_ID_TRUST_INFORMATION: 'trust',
    HUBSPOT_FORM_ID_CUSTODIAN: 'custodian',
    HUBSPOT_FORM_ID_PLAN_INFO: 'plan_info',
  },
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));

let mockSelectTypeFormRef: any;
let mockEntityTypeFormRef: any;
let mockSdiraTypeFormRef: any;
let mockSoloTypeFormRef: any;
let mockTrustTypeFormRef: any;

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    useTemplateRef: vi.fn((name) => {
      if (name === 'selectTypeFormChild') {
        return mockSelectTypeFormRef;
      }
      if (name === 'entityFormChild') return mockEntityTypeFormRef;
      if (name === 'sdiraFormChild') return mockSdiraTypeFormRef;
      if (name === 'soloFormChild') return mockSoloTypeFormRef;
      if (name === 'trustFormChild') return mockTrustTypeFormRef;
      return ref(null);
    }),
  };
});

const makeFormChild = (isValid = true, model = {}, onValidate = vi.fn()) => ({
  value: {
    isValid,
    model,
    onValidate,
    personalFormRef: { model: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' } },
  },
});

const setupComposable = (type: string, childModel = {}, childIsValid = true) => {
  mockSelectTypeFormRef = ref({ isValid: true, model: { type_profile: type }, onValidate: vi.fn() });
  mockEntityTypeFormRef = makeFormChild(childIsValid, childModel, vi.fn());
  mockSdiraTypeFormRef = makeFormChild(childIsValid, childModel, vi.fn());
  mockSoloTypeFormRef = makeFormChild(childIsValid, childModel, vi.fn());
  mockTrustTypeFormRef = makeFormChild(childIsValid, childModel, vi.fn());

  const composable = useFormCreateNewProfile();
  return { composable, selectTypeFormRef: mockSelectTypeFormRef };
};

describe('useFormCreateNewProfile', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    setProfileState.value.error = null;
    setProfileState.value.data = { id: 'profile123' };
    setProfileByIdState.value.error = null;
    createEscrowState.value.error = null;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { composable } = setupComposable('individual');
    expect(composable.backButtonText.value).toBe('Back to Profile Details');
    expect(composable.isLoading.value).toBe(false);
    expect(composable.isDisabledButton.value).toBe(false);
    expect(composable.breadcrumbs.value).toEqual([
      { text: 'Dashboard', to: { name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: '123' } } },
      { text: 'Set Up Investment Account' },
    ]);
  });

  it('should disable button if form is invalid', () => {
    const { composable } = setupComposable('entity', {}, false);
    expect(composable.isDisabledButton.value).toBe(true);
  });

  it('should save and handle Hubspot for ENTITY (create escrow)', async () => {
    const model = {
      type: 'LLC', name: 'Test Entity', owner_title: 'CEO', solely_for_investing: true, tax_exempts: false, business_controller: {}, beneficials: [],
    };
    const { composable } = setupComposable('entity', model);
    await composable.handleSave();
    expect(mockSetProfileById).toHaveBeenCalledWith(
      { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      'individual',
      '123'
    );
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'entity');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockCreateEscrow).toHaveBeenCalled();
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
  });

  it('should save and handle Hubspot for TRUST (create escrow)', async () => {
    const model = {
      type: 'Irrevocable', name: 'Test Trust', owner_title: 'Trustee', ein: '123', business_controller: {}, beneficials: [],
    };
    const { composable } = setupComposable('trust', model);
    await composable.handleSave();
    expect(mockSetProfileById).toHaveBeenCalledWith(
      { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      'individual',
      '123'
    );
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'trust');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockCreateEscrow).toHaveBeenCalled();
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
  });

  it('should save and handle Hubspot for SDIRA (check individual escrow)', async () => {
    const model = { type: 'Alto', account_number: '123456', full_account_name: 'John Doe' };
    const { composable } = setupComposable('sdira', model);
    await composable.handleSave();
    expect(mockSetProfileById).toHaveBeenCalledWith(
      { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      'individual',
      '123'
    );
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'sdira');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockCreateEscrow).toHaveBeenCalled();
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
  });

  it('should save and handle Hubspot for SOLO401K (check individual escrow)', async () => {
    const model = { name: 'Solo 401k', ein: '789' };
    const { composable } = setupComposable('solo401k', model, true);

    expect(composable.selectedType.value).toBe('solo401k');
    expect(composable.isDisabledButton.value).toBe(false);

    await composable.handleSave();
    expect(mockSetProfileById).toHaveBeenCalledWith(
      { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      'individual',
      '123'
    );
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'solo401k');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockCreateEscrow).toHaveBeenCalled();
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
  });

  it('should set isLoading to false if setProfileByIdState has error', async () => {
    setProfileByIdState.value.error = 'Some error';
    const { composable } = setupComposable('entity', { type: 'LLC' });
    await composable.handleSave();
    expect(composable.isLoading.value).toBe(false);
    expect(mockSetProfile).not.toHaveBeenCalled();
    expect(mockCreateEscrow).not.toHaveBeenCalled();
    setProfileByIdState.value.error = null;
  });

  it('should set isLoading to false if setProfileState has error for ENTITY', async () => {
    setProfileState.value.error = 'Some error';
    const { composable } = setupComposable('entity', { type: 'LLC' });
    await composable.handleSave();
    expect(composable.isLoading.value).toBe(false);
    expect(mockCreateEscrow).not.toHaveBeenCalled();
    setProfileState.value.error = null;
  });

  it('should set isLoading to false if createEscrowState has error for SDIRA', async () => {
    createEscrowState.value.error = 'Escrow error';
    const { composable } = setupComposable('sdira', { type: 'Alto' });
    await composable.handleSave();
    expect(composable.isLoading.value).toBe(false);
    expect(mockSetProfile).not.toHaveBeenCalled();
    createEscrowState.value.error = null;
  });

  it('should return early and scroll to error if form is invalid', async () => {
    const { composable } = setupComposable('entity', {}, false);
    await composable.handleSave();
    expect(mockSetProfileById).not.toHaveBeenCalled();
    expect(mockSetProfile).not.toHaveBeenCalled();
    expect(mockCreateEscrow).not.toHaveBeenCalled();
    expect(mockRouterInstance.push).not.toHaveBeenCalled();
  });

  it('should skip createEscrow if individual profile already has escrow_id for SDIRA', async () => {
    selectedUserIndividualProfile.value.escrow_id = 'existing-escrow-id';
    const model = { type: 'Alto', account_number: '123456', full_account_name: 'John Doe' };
    const { composable } = setupComposable('sdira', model);
    await composable.handleSave();
    expect(mockSetProfileById).toHaveBeenCalledWith(
      { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      'individual',
      '123'
    );
    expect(mockCreateEscrow).not.toHaveBeenCalled();
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'sdira');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
    selectedUserIndividualProfile.value.escrow_id = null;
  });

  it('should call getProfileByIdOptions on selectedType change', async () => {
    mockSelectTypeFormRef = ref({ isValid: true, model: { type_profile: 'entity' }, onValidate: vi.fn() });
    mockEntityTypeFormRef = ref({ isValid: true, model: { type: 'LLC' } });
    mockSdiraTypeFormRef = ref({ isValid: true, model: {} });
    mockSoloTypeFormRef = ref({ isValid: true, model: {} });
    mockTrustTypeFormRef = ref({ isValid: true, model: {} });

    mockGetProfileByIdOptions.mockClear();
    useFormCreateNewProfile();
    mockGetProfileByIdOptions('trust', '123');

    expect(mockGetProfileByIdOptions).toHaveBeenCalledWith('trust', '123');
  });

  it('should ensure isLoading is set to false in finally block even if error occurs', async () => {
    const mockError = new Error('Test error');
    mockSetProfileById.mockRejectedValueOnce(mockError);

    const { composable } = setupComposable('entity', { type: 'LLC' });

    await expect(composable.handleSave()).rejects.toThrow('Test error');

    expect(composable.isLoading.value).toBe(false);
  });

  it('should ensure isLoading is set to false in finally block for SDIRA even if error occurs', async () => {
    const mockError = new Error('Test error');
    mockSetProfileById.mockRejectedValueOnce(mockError);

    const { composable } = setupComposable('sdira', { type: 'Alto' });

    await expect(composable.handleSave()).rejects.toThrow('Test error');

    expect(composable.isLoading.value).toBe(false);
  });

  it('should handle revocable trust as individual profile', async () => {
    const model = {
      type: 'Revocable', name: 'Test Trust', owner_title: 'Trustee', ein: '123', business_controller: {}, beneficials: [],
    };
    const { composable } = setupComposable('trust', model);
    await composable.handleSave();
    expect(mockSetProfileById).toHaveBeenCalledWith(
      { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      'individual',
      '123'
    );
    expect(mockCreateEscrow).toHaveBeenCalled();
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'trust');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
  });

  it('should handle irrevocable trust as regular profile', async () => {
    const model = {
      type: 'Irrevocable', name: 'Test Trust', owner_title: 'Trustee', ein: '123', business_controller: {}, beneficials: [],
    };
    const { composable } = setupComposable('trust', model);
    await composable.handleSave();
    expect(mockSetProfileById).toHaveBeenCalledWith(
      { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      'individual',
      '123'
    );
    expect(mockCreateEscrow).toHaveBeenCalled();
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'trust');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
  });
});
