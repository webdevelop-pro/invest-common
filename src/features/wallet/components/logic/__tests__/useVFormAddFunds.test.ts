import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const getEvmWalletStateRef = ref({
  data: {
    address: '0xCABBAc435948510D24820746Ee29706a05A54369',
    balances: [
      { id: 1, symbol: 'USDC', name: 'USD Coin', address: '0xusdc', amount: 1000 },
      { id: 2, symbol: 'ETH', name: 'Ether', address: '0xeth', amount: 0.5 },
    ],
  },
  loading: false,
  error: null as Error | null,
});

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

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
  }),
}));
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
vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock') },
}));
vi.mock('@vueuse/core', () => ({
  useClipboard: () => ({ copy: vi.fn(), copied: ref(false) }),
}));

import { useVFormAddFunds } from '../useVFormAddFunds';

describe('useVFormAddFunds', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    setActivePinia(createPinia());
    getEvmWalletStateRef.value = {
      data: {
        address: '0xCABBAc435948510D24820746Ee29706a05A54369',
        balances: [
          { id: 1, symbol: 'USDC', name: 'USD Coin', address: '0xusdc', amount: 1000 },
          { id: 2, symbol: 'ETH', name: 'Ether', address: '0xeth', amount: 0.5 },
        ],
      },
      loading: false,
      error: null,
    };
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

  it('returns deposit method, fiat model, funding sources, and crypto fields', () => {
    const api = useVFormAddFunds(onClose);
    expect(api.depositMethod).toBeDefined();
    expect(api.fiatModel).toBeDefined();
    expect(api.fundingSourceFormatted).toBeDefined();
    expect(api.isFiatSubmitDisabled).toBeDefined();
    expect(api.fiatSubmitHandler).toBeDefined();
    expect(api.assetOptions).toBeDefined();
    expect(api.selectedAsset).toBeDefined();
    expect(api.maxFiatAmount).toBeDefined();
    expect(api.maxFiatAmount.value).toBe(1_000_000);
  });

  it('defaults depositMethod to crypto', () => {
    const api = useVFormAddFunds(onClose);
    expect(api.depositMethod.value).toBe('crypto');
  });

  it('fundingSourceFormatted maps wallet funding_source', () => {
    const api = useVFormAddFunds(onClose);
    expect(api.fundingSourceFormatted.value).toHaveLength(2);
    expect(api.fundingSourceFormatted.value[0].text).toContain('Chase');
    expect(api.fundingSourceFormatted.value[0].id).toBe('1');
  });

  it('assetOptions exposes USDC from useVFormAddFundsCrypto', () => {
    const api = useVFormAddFunds(onClose);
    expect(api.assetOptions.value).toHaveLength(1);
    expect(api.assetOptions.value[0].value).toBe('USDC');
    expect(api.assetOptions.value[0].text).toBe('USDC');
  });

  it('isFiatSubmitDisabled is false when amount and funding source are set', () => {
    const api = useVFormAddFunds(onClose);
    api.fiatModel.amount = 100;
    api.fiatModel.funding_source_id = 1;
    expect(api.isFiatSubmitDisabled.value).toBe(false);
  });

  it('fiatSubmitHandler calls addTransaction and onClose', async () => {
    const api = useVFormAddFunds(onClose);
    api.fiatModel.amount = 200;
    api.fiatModel.funding_source_id = 1;
    await api.fiatSubmitHandler();
    expect(addTransaction).toHaveBeenCalledWith(1, {
      type: 'deposit',
      amount: 200,
      funding_source_id: 1,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('fiatSubmitHandler does not call addTransaction when form invalid', async () => {
    const api = useVFormAddFunds(onClose);
    api.fiatModel.amount = undefined;
    api.fiatModel.funding_source_id = undefined;
    await api.fiatSubmitHandler();
    expect(addTransaction).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
