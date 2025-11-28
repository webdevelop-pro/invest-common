import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useVFormFundsExchange } from '../useVFormFundsExchange';
import { EvmWalletStatusTypes } from 'InvestCommon/data/evm/evm.types';

const testWalletData = {
  id: 123,
  status: EvmWalletStatusTypes.verified,
  balance: 1000,
  pending_incoming_balance: 0,
  pending_outgoing_balance: 0,
  address: '0x1234567890abcdef',
  balances: [
    { address: '0xtoken1', amount: 500, symbol: 'USDC', name: 'USD Coin', price_per_usd: 1.0 },
    { address: '0xtoken2', amount: 1000, symbol: 'ETH', name: 'Ethereum', price_per_usd: 0.0003 },
  ],
};

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: vi.fn(() => ({
    getEvmWalletState: ref({ data: testWalletData, loading: false, error: null }),
    exchangeTokensState: ref({ data: undefined, loading: false, error: null }),
    exchangeTokensOptionsState: ref({ data: undefined, loading: false, error: null }),
    exchangeTokens: vi.fn().mockResolvedValue(undefined),
    exchangeTokensOptions: vi.fn().mockResolvedValue(undefined),
    getEvmWalletByProfile: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('useVFormFundsExchange', () => {
  let mockEmitClose: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockEmitClose = vi.fn();
  });

  it('should initialize correctly', () => {
    const { model, isValid, isDisabledButton } = useVFormFundsExchange(mockEmitClose);
    expect(model.wallet_id).toBe(123);
    expect(model.to).toBe('0xe2cCb3fc0153584e5C70c65849078b55597b4032');
    expect(isValid.value).toBeDefined();
    expect(isDisabledButton.value).toBeDefined();
  });

  it('should work without emitClose', () => {
    const { model } = useVFormFundsExchange();
    expect(model.wallet_id).toBe(123);
    expect(model.to).toBe('0xe2cCb3fc0153584e5C70c65849078b55597b4032');
  });

  it('should compute properties correctly', () => {
    const { tokenFormatted, tokenToFormatted, text } = useVFormFundsExchange(mockEmitClose);

    expect(tokenFormatted.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'USD Coin: USDC',
          id: '0xtoken1',
          address: '0xtoken1',
          amount: 500,
          symbol: 'USDC',
          name: 'USD Coin',
          price_per_usd: 1.0
        }),
        expect.objectContaining({
          text: 'Ethereum: ETH',
          id: '0xtoken2',
          address: '0xtoken2',
          amount: 1000,
          symbol: 'ETH',
          name: 'Ethereum',
          price_per_usd: 0.0003
        })
      ])
    );
    
    expect(tokenToFormatted.value).toEqual([
      expect.objectContaining({
        text: 'USDC',
        id: '0xe2cCb3fc0153584e5C70c65849078b55597b4032',
        icon: '/img/tokens/usdc.svg',
        symbol: 'USDC',
        name: 'USD Coin'
      })
    ]);
    
    expect(text.value).toBe('available 500');
  });

  it('should validate form', async () => {
    const { model, onValidate, isValid } = useVFormFundsExchange(mockEmitClose);
    model.amount = 100;
    model.from = '0xtoken1';
    model.to = '0xe2cCb3fc0153584e5C70c65849078b55597b4032';
    model.wallet_id = 123;

    await onValidate();
    expect(isValid.value).toBeDefined();
  });

  it('should handle save and cancel', async () => {
    const { model, saveHandler, cancelHandler } = useVFormFundsExchange(mockEmitClose);
    
    model.amount = 100;
    model.from = '0xtoken1';
    model.to = '0xe2cCb3fc0153584e5C70c65849078b55597b4032';
    model.wallet_id = 123;
    await saveHandler();
    expect(mockEmitClose).toHaveBeenCalled();

    cancelHandler();
    expect(mockEmitClose).toHaveBeenCalledTimes(2);
  });

  it('should not save invalid form', async () => {
    const { model, saveHandler } = useVFormFundsExchange(mockEmitClose);
    model.amount = 0;
    model.from = '';
    model.to = '';
    model.wallet_id = 0;

    await saveHandler();
    expect(mockEmitClose).not.toHaveBeenCalled();
  });

  it('should handle schema generation', () => {
    const { schemaExchangeTransaction } = useVFormFundsExchange(mockEmitClose);
    
    expect(schemaExchangeTransaction.value).toBeDefined();
    
    const requiredFields = schemaExchangeTransaction.value?.definitions?.WalletExchange?.required;
    expect(requiredFields).toBeDefined();
    expect(Array.isArray(requiredFields)).toBe(true);
    expect(requiredFields).toContain('from');
    expect(requiredFields).toContain('to');
    expect(requiredFields).toContain('amount');
    expect(requiredFields).toContain('wallet_id');
  });

  it('should handle error data', () => {
    const { errorData } = useVFormFundsExchange(mockEmitClose);
    expect(errorData.value).toBeUndefined();
  });

  it('should compute tokenFormatted correctly', () => {
    const { tokenFormatted } = useVFormFundsExchange(mockEmitClose);
    
    expect(tokenFormatted.value).toHaveLength(2);
    expect(tokenFormatted.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'USD Coin: USDC',
          id: '0xtoken1',
          address: '0xtoken1',
          amount: 500,
          symbol: 'USDC',
          name: 'USD Coin',
          price_per_usd: 1.0
        }),
        expect.objectContaining({
          text: 'Ethereum: ETH',
          id: '0xtoken2',
          address: '0xtoken2',
          amount: 1000,
          symbol: 'ETH',
          name: 'Ethereum',
          price_per_usd: 0.0003
        })
      ])
    );
  });

  it('should compute maxExchange from selectedFromToken', () => {
    const { model } = useVFormFundsExchange(mockEmitClose);
    
    model.from = '0xtoken1';
    
    const { text } = useVFormFundsExchange(mockEmitClose);
    expect(text.value).toBe('available 500');
  });

  it('should compute exchangeRate correctly', () => {
    const { model, exchangeRate, selectedToken } = useVFormFundsExchange(mockEmitClose);
    
    model.from = '0xtoken1';
    expect(exchangeRate.value).toBe(1.0);
    expect(selectedToken.value?.symbol).toBe('USDC');
    
    model.from = '0xtoken2';
    expect(exchangeRate.value).toBe(0.0003);
    expect(selectedToken.value?.symbol).toBe('ETH');
  });

  it('should return undefined exchangeRate when no token selected', () => {
    const { model, exchangeRate } = useVFormFundsExchange(mockEmitClose);
    
    model.from = '';
    expect(exchangeRate.value).toBeUndefined();
  });
});
