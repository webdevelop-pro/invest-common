import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { ref, Ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

let mockSelectedUserProfileData: Ref<{
  id: number;
  kyc_status: string;
  isKycNone: boolean;
  isKycNew: boolean;
  isKycPending: boolean;
  isKycInProgress: boolean;
  isKycDeclined: boolean;
}>;
let mockSelectedUserProfileId: Ref<number>;
let mockUserLoggedIn: Ref<boolean>;
let mockGetWalletState: Ref<{
  loading: boolean;
  data: { isWalletStatusAnyError: boolean; isWalletStatusCreated: boolean };
  error: boolean;
}>;
let mockGetProfileByIdState: Ref<{ loading: boolean }>;

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData: mockSelectedUserProfileData,
    selectedUserProfileId: mockSelectedUserProfileId,
  }),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn: mockUserLoggedIn,
  }),
}));

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    getWalletState: mockGetWalletState,
    getWalletByProfile: vi.fn(),
    canLoadWalletData: ref(true),
  }),
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({
    getProfileByIdState: mockGetProfileByIdState,
  }),
}));

vi.mock('InvestCommon/domain/config/links.ts', () => ({
  urlContactUs: 'https://test/contact-us',
}));

let useWalletMain: any;

describe('useWalletMain', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockSelectedUserProfileData = ref({
      id: 1,
      kyc_status: 'approved',
      isKycNone: false,
      isKycNew: false,
      isKycPending: false,
      isKycInProgress: false,
      isKycDeclined: false,
      isTypeSdira: false,
      isTypeSolo401k: false,
    });
    mockSelectedUserProfileId = ref(1);
    mockUserLoggedIn = ref(true);
    mockGetWalletState = ref({
      loading: false,
      data: {
        isWalletStatusAnyError: false,
        isWalletStatusCreated: false,
      },
      error: false,
    });
    mockGetProfileByIdState = ref({ loading: false });
    const module = await import('../useWalletMain');
    useWalletMain = module.useWalletMain;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('isWalletError is true when wallet has error', () => {
    mockGetWalletState.value.data.isWalletStatusAnyError = true;
    const store = useWalletMain();
    expect(store.isWalletError.value).toBe(true);
  });

  it('isWalletError is true when wallet repository has error', () => {
    mockGetWalletState.value.error = true;
    const store = useWalletMain();
    expect(store.isWalletError.value).toBe(true);
  });

  it('isKYCNeedToPass is true when KYC is needed', () => {
    mockSelectedUserProfileData.value.isKycNone = true;
    const store = useWalletMain();
    expect(store.isKYCNeedToPass.value).toBe(true);
  });

  it('isKYCInProgress is true when KYC is in progress', () => {
    mockSelectedUserProfileData.value.isKycInProgress = true;
    const store = useWalletMain();
    expect(store.isKYCInProgress.value).toBe(true);
  });

  it('isWalletCreated is true when wallet is created', () => {
    mockGetWalletState.value.data.isWalletStatusCreated = true;
    const store = useWalletMain();
    expect(store.isWalletCreated.value).toBe(true);
  });

  it('isError is true when KYC is declined', () => {
    mockSelectedUserProfileData.value.isKycDeclined = true;
    const store = useWalletMain();
    expect(store.isError.value).toBe(true);
  });

  it('isError is true when wallet has error', () => {
    mockGetWalletState.value.data.isWalletStatusAnyError = true;
    const store = useWalletMain();
    expect(store.isError.value).toBe(true);
  });

  it('isAlertShow is true when KYC is needed', () => {
    mockSelectedUserProfileData.value.isKycNone = true;
    const store = useWalletMain();
    expect(store.isAlertShow.value).toBe(true);
  });

  it('isAlertShow is true when KYC is in progress', () => {
    mockSelectedUserProfileData.value.isKycInProgress = true;
    const store = useWalletMain();
    expect(store.isAlertShow.value).toBe(true);
  });

  it('isAlertShow is true when wallet is created', () => {
    mockGetWalletState.value.data.isWalletStatusCreated = true;
    const store = useWalletMain();
    expect(store.isAlertShow.value).toBe(true);
  });

  it('isAlertShow is true when there is an error', () => {
    mockSelectedUserProfileData.value.isKycDeclined = true;
    const store = useWalletMain();
    expect(store.isAlertShow.value).toBe(true);
  });

  it('isAlertShow is true when profile type is SDIRA', () => {
    mockSelectedUserProfileData.value.isTypeSdira = true;
    const store = useWalletMain();
    expect(store.isAlertShow.value).toBe(true);
  });

  it('isAlertShow is true when profile type is Solo401k', () => {
    mockSelectedUserProfileData.value.isTypeSolo401k = true;
    const store = useWalletMain();
    expect(store.isAlertShow.value).toBe(true);
  });

  it('isAlertShow is false when profile is loading', () => {
    mockSelectedUserProfileData.value.isKycNone = true;
    mockGetProfileByIdState.value.loading = true;
    const store = useWalletMain();
    expect(store.isAlertShow.value).toBe(false);
  });

  it('isTopTextShow is true when no wallet error and KYC not declined', () => {
    const store = useWalletMain();
    expect(store.isTopTextShow.value).toBe(true);
  });

  it('isTopTextShow is false when wallet has error', () => {
    mockGetWalletState.value.data.isWalletStatusAnyError = true;
    const store = useWalletMain();
    expect(store.isTopTextShow.value).toBe(false);
  });

  it('isTopTextShow is false when KYC is declined', () => {
    mockSelectedUserProfileData.value.isKycDeclined = true;
    const store = useWalletMain();
    expect(store.isTopTextShow.value).toBe(false);
  });

  it('isTopTextShow is false when profile type is SDIRA', () => {
    mockSelectedUserProfileData.value.isTypeSdira = true;
    const store = useWalletMain();
    expect(store.isTopTextShow.value).toBe(false);
  });

  it('showWalletTable is true when not SDIRA and no wallet error', () => {
    const store = useWalletMain();
    expect(store.showWalletTable.value).toBe(true);
  });

  it('showWalletTable is false when profile type is SDIRA', () => {
    mockSelectedUserProfileData.value.isTypeSdira = true;
    const store = useWalletMain();
    expect(store.showWalletTable.value).toBe(false);
  });

  it('showWalletTable is false when wallet has error', () => {
    mockGetWalletState.value.data.isWalletStatusAnyError = true;
    const store = useWalletMain();
    expect(store.showWalletTable.value).toBe(false);
  });

  it('isAlertType returns "info" when wallet is created', () => {
    mockGetWalletState.value.data.isWalletStatusCreated = true;
    const store = useWalletMain();
    expect(store.isAlertType.value).toBe('info');
  });

  it('isAlertType returns "error" when there is an error', () => {
    mockSelectedUserProfileData.value.isKycDeclined = true;
    const store = useWalletMain();
    expect(store.isAlertType.value).toBe('error');
  });

  it('isAlertText returns error message when KYC is declined', () => {
    mockSelectedUserProfileData.value.isKycDeclined = true;
    const store = useWalletMain();
    expect(store.isAlertText.value).toContain('contact us');
  });

  it('isAlertText returns wallet creation message when wallet is created', () => {
    mockGetWalletState.value.data.isWalletStatusCreated = true;
    const store = useWalletMain();
    expect(store.isAlertText.value).toContain('contact us');
  });

  it('isAlertText returns KYC link when KYC is needed', () => {
    mockSelectedUserProfileData.value.isKycNone = true;
    const store = useWalletMain();
    expect(store.isAlertText.value).toContain('pass KYC');
  });

  it('isAlertText returns KYC in progress message', () => {
    mockSelectedUserProfileData.value.isKycInProgress = true;
    const store = useWalletMain();
    expect(store.isAlertText.value).toContain('KYC is in progress');
  });

  it('alertTitle returns KYC verification message when KYC is needed', () => {
    mockSelectedUserProfileData.value.isKycNone = true;
    const store = useWalletMain();
    expect(store.alertTitle.value).toBe('Identity verification is needed. ');
  });

  it('alertTitle returns wallet creation message when wallet is created', () => {
    mockGetWalletState.value.data.isWalletStatusCreated = true;
    const store = useWalletMain();
    expect(store.alertTitle.value).toBe('Your wallet is being created and verified.');
  });

  it('alertButtonText returns "Verify Identity" when KYC is needed', () => {
    mockSelectedUserProfileData.value.isKycNone = true;
    const store = useWalletMain();
    expect(store.alertButtonText.value).toBe('Verify Identity');
  });

  it('alertButtonText returns undefined when KYC is not needed', () => {
    const store = useWalletMain();
    expect(store.alertButtonText.value).toBeUndefined();
  });

  it('onAlertButtonClick navigates to KYC if needed', () => {
    mockSelectedUserProfileData.value.isKycNone = true;
    const store = useWalletMain();
    store.onAlertButtonClick();
    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'ROUTE_SUBMIT_KYC', params: { profileId: 1 } });
  });

  it('onAlertButtonClick does nothing when KYC is not needed', () => {
    const store = useWalletMain();
    store.onAlertButtonClick();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('FUNDING_TAB_INFO is exported', () => {
    const store = useWalletMain();
    expect(store.FUNDING_TAB_INFO).toBeDefined();
    expect(store.FUNDING_TAB_INFO.title).toBe('Wallet');
  });
});
