import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, reactive } from 'vue';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';

const mockFundingSource = [
  { id: 1, bank_name: 'Chase', name: 'Checking', last4: '1234' },
  { id: 2, bank_name: 'Bank of America', name: 'Savings', last4: '5678' },
];

const getWalletStateRef = ref({
  data: {
    id: 1,
    currentBalance: 5000,
    pendingOutcomingBalance: 500,
    funding_source: mockFundingSource,
  },
  loading: false,
  error: null as Error | null,
});

const addTransactionStateRef = ref({
  data: null,
  loading: false,
  error: null as Error | null,
});

const walletIdRef = ref(1);
const addTransaction = vi.fn().mockResolvedValue(undefined);

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    getWalletState: getWalletStateRef,
    addTransactionState: addTransactionStateRef,
    walletId: walletIdRef,
    addTransaction,
  }),
}));

const isValidRef = ref(false);
const mockModel = reactive({
  amount: undefined as number | undefined,
  funding_source_id: undefined as number | undefined,
});

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

import { useVFormWalletAddTransaction } from '../useVFormWalletAddTransaction';

describe('useVFormWalletAddTransaction', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getWalletStateRef.value = {
      data: {
        id: 1,
        currentBalance: 5000,
        pendingOutcomingBalance: 500,
        funding_source: [...mockFundingSource],
      },
      loading: false,
      error: null,
    };
    addTransactionStateRef.value = { data: null, loading: false, error: null };
    walletIdRef.value = 1;
    mockModel.amount = undefined;
    mockModel.funding_source_id = undefined;
    isValidRef.value = false;
    addTransaction.mockClear();
  });

  it('returns model, validation, handlers, funding sources, and form helpers', () => {
    const api = useVFormWalletAddTransaction(WalletAddTransactionTypes.deposit);
    expect(api.model).toBeDefined();
    expect(api.validation).toBeDefined();
    expect(api.isValid).toBeDefined();
    expect(api.isDisabledButton).toBeDefined();
    expect(api.onValidate).toBeDefined();
    expect(api.saveHandler).toBeDefined();
    expect(api.cancelHandler).toBeDefined();
    expect(api.titile).toBeDefined();
    expect(api.text).toBeDefined();
    expect(api.errorData).toBeDefined();
    expect(api.fundingSourceFormatted).toBeDefined();
    expect(api.addTransactionState).toBeDefined();
    expect(api.numberFormatter).toBeDefined();
    expect(api.getWalletState).toBeDefined();
    expect(api.maxFiatAmount).toBeDefined();
    expect(api.maxFiatAmountFormatted).toBeDefined();
  });

  it('titile is Add Funds for deposit and Withdraw for withdrawal', () => {
    const depositApi = useVFormWalletAddTransaction(WalletAddTransactionTypes.deposit);
    expect(depositApi.titile.value).toBe('Add Funds');
    const withdrawApi = useVFormWalletAddTransaction(WalletAddTransactionTypes.withdrawal);
    expect(withdrawApi.titile.value).toBe('Withdraw');
  });

  it('accepts transactionType as Ref', () => {
    const typeRef = ref(WalletAddTransactionTypes.deposit);
    const api = useVFormWalletAddTransaction(typeRef);
    expect(api.titile.value).toBe('Add Funds');
    typeRef.value = WalletAddTransactionTypes.withdrawal;
    const api2 = useVFormWalletAddTransaction(typeRef);
    expect(api2.titile.value).toBe('Withdraw');
  });

  it('maxFiatAmount and text differ for deposit vs withdrawal', () => {
    const depositApi = useVFormWalletAddTransaction(WalletAddTransactionTypes.deposit);
    expect(depositApi.maxFiatAmount.value).toBe(1_000_000);
    expect(depositApi.text.value).toContain('1,000,000');

    const withdrawApi = useVFormWalletAddTransaction(WalletAddTransactionTypes.withdrawal);
    const maxWithdraw = 5000 - 500;
    expect(withdrawApi.maxFiatAmount.value).toBe(maxWithdraw);
    expect(withdrawApi.text.value).toContain(String(maxWithdraw));
  });

  it('fundingSourceFormatted maps funding_source with bank name and last4', () => {
    const api = useVFormWalletAddTransaction(WalletAddTransactionTypes.deposit);
    expect(api.fundingSourceFormatted.value).toHaveLength(2);
    expect(api.fundingSourceFormatted.value[0]).toMatchObject({
      id: '1',
      text: expect.stringContaining('Chase'),
    });
    expect(api.fundingSourceFormatted.value[0].text).toContain('**** 1234');
  });

  it('isDisabledButton true when invalid or addTransaction loading', () => {
    const api = useVFormWalletAddTransaction(WalletAddTransactionTypes.deposit);
    expect(api.isDisabledButton.value).toBe(true);
    addTransactionStateRef.value = { ...addTransactionStateRef.value, loading: true };
    const apiLoading = useVFormWalletAddTransaction(WalletAddTransactionTypes.deposit);
    expect(apiLoading.isDisabledButton.value).toBe(true);
  });

  it('cancelHandler calls emitClose when provided', () => {
    const emitClose = vi.fn();
    const api = useVFormWalletAddTransaction(WalletAddTransactionTypes.deposit, emitClose);
    api.cancelHandler();
    expect(emitClose).toHaveBeenCalled();
  });

  it('saveHandler calls addTransaction with type and amount and emitClose on success', async () => {
    const emitClose = vi.fn();
    isValidRef.value = true;
    const api = useVFormWalletAddTransaction(WalletAddTransactionTypes.deposit, emitClose);
    api.model.amount = 200;
    api.model.funding_source_id = 1;
    await api.saveHandler();
    expect(addTransaction).toHaveBeenCalledWith(1, {
      type: WalletAddTransactionTypes.deposit,
      amount: 200,
      funding_source_id: 1,
    });
    expect(emitClose).toHaveBeenCalled();
  });
});
