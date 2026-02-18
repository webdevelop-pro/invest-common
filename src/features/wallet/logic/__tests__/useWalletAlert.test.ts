import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const getWalletStateRef = ref({
  data: {
    id: 1,
    isWalletStatusAnyError: false,
    isWalletStatusCreated: false,
    isWalletStatusVerified: true,
    isSomeLinkedBankAccount: false,
  },
  loading: false,
  error: null as Error | null,
});
const canLoadWalletDataRef = ref(true);

const getEvmWalletStateRef = ref({
  data: {
    isStatusAnyError: false,
    isStatusCreated: false,
    isStatusVerified: true,
  },
  loading: false,
  error: null as Error | null,
});
const canLoadEvmWalletDataRef = ref(true);
const selectedUserProfileDataRef = ref({
  id: 1,
  isKycNone: false,
  isKycNew: false,
  isKycPending: false,
  isKycInProgress: false,
  isKycDeclined: false,
  isKycApproved: false,
  isTypeSdira: false,
  isTypeSolo401k: false,
  isTypeTrust: false,
  isTypeEntity: false,
});
const selectedUserProfileIdRef = ref(1);
const getProfileByIdStateRef = ref({ loading: false });

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    getWalletState: getWalletStateRef,
    canLoadWalletData: canLoadWalletDataRef,
    // Minimal mocks for Plaid link states used in useWalletAlert
    createLinkExchangeState: ref({ loading: false, error: null, data: null }),
    createLinkProcessState: ref({ loading: false, error: null, data: null }),
  }),
}));
vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    canLoadEvmWalletData: canLoadEvmWalletDataRef,
  }),
}));
vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({
    getProfileByIdState: getProfileByIdStateRef,
  }),
}));
vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({ userLoggedIn: ref(true) }),
}));
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData: selectedUserProfileDataRef,
    selectedUserProfileId: selectedUserProfileIdRef,
  }),
}));
const mockPush = vi.fn();
const mockRoute = {
  fullPath: '/profile/1/wallet',
};
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
}));

import { useWalletAlert } from '../useWalletAlert';

describe('useWalletAlert', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getWalletStateRef.value = {
      data: {
        id: 1,
        isWalletStatusAnyError: false,
        isWalletStatusCreated: false,
        isWalletStatusVerified: true,
        isSomeLinkedBankAccount: false,
      },
      loading: false,
      error: null,
    };
    getEvmWalletStateRef.value = {
      data: { isStatusAnyError: false, isStatusCreated: false, isStatusVerified: true },
      loading: false,
      error: null,
    };
    selectedUserProfileDataRef.value = {
      id: 1,
      isKycNone: false,
      isKycNew: false,
      isKycPending: false,
      isKycInProgress: false,
      isKycDeclined: false,
      isKycApproved: false,
      isTypeSdira: false,
      isTypeSolo401k: false,
      isTypeTrust: false,
      isTypeEntity: false,
    };
    selectedUserProfileIdRef.value = 1;
    getProfileByIdStateRef.value = { loading: false };
    canLoadWalletDataRef.value = true;
    canLoadEvmWalletDataRef.value = true;
    mockPush.mockClear();
  });

  it('returns all alert API fields', () => {
    const api = useWalletAlert();
    expect(api.isAlertShow).toBeDefined();
    expect(api.isAlertType).toBeDefined();
    expect(api.isAlertText).toBeDefined();
    expect(api.isWalletBlocked).toBeDefined();
    expect(api.showTable).toBeDefined();
    expect(api.isTopTextShow).toBeDefined();
    expect(api.alertTitle).toBeDefined();
    expect(api.alertButtonText).toBeDefined();
    expect(api.onAlertButtonClick).toBeDefined();
  });

  it('hides alert and shows table when KYC approved and wallets verified', () => {
    selectedUserProfileDataRef.value = {
      id: 1,
      isKycNone: false,
      isKycNew: false,
      isKycPending: false,
      isKycInProgress: false,
      isKycDeclined: false,
      isKycApproved: true,
      isTypeSdira: false,
      isTypeSolo401k: false,
      isTypeTrust: false,
      isTypeEntity: false,
    };
    const api = useWalletAlert();
    expect(api.isAlertShow.value).toBe(true);
    expect(api.isAlertType.value).toBe('info');
    expect(api.isAlertText.value).toContain('connect a bank account');
    expect(api.showTable.value).toBe(true);
    expect(api.isTopTextShow.value).toBe(true);
  });

  it('hides alert when bank accounts are connected', () => {
    selectedUserProfileDataRef.value.isKycApproved = true;
    getWalletStateRef.value.data = {
      ...getWalletStateRef.value.data,
      isWalletStatusAnyError: false,
      isWalletStatusCreated: false,
      isWalletStatusVerified: true,
      isSomeLinkedBankAccount: true,
    };
    const api = useWalletAlert();
    expect(api.isAlertShow.value).toBe(false);
    expect(api.isWalletBlocked.value).toBe(false);
  });

  it('shows info alert when wallet is being created', () => {
    getEvmWalletStateRef.value.data!.isStatusCreated = true;
    getEvmWalletStateRef.value.data!.isStatusVerified = false;
    const api = useWalletAlert();
    expect(api.isAlertShow.value).toBe(true);
    expect(api.isAlertType.value).toBe('info');
    expect(api.isAlertText.value).toContain('usually takes a few moments');
    expect(api.alertTitle.value).toContain('wallet is being created');
  });

  it('shows KYC needed alert when profile is KYC pending', () => {
    selectedUserProfileDataRef.value!.isKycPending = true;
    const api = useWalletAlert();
    expect(api.isAlertShow.value).toBe(true);
    expect(api.isAlertType.value).toBe('error');
    expect(api.isWalletBlocked.value).toBe(true);
    expect(api.isAlertText.value).toContain('pass KYC');
    expect(api.alertTitle.value).toContain('Identity verification');
    expect(api.alertButtonText.value).toBe('Verify Identity');
  });

  it('onAlertButtonClick navigates to KYC when KYC needed', () => {
    selectedUserProfileDataRef.value!.isKycPending = true;
    const api = useWalletAlert();
    api.onAlertButtonClick();
    expect(mockPush).toHaveBeenCalledWith({
      name: 'ROUTE_SUBMIT_KYC',
      params: { profileId: 1 },
      query: { redirect: '/profile/1/wallet' },
    });
  });

  it('shows error alert when wallet has error', () => {
    getEvmWalletStateRef.value.data!.isStatusAnyError = true;
    const api = useWalletAlert();
    expect(api.isAlertShow.value).toBe(true);
    expect(api.isAlertText.value).toContain('contact us');
  });

  it('sets isDataLoading only for real loading or initial load when wallets can load', () => {
    // Baseline: both have data and nothing is loading → not loading
    let api = useWalletAlert();
    expect(api.isDataLoading.value).toBe(false);

    // Explicit loading flags from repositories
    getWalletStateRef.value = {
      ...getWalletStateRef.value,
      loading: true,
    };
    api = useWalletAlert();
    expect(api.isDataLoading.value).toBe(true);

    getWalletStateRef.value = {
      ...getWalletStateRef.value,
      loading: false,
    };
    getEvmWalletStateRef.value = {
      ...getEvmWalletStateRef.value,
      loading: true,
    };
    api = useWalletAlert();
    expect(api.isDataLoading.value).toBe(true);

    // Initial state: no fiat or evm data, canLoad* true, no errors → loading
    getWalletStateRef.value = { data: undefined, loading: false, error: null };
    getEvmWalletStateRef.value = { data: undefined, loading: false, error: null };
    api = useWalletAlert();
    expect(api.isDataLoading.value).toBe(true);

    // Once fiat data is present, even if evm is still missing, we stop
    // treating it as loading at the alert level
    getWalletStateRef.value = {
      data: {
        id: 1,
        isWalletStatusAnyError: false,
        isWalletStatusCreated: false,
        isWalletStatusVerified: true,
        isSomeLinkedBankAccount: false,
      },
      loading: false,
      error: null,
    };
    getEvmWalletStateRef.value = { data: undefined, loading: false, error: null };
    api = useWalletAlert();
    expect(api.isDataLoading.value).toBe(false);
  });

  it('does not treat missing data as loading when wallets cannot load (e.g. before KYC)', () => {
    // Simulate case where wallets are not allowed to load yet
    canLoadWalletDataRef.value = false;
    canLoadEvmWalletDataRef.value = false;
    getWalletStateRef.value = { data: undefined, loading: false, error: null };
    getEvmWalletStateRef.value = { data: undefined, loading: false, error: null };

    const api = useWalletAlert();

    expect(api.isDataLoading.value).toBe(false);
  });
});
