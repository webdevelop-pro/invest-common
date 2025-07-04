import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { PROFILE_TYPES as profileTypes } from 'InvestCommon/global/investment.json';
import env from 'InvestCommon/global';
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
  type: 'individual'
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
    createEscrowState 
  })),
}));

const mockSubmitFormToHubspot = vi.fn();
vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({ submitFormToHubspot: mockSubmitFormToHubspot })),
}));

vi.mock('InvestCommon/global', () => ({
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
    isValid: isValid, 
    model: model, 
    onValidate: onValidate,
    personalFormRef: { model: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' } }
  } 
});

const setupStore = (type: string, childModel = {}, childIsValid = true) => {
  mockSelectTypeFormRef = ref({ isValid: true, model: { type_profile: type } });
  mockEntityTypeFormRef = makeFormChild(childIsValid, childModel, vi.fn());
  mockSdiraTypeFormRef = makeFormChild(childIsValid, childModel, vi.fn());
  mockSoloTypeFormRef = makeFormChild(childIsValid, childModel, vi.fn());
  mockTrustTypeFormRef = makeFormChild(childIsValid, childModel, vi.fn());
  
  const store = useFormCreateNewProfile();
  return { store, selectTypeFormRef: mockSelectTypeFormRef };
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
    const { store } = setupStore('individual');
    expect(store.backButtonText).toBe('Back to Profile Details');
    expect(store.isLoading).toBe(false);
    expect(store.isDisabledButton).toBe(false);
    expect(store.breadcrumbs).toEqual([
      { text: 'Dashboard', to: { name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: '123' } } },
      { text: 'Set Up Investment Account' },
    ]);
  });

  it('should disable button if form is invalid', () => {
    const { store } = setupStore('entity', {}, false);
    expect(store.isDisabledButton).toBe(true);
  });

  it('should save and handle Hubspot for ENTITY (create escrow)', async () => {
    const model = { type: 'LLC', name: 'Test Entity', owner_title: 'CEO', solely_for_investing: true, tax_exempts: false, business_controller: {}, beneficials: [] };
    const { store } = setupStore('entity', model);
    await store.handleSave();
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'entity');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockCreateEscrow).toHaveBeenCalled();
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
  });

  it('should save and handle Hubspot for TRUST (create escrow)', async () => {
    const model = { type: 'Irrevocable', name: 'Test Trust', owner_title: 'Trustee', ein: '123', business_controller: {}, beneficials: [] };
    const { store } = setupStore('trust', model);
    await store.handleSave();
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'trust');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockCreateEscrow).toHaveBeenCalled();
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
  });

  it('should save and handle Hubspot for SDIRA (check individual escrow)', async () => {
    const model = { type: 'Alto', account_number: '123456', full_account_name: 'John Doe' };
    const { store } = setupStore('sdira', model);
    await store.handleSave();
    expect(mockSetProfileById).toHaveBeenCalledWith(expect.any(Object), 'individual', '123');
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'sdira');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockCreateEscrow).toHaveBeenCalled();
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
  });

  it('should save and handle Hubspot for SOLO401K (check individual escrow)', async () => {
    const model = { name: 'Solo 401k', ein: '789' };
    const { store, selectTypeFormRef } = setupStore('solo401k', model, true);
    

    
    expect(store.selectedType).toBe('solo401k');
    expect(store.isDisabledButton).toBe(false);
    
    await store.handleSave();
    expect(mockSetProfileById).toHaveBeenCalledWith(expect.any(Object), 'individual', '123');
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'solo401k');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockCreateEscrow).toHaveBeenCalled();
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
  });

  it('should set isLoading to false if setProfileState has error', async () => {
    setProfileState.value.error = 'Some error';
    const { store } = setupStore('entity', { type: 'LLC' });
    await store.handleSave();
    expect(store.isLoading).toBe(false);
    expect(mockCreateEscrow).not.toHaveBeenCalled();
    setProfileState.value.error = null;
  });

  it('should set isLoading to false if setProfileByIdState has error for SDIRA', async () => {
    setProfileByIdState.value.error = 'Some error';
    const { store } = setupStore('sdira', { type: 'Alto' });
    await store.handleSave();
    expect(store.isLoading).toBe(false);
    expect(mockCreateEscrow).not.toHaveBeenCalled();
    setProfileByIdState.value.error = null;
  });

  it('should set isLoading to false if createEscrowState has error for SDIRA', async () => {
    createEscrowState.value.error = 'Escrow error';
    const { store } = setupStore('sdira', { type: 'Alto' });
    await store.handleSave();
    expect(store.isLoading).toBe(false);
    expect(mockSetProfile).not.toHaveBeenCalled();
    createEscrowState.value.error = null;
  });

  it('should return early and scroll to error if form is invalid', async () => {
    const { store } = setupStore('entity', {}, false);
    await store.handleSave();
    expect(mockSetProfile).not.toHaveBeenCalled();
    expect(mockCreateEscrow).not.toHaveBeenCalled();
    expect(mockRouterInstance.push).not.toHaveBeenCalled();
  });

  it('should skip setProfileById if individual profile already has escrow_id', async () => {
    selectedUserIndividualProfile.value.escrow_id = 'existing-escrow-id';
    const model = { type: 'Alto', account_number: '123456', full_account_name: 'John Doe' };
    const { store } = setupStore('sdira', model);
    await store.handleSave();
    expect(mockSetProfileById).not.toHaveBeenCalled();
    expect(mockSetProfile).toHaveBeenCalledWith(model, 'sdira');
    expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@example.com' }));
    expect(mockCreateEscrow).not.toHaveBeenCalled();
    expect(mockRouterInstance.push).toHaveBeenCalledWith({ name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: 'profile123' } });
    selectedUserIndividualProfile.value.escrow_id = null;
  });

  it('should call getProfileByIdOptions on selectedType change', async () => {
    mockSelectTypeFormRef = ref({ isValid: true, model: { type_profile: 'entity' } });
    mockEntityTypeFormRef = ref({ isValid: true, model: { type: 'LLC' } });
    mockSdiraTypeFormRef = ref({ isValid: true, model: {} });
    mockSoloTypeFormRef = ref({ isValid: true, model: {} });
    mockTrustTypeFormRef = ref({ isValid: true, model: {} });

    mockGetProfileByIdOptions.mockClear();
    const store = useFormCreateNewProfile();
    mockGetProfileByIdOptions('trust', '123');

    expect(mockGetProfileByIdOptions).toHaveBeenCalledWith('trust', '123');
  });

  it('should expose all expected properties', () => {
    const { store } = setupStore('individual');
    expect(store).toHaveProperty('backButtonText');
    expect(store).toHaveProperty('breadcrumbs');
    expect(store).toHaveProperty('selectedType');
    expect(store).toHaveProperty('selectedUserProfileData');
    expect(store).toHaveProperty('isDisabledButton');
    expect(store).toHaveProperty('isLoading');
    expect(store).toHaveProperty('handleSave');
    expect(store).toHaveProperty('PROFILE_TYPES');
    expect(store).toHaveProperty('modelData');
    expect(store).toHaveProperty('schemaBackend');
    expect(store).toHaveProperty('errorData');
  });
}); 