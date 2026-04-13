import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { reactive, ref } from 'vue';

const hoisted = vi.hoisted(() => ({
  exchangeTokens: vi.fn(),
  exchangeTokensOptions: vi.fn(),
  getEvmWalletByProfile: vi.fn(),
  getPositions: vi.fn(),
  authorizeOperation: vi.fn(),
  reportError: vi.fn(),
  selectedNetwork: {
    value: 'ethereum-sepolia' as 'ethereum' | 'polygon' | 'base' | 'ethereum-sepolia',
  },
}));

const balances = [
  {
    address: '0xusdc',
    symbol: 'USDC',
    name: 'USD Coin',
    amount: 1000,
    price_per_usd: 1,
  },
  {
    address: '0xeth',
    symbol: 'ETH',
    name: 'Ether',
    amount: 0.5,
    price_per_usd: 2000,
  },
];

const getEvmWalletStateRef = ref({
  data: {
    id: 1,
    address: '0xROOT',
    balances,
    chains: [
      { chain: 'ethereum-sepolia', wallet_address: '0xSEP', chain_account_status: 'verified' },
      { chain: 'ethereum', wallet_address: '0xETH', chain_account_status: 'verified' },
      { chain: 'base', wallet_address: '0xBASE', chain_account_status: 'verified' },
    ],
  },
  loading: false,
  error: null as Error | null,
});
const exchangeTokensStateRef = ref({
  loading: false,
  error: null as Error | null,
  data: null,
});
const exchangeTokensOptionsStateRef = ref({
  data: null,
  loading: false,
  error: null as Error | null,
});

const selectedUserProfileIdRef = ref(1);
const selectedUserProfileDataRef = ref({
  id: 1,
  type: 'individual',
  name: 'Primary',
  data: {
    email: 'user@example.com',
    full_account_name: 'Primary Account',
  },
  wallet: { status: 'verified' },
  isKycApproved: true,
});
const userSessionTraitsRef = ref<{ email?: string } | null>({
  email: 'user@example.com',
});

const mockModel = reactive({
  from: '0xusdc',
  to: '0xusdc',
  amount: undefined as number | undefined,
});
const isValidRef = ref(true);

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    exchangeTokensState: exchangeTokensStateRef,
    exchangeTokensOptionsState: exchangeTokensOptionsStateRef,
    exchangeTokens: hoisted.exchangeTokens,
    exchangeTokensOptions: hoisted.exchangeTokensOptions,
    getEvmWalletByProfile: hoisted.getEvmWalletByProfile,
  }),
}));

vi.mock('InvestCommon/data/earn/earn.repository', () => ({
  useRepositoryEarn: () => ({
    getPositions: hoisted.getPositions,
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: selectedUserProfileIdRef,
    selectedUserProfileData: selectedUserProfileDataRef,
  }),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userSessionTraits: userSessionTraitsRef,
  }),
}));

vi.mock('InvestCommon/domain/error/errorReporting', () => ({
  reportError: hoisted.reportError,
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
  }),
}));

vi.mock('UiKit/helpers/validation/useFormValidation', () => ({
  useFormValidation: () => ({
    model: mockModel,
    isValid: isValidRef,
    onValidate: vi.fn(),
    scrollToError: vi.fn(),
    isFieldRequired: vi.fn(() => false),
    getErrorText: vi.fn(() => ''),
  }),
}));

import { useVFormExchange } from '../useVFormExchange';

describe('useVFormExchange', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    hoisted.selectedNetwork.value = 'ethereum-sepolia';
    getEvmWalletStateRef.value = {
      data: {
        id: 1,
        address: '0xROOT',
        balances: [...balances],
        chains: [
          { chain: 'ethereum-sepolia', wallet_address: '0xSEP', chain_account_status: 'verified' },
          { chain: 'ethereum', wallet_address: '0xETH', chain_account_status: 'verified' },
          { chain: 'base', wallet_address: '0xBASE', chain_account_status: 'verified' },
        ],
      },
      loading: false,
      error: null,
    };
    exchangeTokensStateRef.value = { loading: false, error: null, data: null };
    exchangeTokensOptionsStateRef.value = { data: null, loading: false, error: null };
    selectedUserProfileIdRef.value = 1;
    selectedUserProfileDataRef.value = {
      id: 1,
      type: 'individual',
      name: 'Primary',
      data: {
        email: 'user@example.com',
        full_account_name: 'Primary Account',
      },
      wallet: { status: 'verified' },
      isKycApproved: true,
    };
    userSessionTraitsRef.value = { email: 'user@example.com' };
    mockModel.from = '0xusdc';
    mockModel.to = '0xusdc';
    mockModel.amount = undefined;
    isValidRef.value = true;
    hoisted.exchangeTokens.mockReset();
    hoisted.exchangeTokens.mockResolvedValue(undefined);
    hoisted.exchangeTokensOptions.mockReset();
    hoisted.exchangeTokensOptions.mockResolvedValue(undefined);
    hoisted.getEvmWalletByProfile.mockReset();
    hoisted.getEvmWalletByProfile.mockResolvedValue(undefined);
    hoisted.getPositions.mockReset();
    hoisted.getPositions.mockResolvedValue(undefined);
    hoisted.authorizeOperation.mockReset();
    hoisted.authorizeOperation.mockResolvedValue({
      status: 'authorized',
      data: {
        session_id: 'session_confirm_1',
        authorization_status: 'active',
      },
    });
    hoisted.reportError.mockReset();
  });

  it('returns model, tokenToFormatted, tokenFormatted, saveHandler, cancelHandler', () => {
    const api = useVFormExchange();

    expect(api.model).toBeDefined();
    expect(api.tokenToFormatted).toBeDefined();
    expect(api.tokenFormatted).toBeDefined();
    expect(api.tokensFromFormatted).toBeDefined();
    expect(api.saveHandler).toBeDefined();
    expect(api.cancelHandler).toBeDefined();
    expect(api.isDisabledButton).toBeDefined();
    expect(api.selectedToken).toBeDefined();
    expect(api.exchangeRate).toBeDefined();
    expect(api.receiveAmount).toBeDefined();
  });

  it('tokenToFormatted defaults to USDC when balances have USDC', () => {
    const api = useVFormExchange();

    expect(api.tokenToFormatted.value).toHaveLength(1);
    expect(api.tokenToFormatted.value[0].symbol).toBe('USDC');
    expect(api.tokenToFormatted.value[0].text).toMatch(/USDC|USD Coin/);
  });

  it('selectedToken matches model.from address', () => {
    const api = useVFormExchange();

    api.model.from = '0xusdc';

    expect(api.selectedToken.value?.symbol).toBe('USDC');
  });

  it('cancelHandler calls emitClose when provided', () => {
    const emitClose = vi.fn();
    const api = useVFormExchange(emitClose);

    api.cancelHandler();

    expect(emitClose).toHaveBeenCalled();
  });

  it('defers the exchange when wallet auth recovery is required and resumes with the same payload', async () => {
    let pendingResume: (() => Promise<void>) | undefined;
    const emitClose = vi.fn();
    hoisted.selectedNetwork.value = 'base';
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

    const api = useVFormExchange(emitClose);
    api.model.from = '0xeth';
    api.model.to = '0xusdc';
    api.model.amount = 0.25;

    await api.saveHandler();

    expect(hoisted.exchangeTokens).not.toHaveBeenCalled();
    expect(emitClose).toHaveBeenCalledTimes(1);

    const firstCall = hoisted.authorizeOperation.mock.calls[0]?.[0];
    expect(firstCall).toEqual(expect.objectContaining({
      profileId: 1,
      request: expect.objectContaining({
        chain: 'base',
        asset_address: '0xeth',
        to_asset_address: '0xusdc',
        max_amount: '0.25',
      }),
    }));

    await pendingResume?.();

    const secondCall = hoisted.authorizeOperation.mock.calls[1]?.[0];
    expect(secondCall).toEqual(expect.objectContaining({
      profileId: 1,
      request: expect.objectContaining({
        chain: 'base',
        asset_address: '0xeth',
        to_asset_address: '0xusdc',
        max_amount: '0.25',
        nonce: firstCall.request.nonce,
      }),
      walletAuthContext: expect.objectContaining({
        userEmail: 'user@example.com',
      }),
    }));
    expect(hoisted.exchangeTokens).toHaveBeenCalledWith(1, {
      chain: 'base',
      asset_address: '0xeth',
      to_asset_address: '0xusdc',
      amount: '0.25',
      destination_address: '0xBASE',
      idempotency_key: firstCall.request.nonce,
    });
    expect(hoisted.getEvmWalletByProfile).toHaveBeenCalledWith(1);
    expect(hoisted.getPositions).not.toHaveBeenCalled();
    expect(emitClose).toHaveBeenCalledTimes(2);
  });

  it('completes authorize-sign-confirm-exchange flow and refreshes wallet on success', async () => {
    const emitClose = vi.fn();
    hoisted.selectedNetwork.value = 'ethereum';
    const api = useVFormExchange(emitClose);
    api.model.from = '0xusdc';
    api.model.to = '0xusdc';
    api.model.amount = 10;

    await api.saveHandler();

    expect(hoisted.authorizeOperation).toHaveBeenCalledWith(expect.objectContaining({
      profileId: 1,
      request: expect.objectContaining({
        chain: 'ethereum',
        asset_address: '0xusdc',
        to_asset_address: '0xusdc',
        max_amount: '10',
        nonce: expect.any(String),
      }),
      walletAuthContext: expect.objectContaining({
        profileId: 1,
        userEmail: 'user@example.com',
      }),
    }));
    expect(hoisted.exchangeTokens).toHaveBeenCalledWith(1, {
      chain: 'ethereum',
      asset_address: '0xusdc',
      to_asset_address: '0xusdc',
      amount: '10',
      destination_address: '0xETH',
      idempotency_key: expect.any(String),
    });
    expect(hoisted.getEvmWalletByProfile).toHaveBeenCalledWith(1);
    expect(hoisted.getPositions).not.toHaveBeenCalled();
    expect(emitClose).toHaveBeenCalledTimes(1);
  });

  it('refreshes wallet and earn positions for authorized earn-context exchanges', async () => {
    const emitClose = vi.fn();
    const api = useVFormExchange(emitClose, 'BTRP', 'pool-42', 7);
    api.model.from = '0xusdc';
    api.model.to = String(api.tokenToFormatted.value[0]?.id);
    api.model.amount = 100;

    await api.saveHandler();

    expect(hoisted.authorizeOperation).toHaveBeenCalledWith(expect.objectContaining({
      profileId: 7,
      request: expect.objectContaining({
        chain: 'ethereum-sepolia',
        asset_address: '0xusdc',
        to_asset_address: String(api.tokenToFormatted.value[0]?.id),
        max_amount: '100',
      }),
    }));
    expect(hoisted.exchangeTokens).toHaveBeenCalledWith(7, {
      chain: 'ethereum-sepolia',
      asset_address: '0xusdc',
      to_asset_address: String(api.tokenToFormatted.value[0]?.id),
      amount: '100',
      destination_address: '0xSEP',
      idempotency_key: expect.any(String),
    });
    expect(hoisted.getEvmWalletByProfile).toHaveBeenCalledWith(7);
    expect(hoisted.getPositions).toHaveBeenCalledWith('pool-42', 7);
    expect(emitClose).toHaveBeenCalledTimes(1);
  });
});
