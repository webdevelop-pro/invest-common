import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const getWalletStateRef = ref({
  data: {
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
  useSessionStore: () => ({ userLoggedIn: ref(true) }),
}));
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData: selectedUserProfileDataRef,
    selectedUserProfileId: selectedUserProfileIdRef,
  }),
}));
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { useWalletAlert } from '../useWalletAlert';

describe('useWalletAlert', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getWalletStateRef.value = {
      data: {
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
  });

  it('returns all alert API fields', () => {
    const api = useWalletAlert();
    expect(api.isAlertShow).toBeDefined();
    expect(api.isAlertType).toBeDefined();
    expect(api.isAlertText).toBeDefined();
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
    });
  });

  it('shows error alert when wallet has error', () => {
    getEvmWalletStateRef.value.data!.isStatusAnyError = true;
    const api = useWalletAlert();
    expect(api.isAlertShow.value).toBe(true);
    expect(api.isAlertText.value).toContain('contact us');
  });
});
