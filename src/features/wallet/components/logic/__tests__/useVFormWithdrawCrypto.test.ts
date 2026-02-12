import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, reactive } from 'vue';

const mockBalances = [
  { id: 1, address: '0xusdc', symbol: 'USDC', name: 'USD Coin', amount: 1000 },
  { id: 2, address: '0xeth', symbol: 'ETH', name: 'Ether', amount: 0.5 },
];

const getEvmWalletStateRef = ref({
  data: {
    id: 1,
    address: '0xCABBA',
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

const withdrawFundsOptions = vi.fn().mockResolvedValue(undefined);
const withdrawFunds = vi.fn().mockResolvedValue(undefined);

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    withdrawFundsState: withdrawFundsStateRef,
    withdrawFundsOptionsState: withdrawFundsOptionsStateRef,
    withdrawFundsOptions,
    withdrawFunds,
  }),
}));

const mockModel = reactive({
  amount: undefined as number | undefined,
  token: '',
  to: '',
  wallet_id: 1,
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
      data: { id: 1, address: '0xCABBA', balances: [...mockBalances] },
      loading: false,
      error: null,
    };
    withdrawFundsStateRef.value = { data: null, loading: false, error: null };
    withdrawFundsOptionsStateRef.value = { data: null, loading: false, error: null };
    mockModel.amount = undefined;
    mockModel.token = '';
    mockModel.to = '';
    mockModel.wallet_id = 1;
    isValidRef.value = false;
    withdrawFundsOptions.mockClear();
    withdrawFunds.mockClear();
  });

  it('returns model, validation, handlers, token list, and form helpers', () => {
    const api = useVFormWithdrawCrypto();
    expect(api.model).toBeDefined();
    expect(api.validation).toBeDefined();
    expect(api.isValid).toBeDefined();
    expect(api.isDisabledButton).toBeDefined();
    expect(api.onValidate).toBeDefined();
    expect(api.saveHandler).toBeDefined();
    expect(api.cancelHandler).toBeDefined();
    expect(api.text).toBeDefined();
    expect(api.errorData).toBeDefined();
    expect(api.tokenFormatted).toBeDefined();
    expect(api.numberFormatter).toBeDefined();
    expect(api.withdrawFundsState).toBeDefined();
    expect(api.formErrors).toBeDefined();
    expect(api.isFieldRequired).toBeDefined();
    expect(api.getErrorText).toBeDefined();
    expect(api.getOptions).toBeDefined();
    expect(api.getReferenceType).toBeDefined();
    expect(api.scrollToError).toBeDefined();
  });

  it('tokenFormatted returns unique tokens with text and id from balances', () => {
    const api = useVFormWithdrawCrypto();
    expect(api.tokenFormatted.value.length).toBe(2);
    expect(api.tokenFormatted.value[0]).toMatchObject({
      id: '0xusdc',
      text: 'USD Coin: USDC',
      symbol: 'USDC',
    });
  });

  it('maxWithdraw and text reflect selected token amount', () => {
    getEvmWalletStateRef.value = {
      data: { id: 1, balances: [{ address: '0xusdc', symbol: 'USDC', name: 'USD Coin', amount: 500 }] },
      loading: false,
      error: null,
    };
    const api = useVFormWithdrawCrypto();
    api.model.token = '0xusdc';
    expect(api.text.value).toContain('500');
  });

  it('isDisabledButton true when invalid or withdraw loading', () => {
    const api = useVFormWithdrawCrypto();
    expect(api.isDisabledButton.value).toBe(true);
    withdrawFundsStateRef.value = { ...withdrawFundsStateRef.value, loading: true };
    const apiLoading = useVFormWithdrawCrypto();
    expect(apiLoading.isDisabledButton.value).toBe(true);
  });

  it('cancelHandler calls emitClose when provided', () => {
    const emitClose = vi.fn();
    const api = useVFormWithdrawCrypto(emitClose);
    api.cancelHandler();
    expect(emitClose).toHaveBeenCalled();
  });

  it('saveHandler calls withdrawFunds with model and emitClose on success', async () => {
    const emitClose = vi.fn();
    getEvmWalletStateRef.value = {
      data: { id: 1, balances: [{ address: '0xusdc', symbol: 'USDC', name: 'USD Coin', amount: 100 }] },
      loading: false,
      error: null,
    };
    isValidRef.value = true;
    const api = useVFormWithdrawCrypto(emitClose);
    api.model.amount = 50;
    api.model.token = '0xusdc';
    api.model.to = '0xrecipient';
    api.model.wallet_id = 1;
    await api.saveHandler();
    expect(withdrawFunds).toHaveBeenCalledWith({
      amount: 50,
      token: '0xusdc',
      to: '0xrecipient',
      wallet_id: 1,
    });
    expect(emitClose).toHaveBeenCalled();
  });
});
