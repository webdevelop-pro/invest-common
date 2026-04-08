import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const openDialogMock = vi.fn();
const maybeOpenAfterKycMock = vi.fn();
const startFlowForProfileMock = vi.fn();

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

const getEvmWalletStateRef = ref({
  data: {
    isStatusAnyError: false,
    isStatusCreated: false,
    isStatusVerified: true,
  },
  loading: false,
  error: null as Error | null,
});
const selectedUserProfileDataRef = ref({
  id: 1,
  isKycApproved: true,
  isKycNone: false,
  isKycNew: false,
  isKycPending: false,
  isKycInProgress: false,
  isKycDeclined: false,
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
    createLinkExchangeState: ref({ loading: false, error: null, data: null }),
    createLinkProcessState: ref({ loading: false, error: null, data: null }),
  }),
}));
vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
  }),
}));
vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({
    getProfileByIdState: getProfileByIdStateRef,
  }),
}));
vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn: ref(true),
    userSessionTraits: ref({ email: 'wallet@example.com' }),
  }),
}));
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData: selectedUserProfileDataRef,
    selectedUserProfileId: selectedUserProfileIdRef,
    selectedUserProfileType: ref('individual'),
  }),
}));
vi.mock('InvestCommon/features/wallet/store/useWalletAuth', () => ({
  useWalletAuth: () => ({
    openDialog: openDialogMock,
    maybeOpenAfterKyc: maybeOpenAfterKycMock,
    startFlowForProfile: startFlowForProfileMock,
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
    mockPush.mockClear();
    openDialogMock.mockClear();
    maybeOpenAfterKycMock.mockClear();
    startFlowForProfileMock.mockClear();
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

  it('does not show the wallet-created info alert for crypto created status', () => {
    getEvmWalletStateRef.value.data!.isStatusCreated = true;
    getEvmWalletStateRef.value.data!.isStatusVerified = false;
    selectedUserProfileDataRef.value!.isKycApproved = true;
    getWalletStateRef.value.data = {
      ...getWalletStateRef.value.data,
      isSomeLinkedBankAccount: true,
    };

    const api = useWalletAlert();

    expect(api.isAlertShow.value).toBe(false);
    expect(api.alertTitle.value).toBeUndefined();
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

  it('shows wallet setup alert when backend says the user needs to create a wallet', () => {
    getEvmWalletStateRef.value = {
      data: undefined,
      loading: false,
      error: new Error('User need to create wallet'),
    };
    selectedUserProfileDataRef.value!.isKycApproved = true;

    const api = useWalletAlert();

    expect(api.isAlertShow.value).toBe(true);
    expect(api.isAlertType.value).toBe('info');
    expect(api.alertTitle.value).toContain('Set up your wallet');
    expect(api.alertButtonText.value).toBe('Set Up Wallet');
    expect(api.isAlertText.value).toContain('has not been created');
    expect(api.showTable.value).toBe(false);
    expect(api.isWalletBlocked.value).toBe(false);
  });

  it('opens wallet auth when the wallet setup alert CTA is clicked', () => {
    getEvmWalletStateRef.value = {
      data: undefined,
      loading: false,
      error: new Error('User need to create wallet'),
    };
    selectedUserProfileDataRef.value = {
      ...selectedUserProfileDataRef.value,
      isKycApproved: true,
      name: 'Primary Profile',
      data: {
        full_account_name: 'Primary Profile LLC',
      },
      wallet: {
        status: undefined,
      },
    };

    const api = useWalletAlert();
    api.onAlertButtonClick();

    expect(openDialogMock).not.toHaveBeenCalled();
    expect(maybeOpenAfterKycMock).not.toHaveBeenCalled();
    expect(startFlowForProfileMock).toHaveBeenCalledWith({
      profileId: 1,
      isKycApproved: true,
      profileType: 'individual',
      profileName: 'Primary Profile',
      fullAccountName: 'Primary Profile LLC',
      userEmail: 'wallet@example.com',
      walletStatus: undefined,
    });
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
});
