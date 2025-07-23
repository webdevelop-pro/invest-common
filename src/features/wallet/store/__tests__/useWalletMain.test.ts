import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, Ref } from 'vue';

const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

let mockSelectedUserProfileData: Ref<{ id: number; kyc_status: string }>;
let mockSelectedUserProfileId: Ref<number>;
let mockUserLoggedIn: Ref<boolean>;
let mockGetWalletState: Ref<{
  loading: boolean;
  data: { isWalletStatusAnyError: boolean; isWalletStatusCreated: boolean }
}>;

type StoreRefs = Record<string, unknown>;

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData: mockSelectedUserProfileData,
    selectedUserProfileId: mockSelectedUserProfileId,
  }),
  storeToRefs: (store: StoreRefs) => store,
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn: mockUserLoggedIn,
  }),
  storeToRefs: (store: StoreRefs) => store,
}));

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    getWalletState: mockGetWalletState,
    getWalletByProfile: vi.fn(),
  }),
  storeToRefs: (store: StoreRefs) => store,
}));

vi.mock('InvestCommon/global/links', () => ({
  urlContactUs: 'https://test/contact-us',
}));

let useWalletMain: any;

describe('useWalletMain', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockSelectedUserProfileData = ref({ id: 1, kyc_status: 'approved' });
    mockSelectedUserProfileId = ref(1);
    mockUserLoggedIn = ref(true);
    mockGetWalletState = ref({
      loading: false,
      data: {
        isWalletStatusAnyError: false,
        isWalletStatusCreated: false,
      },
    });
    const module = await import('../useWalletMain');
    useWalletMain = module.useWalletMain;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['approved', false],
    ['pending', true],
    ['declined', true],
  ])('kyc_status is %s → isKYCAlert: %s', (kyc, expected) => {
    mockSelectedUserProfileData.value.kyc_status = kyc as string;
    const store = useWalletMain();
    expect(store.isKYCAlert).toBe(expected);
  });

  it('isWalletAlert is true when isWalletStatusAnyError is true', () => {
    mockGetWalletState.value.data.isWalletStatusAnyError = true;
    const store = useWalletMain();
    expect(store.isWalletAlert).toBe(true);
  });

  it('isAlertShow is true if wallet error', () => {
    mockGetWalletState.value.data.isWalletStatusAnyError = true;
    const store = useWalletMain();
    expect(store.isAlertShow).toBe(true);
  });

  it('alertButtonText is "Verify Identity" only for KYC required', () => {
    mockSelectedUserProfileData.value.kyc_status = 'pending';
    const store = useWalletMain();
    expect(store.alertButtonText).toBe('Verify Identity');
    mockGetWalletState.value.data.isWalletStatusAnyError = true;
    expect(store.alertButtonText).toBeUndefined();
  });

  it('canLoadWalletData is true only if ids match and logged in', () => {
    const store = useWalletMain();
    expect(store.canLoadWalletData).toBe(true);
    mockSelectedUserProfileData.value.id = 2;
    expect(store.canLoadWalletData).toBe(false);
    mockSelectedUserProfileData.value.id = 1;
    mockUserLoggedIn.value = false;
    expect(store.canLoadWalletData).toBe(false);
  });

  it('onAlertButtonClick navigates to KYC if needed', () => {
    mockSelectedUserProfileData.value.kyc_status = 'pending';
    const store = useWalletMain();
    store.onAlertButtonClick();
    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'ROUTE_SUBMIT_KYC', params: { profileId: 1 } });
  });
});
