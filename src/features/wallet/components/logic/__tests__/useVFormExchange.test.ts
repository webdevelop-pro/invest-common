import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, reactive } from 'vue';

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
  data: { id: 1, balances },
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
const exchangeTokens = vi.fn().mockResolvedValue(undefined);
const exchangeTokensOptions = vi.fn().mockResolvedValue(undefined);

const mockSelectedUserProfileId = ref(1);

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    exchangeTokensState: exchangeTokensStateRef,
    exchangeTokensOptionsState: exchangeTokensOptionsStateRef,
    exchangeTokens,
    exchangeTokensOptions,
    getEvmWalletByProfile: vi.fn().mockResolvedValue(undefined),
  }),
}));
vi.mock('InvestCommon/data/earn/earn.repository', () => ({
  useRepositoryEarn: () => ({
    getPositions: vi.fn(),
  }),
}));
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: mockSelectedUserProfileId,
  }),
}));
vi.mock('UiKit/helpers/validation/useFormValidation', () => ({
  useFormValidation: () => ({
    model: reactive({
      from: '0xusdc',
      to: '0xusdc',
      amount: undefined as number | undefined,
      wallet_id: 1,
    }),
    isValid: ref(true),
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
    getEvmWalletStateRef.value = {
      data: { id: 1, balances: [...balances] },
      loading: false,
      error: null,
    };
    exchangeTokensStateRef.value = { loading: false, error: null, data: null };
    exchangeTokens.mockClear();
    exchangeTokensOptions.mockClear();
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

  it('tokenFormatted returns unique tokens from balances', () => {
    const api = useVFormExchange();
    expect(api.tokenFormatted.value.length).toBeGreaterThanOrEqual(1);
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
});
