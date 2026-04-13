import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, reactive } from 'vue';

const hoisted = vi.hoisted(() => ({
  withdrawFundsOptions: vi.fn(),
  withdrawFunds: vi.fn(),
  getEvmWalletByProfile: vi.fn(),
  authorizeOperation: vi.fn(),
  selectedNetwork: {
    value: 'ethereum-sepolia' as 'ethereum' | 'polygon' | 'base' | 'ethereum-sepolia',
  },
}));

const toastMock = vi.fn();

const mockBalances = [
  { id: 1, asset: 'USDC', address: '0xusdc', symbol: 'USDC', name: 'USD Coin', amount: 1000 },
  { id: 2, asset: 'ETH', address: '0xeth', symbol: 'ETH', name: 'Ether', amount: 0.5 },
];

const getEvmWalletStateRef = ref({
  data: {
    id: 1,
    address: '0xCABBA',
    chains: [
      { chain: 'ethereum-sepolia', wallet_address: '0xSEP', chain_account_status: 'verified' },
      { chain: 'ethereum', wallet_address: '0xETH', chain_account_status: 'verified' },
      { chain: 'base', wallet_address: '0xBASE', chain_account_status: 'verified' },
    ],
    balances: mockBalances,
  },
  loading: false,
  error: null as Error | null,
});

const withdrawFundsStateRef = ref({
  data: null,
  loading: false,
  error: null as Error | null,
});

const withdrawFundsOptionsStateRef = ref({
  data: null,
  loading: false,
  error: null as Error | null,
});

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    withdrawFundsState: withdrawFundsStateRef,
    withdrawFundsOptionsState: withdrawFundsOptionsStateRef,
    withdrawFundsOptions: hoisted.withdrawFundsOptions,
    withdrawFunds: hoisted.withdrawFunds,
    getEvmWalletByProfile: hoisted.getEvmWalletByProfile,
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: ref(1),
    selectedUserProfileData: ref({
      id: 1,
      type: 'individual',
      name: 'Primary',
      data: {
        email: 'user@example.com',
        full_account_name: 'Primary Account',
      },
      wallet: { status: 'verified' },
      isKycApproved: true,
    }),
  }),
}));

const userSessionTraitsRef = ref<{ email?: string } | null>({
  email: 'user@example.com',
});

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userSessionTraits: userSessionTraitsRef,
  }),
}));

vi.mock('InvestCommon/features/wallet/logic/useWalletOperationAuthorization', () => ({
  useWalletOperationAuthorization: () => ({
    authorizeOperation: hoisted.authorizeOperation,
  }),
}));

vi.mock('InvestCommon/features/wallet/logic/useWalletNetwork', () => ({
  DEFAULT_WALLET_NETWORK: 'ethereum-sepolia',
  useWalletNetwork: () => ({
    defaultNetwork: 'ethereum-sepolia',
    selectedNetwork: hoisted.selectedNetwork,
    networkOptions: ref([
      { value: 'ethereum', text: 'ETH Ethereum (ERC20)', warningLabel: 'Ethereum (ERC20)' },
      { value: 'polygon', text: 'POL Polygon', warningLabel: 'Polygon' },
      { value: 'base', text: 'BASE Base', warningLabel: 'Base' },
      { value: 'ethereum-sepolia', text: 'ETH Ethereum Sepolia', warningLabel: 'Ethereum Sepolia' },
    ]),
  }),
}));

vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

const mockModel = reactive({
  chain: '',
  asset: '',
  amount: undefined as number | undefined,
  destination_address: '',
  idempotency_key: '',
});

const isValidRef = ref(false);
vi.mock('UiKit/helpers/validation/useFormValidation', () => ({
  useFormValidation: () => ({
    model: mockModel,
    validation: ref({}),
    isValid: isValidRef,
    onValidate: vi.fn(),
    scrollToError: vi.fn(),
    formErrors: ref({}),
    isFieldRequired: vi.fn(() => false),
    getErrorText: vi.fn(() => ''),
    getOptions: vi.fn(),
    getReferenceType: vi.fn(),
  }),
}));

import { useVFormWithdrawCrypto } from '../useVFormWithdrawCrypto';

describe('useVFormWithdrawCrypto', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    hoisted.selectedNetwork.value = 'ethereum-sepolia';
    getEvmWalletStateRef.value = {
      data: {
        id: 1,
        address: '0xCABBA',
        chains: [
          { chain: 'ethereum-sepolia', wallet_address: '0xSEP', chain_account_status: 'verified' },
          { chain: 'ethereum', wallet_address: '0xETH', chain_account_status: 'verified' },
          { chain: 'base', wallet_address: '0xBASE', chain_account_status: 'verified' },
        ],
        balances: [...mockBalances],
      },
      loading: false,
      error: null,
    };
    withdrawFundsStateRef.value = { data: null, loading: false, error: null };
    withdrawFundsOptionsStateRef.value = { data: null, loading: false, error: null };
    userSessionTraitsRef.value = { email: 'user@example.com' };
    mockModel.chain = '';
    mockModel.asset = '';
    mockModel.amount = undefined;
    mockModel.destination_address = '';
    mockModel.idempotency_key = '';
    isValidRef.value = false;
    hoisted.authorizeOperation.mockReset();
    hoisted.authorizeOperation.mockResolvedValue({
      status: 'authorized',
      data: {
        session_id: 'session_confirm_1',
        authorization_status: 'active',
      },
    });
    hoisted.withdrawFundsOptions.mockReset();
    hoisted.withdrawFundsOptions.mockResolvedValue(undefined);
    hoisted.withdrawFunds.mockReset();
    hoisted.withdrawFunds.mockResolvedValue(undefined);
    hoisted.getEvmWalletByProfile.mockReset();
    hoisted.getEvmWalletByProfile.mockResolvedValue(undefined);
    toastMock.mockReset();
  });

  it('returns chain options, asset options, handlers, and form helpers', () => {
    const api = useVFormWithdrawCrypto();
    expect(api.model).toBeDefined();
    expect(api.chainOptions.value.length).toBe(3);
    expect(api.tokenFormatted.value.length).toBe(2);
    expect(api.saveHandler).toBeDefined();
    expect(api.cancelHandler).toBeDefined();
    expect(api.withdrawFundsState).toBeDefined();
  });

  it('defaults chain to ethereum-sepolia and asset to the first token', () => {
    const api = useVFormWithdrawCrypto();
    expect(api.model.chain).toBe('ethereum-sepolia');
    expect(api.model.asset).toBe('0xusdc');
  });

  it('keeps the dashboard-selected network available when it is supported', () => {
    hoisted.selectedNetwork.value = 'base';

    const api = useVFormWithdrawCrypto();

    expect(api.chainOptions.value.map((option) => option.value)).toEqual([
      'ethereum',
      'base',
      'ethereum-sepolia',
    ]);
  });

  it('falls back to shared network options when wallet chains are unavailable', () => {
    hoisted.selectedNetwork.value = 'base';
    getEvmWalletStateRef.value = {
      data: {
        id: 1,
        address: '0xCABBA',
        chains: [],
        balances: [...mockBalances],
      },
      loading: false,
      error: null,
    };

    const api = useVFormWithdrawCrypto();

    expect(api.chainOptions.value.map((option) => option.value)).toEqual([
      'ethereum',
      'polygon',
      'base',
      'ethereum-sepolia',
    ]);
  });

  it('available text reflects the selected asset amount', () => {
    const api = useVFormWithdrawCrypto();
    api.model.asset = 'USDC';
    expect(api.availableAmountText.value).toContain('1000');
  });

  it('defers the withdrawal when wallet auth recovery is required and resumes with the same payload', async () => {
    let pendingResume: (() => Promise<void>) | undefined;
    const emitClose = vi.fn();
    hoisted.authorizeOperation
      .mockImplementationOnce(async (params) => {
        await params.onBeforeWalletAuth?.();
        pendingResume = params.onAuthRecovered as (() => Promise<void>) | undefined;
        return { status: 'deferred_to_wallet_auth' };
      })
      .mockResolvedValueOnce({
        status: 'authorized',
        data: {
          session_id: 'session_confirm_1',
          authorization_status: 'active',
        },
      });
    isValidRef.value = true;
    const api = useVFormWithdrawCrypto(emitClose);
    api.model.chain = 'ethereum';
    api.model.asset = 'USDC';
    api.model.amount = 50;
    api.model.destination_address = '0xrecipient';
    api.model.idempotency_key = 'wdr_test_0001';

    await api.saveHandler();
    expect(hoisted.withdrawFunds).not.toHaveBeenCalled();
    expect(emitClose).toHaveBeenCalledTimes(1);

    await pendingResume?.();

    expect(hoisted.authorizeOperation).toHaveBeenNthCalledWith(1, expect.objectContaining({
      profileId: 1,
      request: expect.objectContaining({
        chain: 'ethereum',
        asset_address: '0xusdc',
        nonce: 'wdr_test_0001',
      }),
    }));
    expect(hoisted.authorizeOperation).toHaveBeenNthCalledWith(2, expect.objectContaining({
      profileId: 1,
      request: expect.objectContaining({
        chain: 'ethereum',
        asset_address: '0xusdc',
        nonce: 'wdr_test_0001',
      }),
    }));
    expect(hoisted.withdrawFunds).toHaveBeenCalledWith(1, {
      chain: 'ethereum',
      asset_address: '0xusdc',
      amount: '50',
      destination_address: '0xrecipient',
      idempotency_key: 'wdr_test_0001',
    });
  });

  it('uses the session email for wallet auth recovery when the profile email is missing', async () => {
    let firstCallArgs: Record<string, any> | undefined;
    hoisted.authorizeOperation.mockImplementationOnce(async (params) => {
      firstCallArgs = params;
      return { status: 'deferred_to_wallet_auth' };
    });
    isValidRef.value = true;
    userSessionTraitsRef.value = { email: 'session@example.com' };
    const api = useVFormWithdrawCrypto();
    api.model.chain = 'ethereum';
    api.model.asset = 'USDC';
    api.model.amount = 50;
    api.model.destination_address = '0xrecipient';
    api.model.idempotency_key = 'wdr_test_session_email';

    await api.saveHandler();

    expect(firstCallArgs?.walletAuthContext).toEqual(expect.objectContaining({
      userEmail: 'session@example.com',
    }));
  });

  it('completes authorize-sign-confirm-withdraw flow and closes on success', async () => {
    const emitClose = vi.fn();
    isValidRef.value = true;
    const api = useVFormWithdrawCrypto(emitClose);
    api.model.chain = 'ethereum';
    api.model.asset = 'USDC';
    api.model.amount = 50;
    api.model.destination_address = '0xrecipient';
    api.model.idempotency_key = 'wdr_test_0001';

    await api.saveHandler();

    expect(hoisted.authorizeOperation).toHaveBeenCalledWith(expect.objectContaining({
      profileId: 1,
      request: expect.objectContaining({
        chain: 'ethereum',
        asset_address: '0xusdc',
        nonce: 'wdr_test_0001',
      }),
    }));
    expect(hoisted.withdrawFunds).toHaveBeenCalledWith(1, {
      chain: 'ethereum',
      asset_address: '0xusdc',
      amount: '50',
      destination_address: '0xrecipient',
      idempotency_key: 'wdr_test_0001',
    });
    expect(hoisted.getEvmWalletByProfile).toHaveBeenCalledWith(1);
    expect(toastMock).toHaveBeenCalledWith({
      title: 'Withdrawal submitted',
      description: '50 USDC withdrawal submitted successfully.',
      variant: 'success',
    });
    expect(emitClose).toHaveBeenCalled();
  });

  it('normalizes the submitted asset to the selected token address when available', async () => {
    isValidRef.value = true;
    getEvmWalletStateRef.value = {
      data: {
        id: 1,
        address: '0xCABBA',
        chains: [
          { chain: 'ethereum-sepolia', wallet_address: '0xSEP', chain_account_status: 'verified' },
        ],
        balances: [
          { id: 3, asset: 'BTRP', address: '0xbtrp', symbol: 'BTRP', name: 'BTRP', amount: 200 },
        ],
      },
      loading: false,
      error: null,
    };

    const api = useVFormWithdrawCrypto();
    api.model.chain = 'ethereum-sepolia';
    api.model.asset = '0xbtrp';
    api.model.amount = 10;
    api.model.destination_address = '0xrecipient';
    api.model.idempotency_key = 'wdr_test_address_asset';

    await api.saveHandler();

    expect(hoisted.authorizeOperation).toHaveBeenCalledWith(expect.objectContaining({
      request: expect.objectContaining({
        chain: 'ethereum-sepolia',
        asset_address: '0xbtrp',
        nonce: 'wdr_test_address_asset',
      }),
    }));
    expect(hoisted.withdrawFunds).toHaveBeenCalledWith(1, {
      chain: 'ethereum-sepolia',
      asset_address: '0xbtrp',
      amount: '10',
      destination_address: '0xrecipient',
      idempotency_key: 'wdr_test_address_asset',
    });
  });

  it('resolves a symbol-style selected asset to the chosen token address before submit', async () => {
    isValidRef.value = true;
    getEvmWalletStateRef.value = {
      data: {
        id: 1,
        address: '0xCABBA',
        chains: [
          { chain: 'ethereum-sepolia', wallet_address: '0xSEP', chain_account_status: 'verified' },
        ],
        balances: [
          { id: 3, asset: 'BTRP', address: '0xbtrp', symbol: 'BTRP', name: 'BTRP', amount: 200 },
        ],
      },
      loading: false,
      error: null,
    };

    const api = useVFormWithdrawCrypto();
    api.model.chain = 'ethereum-sepolia';
    api.model.asset = 'BTRP';
    api.model.amount = 10;
    api.model.destination_address = '0xrecipient';
    api.model.idempotency_key = 'wdr_test_symbol_asset';

    await api.saveHandler();

    expect(hoisted.authorizeOperation).toHaveBeenCalledWith(expect.objectContaining({
      request: expect.objectContaining({
        chain: 'ethereum-sepolia',
        asset_address: '0xbtrp',
        nonce: 'wdr_test_symbol_asset',
      }),
    }));
    expect(hoisted.withdrawFunds).toHaveBeenCalledWith(1, {
      chain: 'ethereum-sepolia',
      asset_address: '0xbtrp',
      amount: '10',
      destination_address: '0xrecipient',
      idempotency_key: 'wdr_test_symbol_asset',
    });
  });
});
