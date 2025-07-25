import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const mockPlaidHandler = {
  open: vi.fn(),
};
globalThis.window = Object.assign(globalThis.window || {}, {
  Plaid: { create: vi.fn(() => mockPlaidHandler) },
});

describe('useWalletBankAccounts composable', () => {
  let composable: any;
  let walletRepositoryMock: any;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    walletRepositoryMock = {
      getWalletState: ref({
        loading: false,
        error: null,
        data: {
          funding_source: [],
          isWalletStatusAnyError: false,
          isWalletStatusCreated: false,
        },
      }),
      deleteLinkedAccountState: ref({ loading: false, error: null }),
      walletId: ref(123),
      createLinkExchangeState: ref({ loading: false, error: null, data: { accounts: [], access_token: 'token' } }),
      createLinkTokenState: ref({ loading: false, error: null, data: { link_token: 'link-token' } }),
      deleteLinkedAccount: vi.fn().mockResolvedValue({}),
      getWalletByProfile: vi.fn().mockResolvedValue({}),
      createLinkExchange: vi.fn().mockResolvedValue({ accounts: [], access_token: 'token' }),
      createLinkProcess: vi.fn().mockResolvedValue({}),
      createLinkToken: vi.fn().mockResolvedValue({ link_token: 'link-token' }),
    };
    vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
      useRepositoryWallet: vi.fn(() => walletRepositoryMock),
    }));
    const module = await import('../useWalletBankAccounts');
    composable = module.useWalletBankAccounts();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Computed Properties', () => {
    it('should compute isCanAddBankAccount as true when all conditions met', () => {
      composable.setProfileContext({ id: 1, kyc_status: 'approved' }, true);
      walletRepositoryMock.walletId.value = 123;
      walletRepositoryMock.getWalletState.value.data.isWalletStatusAnyError = false;
      walletRepositoryMock.getWalletState.value.data.isWalletStatusCreated = false;
      expect(composable.isCanAddBankAccount.value).toBe(true);
    });
    it('should compute isCanAddBankAccount as false if kyc_status is not approved', () => {
      composable.setProfileContext({ id: 1, kyc_status: 'pending' }, true);
      expect(composable.isCanAddBankAccount.value).toBe(false);
    });
    it('should compute isCanAddBankAccount as false if walletId is null', () => {
      composable.setProfileContext({ id: 1, kyc_status: 'approved' }, true);
      walletRepositoryMock.walletId.value = null;
      expect(composable.isCanAddBankAccount.value).toBe(false);
    });
    it('should compute isCanAddBankAccount as false if isWalletAnyError is true', () => {
      composable.setProfileContext({ id: 1, kyc_status: 'approved' }, true);
      walletRepositoryMock.getWalletState.value.data.isWalletStatusAnyError = true;
      expect(composable.isCanAddBankAccount.value).toBe(false);
    });
  });

  describe('onDeleteAccountClick', () => {
    it('should not call deleteLinkedAccount if loading', async () => {
      walletRepositoryMock.deleteLinkedAccountState.value.loading = true;
      composable.setProfileContext({ id: 1, kyc_status: 'approved' }, true);
      await composable.onDeleteAccountClick('abc');
      expect(walletRepositoryMock.deleteLinkedAccount).not.toHaveBeenCalled();
    });
    it('should call deleteLinkedAccount and getWalletByProfile if profileId > 0', async () => {
      composable.setProfileContext({ id: 1, kyc_status: 'approved' }, true);
      await composable.onDeleteAccountClick('abc');
      expect(walletRepositoryMock.deleteLinkedAccount).toHaveBeenCalledWith(1, { funding_source_id: 'abc' });
      expect(walletRepositoryMock.getWalletByProfile).toHaveBeenCalledWith(1);
    });
    it('should not call deleteLinkedAccount if profileId <= 0', async () => {
      composable.setProfileContext({ id: 0, kyc_status: 'approved' }, true);
      await composable.onDeleteAccountClick('abc');
      expect(walletRepositoryMock.deleteLinkedAccount).not.toHaveBeenCalled();
    });
  });

  describe('Plaid Integration', () => {
    it('should not call createLinkToken if link_token exists', async () => {
      composable.setProfileContext({ id: 1, kyc_status: 'approved' }, true);
      walletRepositoryMock.createLinkTokenState.value.data = { link_token: 'exists' };
      await composable.onAddAccountClick();
      expect(walletRepositoryMock.createLinkToken).not.toHaveBeenCalled();
    });
  });
});
