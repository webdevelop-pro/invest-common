import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useVFormFundsWithdraw } from '../useVFormFundsWithdraw';
import { EvmWalletStatusTypes } from 'InvestCommon/data/evm/evm.types';

const testWalletData = {
  id: 123,
  status: EvmWalletStatusTypes.verified,
  balance: 1000,
  pending_incoming_balance: 0,
  pending_outgoing_balance: 0,
  address: '0x1234567890abcdef',
  balances: [
    { address: '0xtoken1', amount: 500, symbol: 'USDC', name: 'USD Coin' },
    { address: '0xtoken2', amount: 1000, symbol: 'ETH', name: 'Ethereum' },
  ],
};

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: vi.fn(() => ({
    getEvmWalletState: ref({ data: testWalletData, loading: false, error: null }),
    withdrawFundsState: ref({ data: undefined, loading: false, error: null }),
    withdrawFunds: vi.fn().mockResolvedValue(undefined),
    getEvmWalletByProfile: vi.fn(),
  })),
}));

describe('useVFormFundsWithdraw', () => {
  let mockEmitClose: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockEmitClose = vi.fn();
  });

  it('should initialize correctly', () => {
    const { model, isValid, isDisabledButton } = useVFormFundsWithdraw(mockEmitClose);
    expect(model.wallet_id).toBe(123);
    expect(isValid.value).toBeDefined();
    expect(isDisabledButton.value).toBeDefined();
  });

  it('should work without emitClose', () => {
    const { model } = useVFormFundsWithdraw();
    expect(model.wallet_id).toBe(123);
  });

  it('should compute properties correctly', () => {
    const { tokenFormatted, text } = useVFormFundsWithdraw(mockEmitClose);

    expect(tokenFormatted.value).toEqual([
      { text: 'USD Coin: USDC', id: '0xtoken1' },
      { text: 'Ethereum: ETH', id: '0xtoken2' },
    ]);
    expect(text.value).toBe('available 500');
  });

  it('should validate form', async () => {
    const { model, onValidate, isValid } = useVFormFundsWithdraw(mockEmitClose);
    model.amount = 100;
    model.token = '0xtoken1';
    model.to = '0xdestination123';
    model.wallet_id = 123;

    await onValidate();
    expect(isValid.value).toBeDefined();
  });

  it('should handle save and cancel', async () => {
    const { model, saveHandler, cancelHandler } = useVFormFundsWithdraw(mockEmitClose);
    
    model.amount = 100;
    model.token = '0xtoken1';
    model.to = '0xdestination123';
    model.wallet_id = 123;
    await saveHandler();
    expect(mockEmitClose).toHaveBeenCalled();

    cancelHandler();
    expect(mockEmitClose).toHaveBeenCalledTimes(2);
  });

  it('should not save invalid form', async () => {
    const { model, saveHandler } = useVFormFundsWithdraw(mockEmitClose);
    model.amount = 0;
    model.token = '';
    model.to = '';
    model.wallet_id = 0;

    await saveHandler();
    expect(mockEmitClose).not.toHaveBeenCalled();
  });

  it('should handle schema generation', () => {
    const { schemaAddTransaction } = useVFormFundsWithdraw(mockEmitClose);
    
    expect(schemaAddTransaction.value).toBeDefined();
    
    const requiredFields = schemaAddTransaction.value?.definitions?.Individual?.required;
    expect(requiredFields).toContain('amount');
    expect(requiredFields).toContain('token');
    expect(requiredFields).toContain('to');
    expect(requiredFields).toContain('wallet_id');
  });

  it('should handle error data', () => {
    const { errorData } = useVFormFundsWithdraw(mockEmitClose);
    expect(errorData.value).toBeUndefined();
  });
});