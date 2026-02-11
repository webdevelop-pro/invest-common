import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const getWalletStateRef = ref({
  data: {
    id: 1,
    currentBalance: 5000,
    pendingOutcomingBalance: 0,
    funding_source: [
      { id: 1, bank_name: 'Chase', name: 'Checking', last4: '1234' },
      { id: 2, bank_name: 'Bank of America', name: 'Savings', last4: '5678' },
    ],
  },
  loading: false,
  error: null as Error | null,
});
const addTransactionStateRef = ref({ loading: false, error: null as Error | null });
const walletIdRef = ref(1);
const addTransaction = vi.fn().mockResolvedValue(undefined);
const getWalletByProfile = vi.fn().mockResolvedValue(undefined);

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    getWalletState: getWalletStateRef,
    addTransactionState: addTransactionStateRef,
    walletId: walletIdRef,
    getWalletByProfile,
    addTransaction,
  }),
}));
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: ref(1),
  }),
}));
vi.mock('InvestCommon/features/wallet/components/logic/useVFormWithdrawCrypto', () => ({
  useVFormWithdrawCrypto: () => ({
    model: ref({ amount: undefined, token: '', to: '' }),
    isDisabledButton: ref(true),
    saveHandler: vi.fn(),
    cancelHandler: vi.fn(),
    tokenFormatted: ref([]),
  }),
}));

import { useVFormWithdraw } from '../useVFormWithdraw';

describe('useVFormWithdraw', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    setActivePinia(createPinia());
    getWalletStateRef.value = {
      data: {
        id: 1,
        currentBalance: 5000,
        pendingOutcomingBalance: 0,
        funding_source: [
          { id: 1, bank_name: 'Chase', name: 'Checking', last4: '1234' },
          { id: 2, bank_name: 'Bank of America', name: 'Savings', last4: '5678' },
        ],
      },
      loading: false,
      error: null,
    };
    addTransactionStateRef.value = { loading: false, error: null };
    walletIdRef.value = 1;
    onClose.mockClear();
    addTransaction.mockClear();
  });

  it('returns withdrawal method, fiat model, funding sources, and spread crypto withdraw fields', () => {
    const api = useVFormWithdraw(onClose);
    expect(api.withdrawalMethod).toBeDefined();
    expect(api.fiatModel).toBeDefined();
    expect(api.fundingSourceFormatted).toBeDefined();
    expect(api.isFiatSubmitDisabled).toBeDefined();
    expect(api.fiatSubmitHandler).toBeDefined();
    expect(api.model).toBeDefined();
    expect(api.maxFiatAmount).toBeDefined();
    expect(api.maxFiatAmount.value).toBe(5000);
  });

  it('defaults withdrawalMethod to crypto', () => {
    const api = useVFormWithdraw(onClose);
    expect(api.withdrawalMethod.value).toBe('crypto');
  });

  it('fundingSourceFormatted maps wallet funding_source', () => {
    const api = useVFormWithdraw(onClose);
    expect(api.fundingSourceFormatted.value).toHaveLength(2);
    expect(api.fundingSourceFormatted.value[0].text).toContain('Chase');
    expect(api.fundingSourceFormatted.value[0].text).toContain('**** 1234');
  });

  it('isFiatSubmitDisabled is false when amount and funding source are set', () => {
    const api = useVFormWithdraw(onClose);
    api.fiatModel.amount = 100;
    api.fiatModel.funding_source_id = 1;
    expect(api.isFiatSubmitDisabled.value).toBe(false);
  });

  it('fiatSubmitHandler calls addTransaction with type withdrawal and onClose', async () => {
    const api = useVFormWithdraw(onClose);
    api.fiatModel.amount = 150;
    api.fiatModel.funding_source_id = 1;
    await api.fiatSubmitHandler();
    expect(addTransaction).toHaveBeenCalledWith(1, {
      type: 'withdrawal',
      amount: 150,
      funding_source_id: 1,
    });
    expect(onClose).toHaveBeenCalled();
  });
});
