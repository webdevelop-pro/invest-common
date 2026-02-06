import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const evmDataRef = ref({
  address: '0xCABBAc435948510D24820746Ee29706a05A54369',
  balances: [
    { id: 1, symbol: 'USDC', name: 'USD Coin', address: '0xusdc', amount: 1000 },
    { id: 2, symbol: 'ETH', name: 'Ether', address: '0xeth', amount: 0.5 },
  ],
});

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
    walletId: ref(1),
    getWalletByProfile,
    addTransaction,
  }),
}));
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: ref(1),
  }),
}));
vi.mock('InvestCommon/features/cryptoWallet/components/logic/useVFormFundsAdd', () => ({
  useVFormFundsAdd: () => ({
    qrCodeDataURL: ref(''),
    isGeneratingQR: ref(false),
    copied: ref(false),
    onCopyClick: vi.fn(),
  }),
}));

import { useVFormAddFunds } from '../useVFormAddFunds';

describe('useVFormAddFunds', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    setActivePinia(createPinia());
    evmDataRef.value = {
      address: '0xCABBAc435948510D24820746Ee29706a05A54369',
      balances: [
        { id: 1, symbol: 'USDC', name: 'USD Coin', address: '0xusdc', amount: 1000 },
        { id: 2, symbol: 'ETH', name: 'Ether', address: '0xeth', amount: 0.5 },
      ],
    };
    getWalletStateRef.value.data = {
      id: 1,
      funding_source: [
        { id: 1, bank_name: 'Chase', name: 'Checking ****1234' },
        { id: 2, bank_name: 'Bank of America', name: 'Savings ****5678' },
      ],
    };
    addTransactionStateRef.value = { loading: false, error: null };
    onClose.mockClear();
    addTransaction.mockClear();
  });

  it('returns deposit method, fiat model, funding sources, and crypto fields', () => {
    const api = useVFormAddFunds(evmDataRef, onClose);
    expect(api.depositMethod).toBeDefined();
    expect(api.fiatModel).toBeDefined();
    expect(api.fundingSourceFormatted).toBeDefined();
    expect(api.isFiatSubmitDisabled).toBeDefined();
    expect(api.fiatSubmitHandler).toBeDefined();
    expect(api.assetOptions).toBeDefined();
    expect(api.selectedAsset).toBeDefined();
    expect(api.maxFiatAmount).toBe(1_000_000);
  });

  it('defaults depositMethod to crypto', () => {
    const api = useVFormAddFunds(evmDataRef, onClose);
    expect(api.depositMethod.value).toBe('crypto');
  });

  it('fundingSourceFormatted maps wallet funding_source', () => {
    const api = useVFormAddFunds(evmDataRef, onClose);
    expect(api.fundingSourceFormatted.value).toHaveLength(2);
    expect(api.fundingSourceFormatted.value[0]).toEqual({
      id: 1,
      text: 'Chase: Checking ****1234',
    });
  });

  it('assetOptions from evm balances when present', () => {
    const api = useVFormAddFunds(evmDataRef, onClose);
    expect(api.assetOptions.value).toHaveLength(2);
    expect(api.assetOptions.value.map((o: { value: string }) => o.value)).toEqual(
      expect.arrayContaining(['USDC', 'ETH']),
    );
  });

  it('isFiatSubmitDisabled when amount missing or zero', () => {
    const api = useVFormAddFunds(evmDataRef, onClose);
    expect(api.isFiatSubmitDisabled.value).toBe(true);
    api.fiatModel.value.amount = 100;
    api.fiatModel.value.funding_source_id = 1;
    expect(api.isFiatSubmitDisabled.value).toBe(false);
  });

  it('fiatSubmitHandler calls addTransaction and onClose', async () => {
    const api = useVFormAddFunds(evmDataRef, onClose);
    api.fiatModel.value = { amount: 200, funding_source_id: 1 };
    await api.fiatSubmitHandler();
    expect(addTransaction).toHaveBeenCalledWith(1, {
      type: 'deposit',
      amount: 200,
      funding_source_id: 1,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('fiatSubmitHandler no-op when wallet id or amount missing', async () => {
    getWalletStateRef.value.data = null;
    const api = useVFormAddFunds(evmDataRef, onClose);
    api.fiatModel.value = { amount: 200, funding_source_id: 1 };
    await api.fiatSubmitHandler();
    expect(addTransaction).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
