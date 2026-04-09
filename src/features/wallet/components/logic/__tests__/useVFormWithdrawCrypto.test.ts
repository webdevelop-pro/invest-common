import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, reactive } from 'vue';

const hoisted = vi.hoisted(() => ({
  authorizeWithdrawStart: vi.fn(),
  authorizeWithdrawConfirm: vi.fn(),
  withdrawFundsOptions: vi.fn(),
  withdrawFunds: vi.fn(),
  getEvmWalletByProfile: vi.fn(),
  startFlowForProfile: vi.fn(),
  getAuthDetails: vi.fn(),
  signAuthorizationRequest: vi.fn(),
}));

const mockBalances = [
  { id: 1, address: '0xusdc', symbol: 'USDC', name: 'USD Coin', amount: 1000 },
  { id: 2, address: '0xeth', symbol: 'ETH', name: 'Ether', amount: 0.5 },
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
    authorizeWithdrawStart: hoisted.authorizeWithdrawStart,
    authorizeWithdrawConfirm: hoisted.authorizeWithdrawConfirm,
    withdrawFundsOptions: hoisted.withdrawFundsOptions,
    withdrawFunds: hoisted.withdrawFunds,
    getEvmWalletByProfile: hoisted.getEvmWalletByProfile,
  }),
}));

vi.mock('InvestCommon/features/wallet/store/useWalletAuth', () => ({
  useWalletAuth: () => ({
    startFlowForProfile: hoisted.startFlowForProfile,
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

vi.mock('InvestCommon/features/wallet/logic/walletAuth.adapter', () => ({
  walletAuthAdapter: {
    getAuthDetails: hoisted.getAuthDetails,
    signAuthorizationRequest: hoisted.signAuthorizationRequest,
  },
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
    mockModel.chain = '';
    mockModel.asset = '';
    mockModel.amount = undefined;
    mockModel.destination_address = '';
    mockModel.idempotency_key = '';
    isValidRef.value = false;
    hoisted.authorizeWithdrawStart.mockReset();
    hoisted.authorizeWithdrawStart.mockResolvedValue({
      session_id: 'session_confirm_1',
      signature_request: {
        type: 'eth_signTypedData_v4',
        data: { hello: 'world' },
      },
    });
    hoisted.authorizeWithdrawConfirm.mockReset();
    hoisted.authorizeWithdrawConfirm.mockResolvedValue({
      session_id: 'session_confirm_1',
      authorization_status: 'active',
    });
    hoisted.withdrawFundsOptions.mockReset();
    hoisted.withdrawFundsOptions.mockResolvedValue(undefined);
    hoisted.withdrawFunds.mockReset();
    hoisted.withdrawFunds.mockResolvedValue(undefined);
    hoisted.getEvmWalletByProfile.mockReset();
    hoisted.getEvmWalletByProfile.mockResolvedValue(undefined);
    hoisted.getAuthDetails.mockReset();
    hoisted.getAuthDetails.mockResolvedValue({ address: '0xabc' });
    hoisted.signAuthorizationRequest.mockReset();
    hoisted.signAuthorizationRequest.mockResolvedValue('0xsigned');
    hoisted.startFlowForProfile.mockReset();
    hoisted.startFlowForProfile.mockResolvedValue(undefined);
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
    expect(api.model.asset).toBe('USDC');
  });

  it('available text reflects the selected asset amount', () => {
    const api = useVFormWithdrawCrypto();
    api.model.asset = 'USDC';
    expect(api.text.value).toContain('1000');
  });

  it('starts wallet auth flow after authorize/start when signing is unavailable', async () => {
    hoisted.signAuthorizationRequest.mockRejectedValueOnce(new Error('not authenticated'));
    isValidRef.value = true;
    const api = useVFormWithdrawCrypto();
    api.model.chain = 'ethereum';
    api.model.asset = 'USDC';
    api.model.amount = 50;
    api.model.destination_address = '0xrecipient';

    await api.saveHandler();

    expect(hoisted.authorizeWithdrawStart).toHaveBeenCalledTimes(1);
    expect(hoisted.startFlowForProfile).toHaveBeenCalledTimes(1);
    expect(hoisted.withdrawFunds).not.toHaveBeenCalled();
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

    expect(hoisted.authorizeWithdrawStart).toHaveBeenCalledWith(1, {
      chain: 'ethereum',
      asset: 'USDC',
      max_amount: '50',
      nonce: 'wdr_test_0001',
    });
    expect(hoisted.signAuthorizationRequest).toHaveBeenCalledWith({
      type: 'eth_signTypedData_v4',
      data: { hello: 'world' },
    });
    expect(hoisted.authorizeWithdrawConfirm).toHaveBeenCalledWith(1, {
      session_id: 'session_confirm_1',
      owner_signature: '0xsigned',
    });
    expect(hoisted.withdrawFunds).toHaveBeenCalledWith(1, {
      chain: 'ethereum',
      asset: 'USDC',
      amount: '50',
      destination_address: '0xrecipient',
      idempotency_key: 'wdr_test_0001',
    });
    expect(hoisted.getEvmWalletByProfile).toHaveBeenCalledWith(1);
    expect(emitClose).toHaveBeenCalled();
  });
});
