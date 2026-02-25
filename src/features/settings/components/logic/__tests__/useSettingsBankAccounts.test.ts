import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick, ref } from 'vue';
import { useSettingsBankAccounts } from '../useSettingsBankAccounts';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';

// ------------------- LOW-LEVEL MOCKS (HTTP, ENV, PLAID) -------------------

const apiGetMock = vi.fn();
const apiPostMock = vi.fn();
const apiPutMock = vi.fn();
const apiDeleteMock = vi.fn();
const loadPlaidScriptOnceMock = vi.fn().mockResolvedValue(undefined);

vi.mock('InvestCommon/data/service/apiClient', () => {
  class MockApiClient {
    get(path: string, config?: unknown) {
      return apiGetMock(path, config);
    }

    post(path: string, body?: unknown, config?: unknown) {
      return apiPostMock(path, body, config);
    }

    put(path: string, body?: unknown, config?: unknown) {
      return apiPutMock(path, body, config);
    }

    delete(path: string, body?: unknown, config?: unknown) {
      return apiDeleteMock(path, body, config);
    }
  }

  return { ApiClient: MockApiClient };
});

vi.mock('InvestCommon/domain/config/env', () => ({
  default: {
    WALLET_URL: 'https://wallet.example.com',
    EVM_URL: 'https://evm.example.com',
    KRATOS_URL: 'https://kratos.example.com',
  },
}));

vi.mock('InvestCommon/data/plaid/loadPlaidScriptOnce', () => ({
  loadPlaidScriptOnce: loadPlaidScriptOnceMock,
}));

// ------------------- DOMAIN STORES (LIGHTWEIGHT Mocks) -------------------

const selectedUserProfileData = ref<{ id: number; kyc_status?: string; isKycApproved?: boolean } | null>({
  id: 1018,
  kyc_status: 'approved',
  isKycApproved: true,
});
const selectedUserProfileId = ref(1018);

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData,
    selectedUserProfileId,
  }),
}));

const userLoggedIn = ref(true);
vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({ userLoggedIn }),
}));

describe('useSettingsBankAccounts (integration-ish)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    apiGetMock.mockReset();
    apiPostMock.mockReset();
    apiPutMock.mockReset();
    apiDeleteMock.mockReset();
    loadPlaidScriptOnceMock.mockReset();

    selectedUserProfileData.value = {
      id: 1018,
      kyc_status: 'approved',
      isKycApproved: true,
    };
    selectedUserProfileId.value = 1018;
    userLoggedIn.value = true;

    const walletRepository = useRepositoryWallet();

    (walletRepository as any).getWalletState.value = {
      data: {
        id: 1,
        status: 'verified',
        balance: 0,
        pending_incoming_balance: 0,
        pending_outcoming_balance: 0,
        funding_source: [
          { id: 10, bank_name: 'Test Bank', name: 'Checking', last4: '1234', type: 'ach', status: 'verified' },
          { id: 20, bank_name: 'Another Bank', name: 'Savings', last4: '5678', type: 'ach', status: 'verified' },
        ],
        isWalletStatusAnyError: false,
        isWalletStatusCreated: false,
      } as any,
      loading: false,
      error: null,
    };

    (walletRepository as any).deleteLinkedAccountState.value = {
      data: undefined,
      loading: false,
      error: null,
    };
    (walletRepository as any).createLinkTokenState.value = {
      data: null,
      loading: false,
      error: null,
    };
    (walletRepository as any).createLinkExchangeState.value = {
      data: null,
      loading: false,
      error: null,
    };

    (window as any).Plaid = {
      create: vi.fn().mockReturnValue({
        open: vi.fn(),
      }),
    };
  });

  it('exposes funding sources and derived flags based on wallet state', () => {
    const api = useSettingsBankAccounts({ skipInitialUpdate: true });

    expect(api.fundingSource.value).toHaveLength(2);
    expect(api.fundingSource.value[0].bank_name).toBe('Test Bank');

    expect(api.isCanAddBankAccount.value).toBe(true);
    expect(api.showSkeletonPlaceholders.value).toBe(false);
    expect(api.skeletonItemCount).toBe(2);

    const walletRepository = useRepositoryWallet();
    (walletRepository as any).getWalletState.value = {
      data: {
        ...((walletRepository as any).getWalletState.value.data as any),
        funding_source: [],
      },
      loading: true,
      error: null,
    };

    expect(api.showSkeletonPlaceholders.value).toBe(true);
  });

  it('disables add bank account when wallet has error or profile is not KYC approved', () => {
    const api = useSettingsBankAccounts({ skipInitialUpdate: true });
    const walletRepository = useRepositoryWallet();

    (walletRepository as any).getWalletState.value = {
      data: {
        ...((walletRepository as any).getWalletState.value.data as any),
        isWalletStatusAnyError: true,
      },
      loading: false,
      error: null,
    };

    expect(api.isCanAddBankAccount.value).toBe(false);

    selectedUserProfileData.value = {
      id: 1018,
      kyc_status: 'pending',
      isKycApproved: false,
    };
    expect(api.isCanAddBankAccount.value).toBe(false);
  });

  it('onDeleteAccountClick sends numeric funding_source_id and refreshes wallet data', async () => {
    const api = useSettingsBankAccounts({ skipInitialUpdate: true });

    apiDeleteMock.mockResolvedValue({
      data: undefined,
      status: 204,
      headers: new Headers(),
    });

    apiGetMock.mockResolvedValue({
      data: {
        id: 1,
        status: 'verified',
        balance: 0,
        pending_incoming_balance: 0,
        pending_outcoming_balance: 0,
        funding_source: [],
      },
      status: 200,
      headers: new Headers(),
    });

    const initialDeleteCalls = apiDeleteMock.mock.calls.length;
    const initialGetCalls = apiGetMock.mock.calls.length;

    await api.onDeleteAccountClick('10');

    expect(apiDeleteMock.mock.calls.length).toBe(initialDeleteCalls + 1);
    const [url, body] = apiDeleteMock.mock.calls[initialDeleteCalls];
    expect(url).toBe('/auth/linkaccount/1018');
    expect(body).toEqual({ funding_source_id: 10 });

    expect(apiGetMock.mock.calls.length).toBeGreaterThan(initialGetCalls);
  });

  it('onDeleteAccountClick is a no-op when loading or profileId is invalid', async () => {
    const api = useSettingsBankAccounts({ skipInitialUpdate: true });
    const walletRepository = useRepositoryWallet();

    (walletRepository as any).deleteLinkedAccountState.value = {
      ...(walletRepository as any).deleteLinkedAccountState.value,
      loading: true,
    };
    await api.onDeleteAccountClick(10);
    expect(apiDeleteMock).not.toHaveBeenCalled();

    (walletRepository as any).deleteLinkedAccountState.value = {
      ...(walletRepository as any).deleteLinkedAccountState.value,
      loading: false,
    };
    selectedUserProfileData.value = {
      id: 0,
      kyc_status: 'approved',
      isKycApproved: true,
    };
    await api.onDeleteAccountClick(10);
    expect(apiDeleteMock).not.toHaveBeenCalled();
  });

  it('onAddAccountClick runs full Plaid flow and creates link processes', async () => {
    apiPostMock.mockImplementation((path: string, body?: unknown) => {
      if (path.endsWith('/link')) {
        return Promise.resolve({
          data: { link_token: 'test-link-token' },
          status: 200,
          headers: new Headers(),
        });
      }
      if (path.endsWith('/exchange')) {
        return Promise.resolve({
          data: {
            access_token: 'access-token',
            accounts: [
              { account_id: 'acc-1', name: 'Checking', mask: '1111' },
            ],
          },
          status: 200,
          headers: new Headers(),
        });
      }
      if (path.endsWith('/process')) {
        return Promise.resolve({
          data: {},
          status: 200,
          headers: new Headers(),
        });
      }
      return Promise.resolve({
        data: {},
        status: 200,
        headers: new Headers(),
      });
    });

    const api = useSettingsBankAccounts({ skipInitialUpdate: true });

    await api.onAddAccountClick();
    await nextTick();

    expect(loadPlaidScriptOnceMock).toHaveBeenCalled();
    expect((window as any).Plaid.create).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'test-link-token',
      }),
    );

    const plaidConfig = (window as any).Plaid.create.mock.calls[0][0];
    await plaidConfig.onSuccess('public-token', {});
    await nextTick();

    const exchangeCall = apiPostMock.mock.calls.find(
      ([url]) => typeof url === 'string' && (url as string).endsWith('/exchange'),
    );
    expect(exchangeCall).toBeDefined();
    expect(exchangeCall?.[0]).toBe('/auth/linkaccount/1018/exchange');
    expect(exchangeCall?.[1]).toEqual({ public_token: 'public-token' });

    const processCalls = apiPostMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && (url as string).endsWith('/process'),
    );
    expect(processCalls.length).toBe(1);
    const [processUrl, processBody] = processCalls[0];
    expect(processUrl).toBe('/auth/linkaccount/1018/process');
    expect(processBody).toEqual({
      access_token: 'access-token',
      account_id: 'acc-1',
      name: 'Checking',
      last4: '1111',
    });
  });

  it('onAddAccountClick stops and clears loading when link token is missing or has error', async () => {
    const walletRepository = useRepositoryWallet();

    (walletRepository as any).createLinkTokenState.value = {
      data: null,
      loading: false,
      error: new Error('failed'),
    };

    const api = useSettingsBankAccounts({ skipInitialUpdate: true });

    await api.onAddAccountClick();
    await nextTick();

    expect(loadPlaidScriptOnceMock).not.toHaveBeenCalled();
    expect(api.isLinkBankAccountLoading.value).toBe(false);
  });
});

