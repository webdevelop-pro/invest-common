import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const getWalletStateRef = ref({
  data: {
    id: 1,
    funding_source: [
      { id: 1, bank_name: 'Chase', name: 'Checking ****1234' },
      { id: 2, bank_name: 'Bank of America', name: 'Savings ****5678' },
    ],
  },
  loading: false,
  error: null as Error | null,
});
const addTransactionStateRef = ref({ loading: false, error: null as Error | null });
const addTransaction = vi.fn().mockResolvedValue(undefined);
const getWalletByProfile = vi.fn().mockResolvedValue(undefined);

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    getWalletState: getWalletStateRef,
    addTransactionState: addTransactionStateRef,
    getWalletByProfile,
    addTransaction,
  }),
}));
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: ref(1),
  }),
}));
vi.mock('InvestCommon/features/cryptoWallet/components/logic/useVFormFundsWithdraw', () => ({
  useVFormFundsWithdraw: () => ({
    model: ref({ amount: undefined, token: '', to: '' }),
    isSubmitDisabled: ref(true),
    submitHandler: vi.fn(),
    assetOptions: ref([]),
    selectedAsset: ref(''),
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
        funding_source: [
          { id: 1, bank_name: 'Chase', name: 'Checking ****1234' },
          { id: 2, bank_name: 'Bank of America', name: 'Savings ****5678' },
        ],
      },
      loading: false,
      error: null,
    };
    addTransactionStateRef.value = { loading: false, error: null };
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
    expect(api.loadFiatWallet).toBeDefined();
    expect(api.model).toBeDefined();
    expect(api.maxFiatWithdraw).toBe(1_000_000);
  });

  it('defaults withdrawalMethod to crypto', () => {
    const api = useVFormWithdraw(onClose);
    expect(api.withdrawalMethod.value).toBe('crypto');
  });

  it('fundingSourceFormatted maps wallet funding_source', () => {
    const api = useVFormWithdraw(onClose);
    expect(api.fundingSourceFormatted.value).toHaveLength(2);
    expect(api.fundingSourceFormatted.value[0].text).toBe('Chase: Checking ****1234');
  });

  it('isFiatSubmitDisabled when amount missing or zero', () => {
    const api = useVFormWithdraw(onClose);
    expect(api.isFiatSubmitDisabled.value).toBe(true);
    api.fiatModel.value.amount = 100;
    api.fiatModel.value.funding_source_id = 1;
    expect(api.isFiatSubmitDisabled.value).toBe(false);
  });

  it('fiatSubmitHandler calls addTransaction with type withdrawal and onClose', async () => {
    const api = useVFormWithdraw(onClose);
    api.fiatModel.value = { amount: 150, funding_source_id: 1 };
    await api.fiatSubmitHandler();
    expect(addTransaction).toHaveBeenCalledWith(1, {
      type: 'withdrawal',
      amount: 150,
      funding_source_id: 1,
    });
    expect(onClose).toHaveBeenCalled();
  });
});
