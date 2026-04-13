import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { EvmTransactionStatusTypes, EvmTransactionTypes } from '../evm.types';

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock('InvestCommon/config/env', () => ({
  default: {
    EVM_URL: 'https://evm.test',
  },
}));

vi.mock('InvestCommon/data/service/apiClient', () => ({
  ApiClient: class {
    get = apiGetMock;
    post = vi.fn();
    options = vi.fn();
    put = vi.fn();
  },
}));

vi.mock('InvestCommon/data/filer/publicImage', () => ({
  buildPublicFilerImageUrl: vi.fn(() => undefined),
}));

import { useRepositoryEvm } from '../evm.repository';

describe('useRepositoryEvm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    apiGetMock.mockReset();
  });

  it('hydrates all-chain wallet state with sepolia balances and wallet transactions', async () => {
    apiGetMock
      .mockResolvedValueOnce({
        data: {
          profile_id: 1124,
          wallet_status: 'created',
          chains: [
            { chain: 'ethereum', wallet_address: '', chain_account_status: 'pending' },
            { chain: 'polygon', wallet_address: '', chain_account_status: 'pending' },
          ],
          updated_at: '2026-04-08T17:35:45Z',
        },
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        data: {
          profile_id: 1124,
          wallet_status: 'verified',
          deposit_instructions: {
            chain: 'ethereum-sepolia',
            address: '0xsep-wallet',
          },
          balances: [
            { asset: 'USDC', address: '0xusdc', amount: '10.0' },
          ],
          updated_at: '2026-04-08T17:36:45Z',
        },
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        data: {
          transactions: [
            {
              id: 77,
              user_id: 500,
              dest_wallet_id: 1124,
              source_wallet_id: null,
              investment_id: null,
              type: 'deposit',
              amount: '12.5',
              ticker: 'USDC',
              network: 'base',
              status: 'processed',
              tx_hash: '0xhash-77',
              created_at: '2026-04-08T17:37:45Z',
              updated_at: '2026-04-08T17:38:45Z',
              type_display: 'Crypto Deposit',
              description: 'Deposit received',
            },
          ],
        },
        headers: new Headers(),
      });

    const store = useRepositoryEvm();
    await store.getEvmWalletByProfile(1124, [], 'all');

    expect(apiGetMock).toHaveBeenCalledTimes(3);
    expect(apiGetMock).toHaveBeenNthCalledWith(1, '/auth/wallet/1124', {
      params: { chain: 'all' },
    });
    expect(apiGetMock).toHaveBeenNthCalledWith(2, '/auth/wallet/1124', {
      params: { chain: 'ethereum-sepolia' },
    });
    expect(apiGetMock).toHaveBeenNthCalledWith(3, '/auth/wallet/1124/transactions', {
      params: { chain: 'all' },
    });
    expect(store.getEvmWalletState.data?.chains).toEqual([
      { chain: 'ethereum', wallet_address: '', chain_account_status: 'pending' },
      { chain: 'polygon', wallet_address: '', chain_account_status: 'pending' },
    ]);
    expect(store.getEvmWalletState.data?.address).toBe('0xsep-wallet');
    expect(store.getEvmWalletState.data?.deposit_instructions).toEqual({
      chain: 'ethereum-sepolia',
      address: '0xsep-wallet',
    });
    expect(store.getEvmWalletState.data?.balances).toEqual([
      expect.objectContaining({
        address: '0xusdc',
        symbol: 'USDC',
        amount: 10,
      }),
    ]);
    expect(store.getEvmWalletState.data?.transactions).toEqual([
      expect.objectContaining({
        id: 77,
        type: EvmTransactionTypes.deposit,
        status: EvmTransactionStatusTypes.processed,
        transaction_tx: '0xhash-77',
      }),
    ]);
    expect(store.getEvmWalletState.data?.formattedTransactions).toEqual([
      expect.objectContaining({
        id: 77,
        amountFormatted: '+ 12.5 USDC',
        txShort: '0xhash-77',
      }),
    ]);
  });

  it('normalizes wrapped transactions responses and exposes the helper method', async () => {
    apiGetMock.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: '81',
            user_id: '8',
            source_wallet_id: '4',
            dest_wallet_id: '9',
            investment_id: '22',
            type: 'exchange',
            amount: 200,
            symbol: 'USDT',
            network: 'polygon',
            status: 'wait',
            hash: '0xexchange',
            scan_tx_url: 'https://scan.test/tx/0xexchange',
            wallet_address: '0xwallet',
            created_at: '2026-04-08T17:37:45Z',
            updated_at: '2026-04-08T17:38:45Z',
          },
        ],
      },
      headers: new Headers(),
    });

    const store = useRepositoryEvm();
    const transactions = await store.getEvmWalletTransactions(9, 'polygon');

    expect(apiGetMock).toHaveBeenCalledWith('/auth/wallet/9/transactions', {
      params: { chain: 'polygon' },
    });
    expect(transactions).toEqual([
      expect.objectContaining({
        id: 81,
        user_id: 8,
        source_wallet_id: 4,
        dest_wallet_id: 9,
        investment_id: 22,
        type: EvmTransactionTypes.exchange,
        status: EvmTransactionStatusTypes.wait,
        transaction_tx: '0xexchange',
        scan_tx_url: 'https://scan.test/tx/0xexchange',
        address: '0xwallet',
      }),
    ]);
  });

  it('does not perform a sepolia follow-up when the aggregate response already includes balances', async () => {
    apiGetMock
      .mockResolvedValueOnce({
        data: {
          profile_id: 1124,
          wallet_status: 'verified',
          chains: [
            { chain: 'ethereum', wallet_address: '0xeth-wallet', chain_account_status: 'verified' },
          ],
          balances: [
            { asset: 'USDC', address: '0xusdc', amount: '5.0' },
          ],
          updated_at: '2026-04-08T17:35:45Z',
        },
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        data: [],
        headers: new Headers(),
      });

    const store = useRepositoryEvm();
    await store.getEvmWalletByProfile(1124, []);

    expect(apiGetMock).toHaveBeenCalledTimes(2);
    expect(store.getEvmWalletState.data?.balances).toEqual([
      expect.objectContaining({
        address: '0xusdc',
        symbol: 'USDC',
        amount: 5,
      }),
    ]);
    expect(store.getEvmWalletState.data?.transactions).toEqual([]);
  });

  it('keeps wallet data usable when the transactions request fails', async () => {
    apiGetMock
      .mockResolvedValueOnce({
        data: {
          profile_id: 1124,
          wallet_status: 'verified',
          chains: [
            { chain: 'ethereum', wallet_address: '0xeth-wallet', chain_account_status: 'verified' },
          ],
          balances: [
            { asset: 'USDC', address: '0xusdc', amount: '5.0' },
          ],
          updated_at: '2026-04-08T17:35:45Z',
        },
        headers: new Headers(),
      })
      .mockRejectedValueOnce(new Error('transactions failed'));

    const store = useRepositoryEvm();
    await store.getEvmWalletByProfile(1124, []);

    expect(store.getEvmWalletState.error).toBeNull();
    expect(store.getEvmWalletState.data).toEqual(expect.objectContaining({
      id: 1124,
      address: '0xeth-wallet',
    }));
    expect(store.getEvmWalletState.data?.transactions).toEqual([]);
  });

  it('applies earn overlays on top of backend transactions', async () => {
    apiGetMock
      .mockResolvedValueOnce({
        data: {
          profile_id: 1124,
          wallet_status: 'verified',
          chains: [
            { chain: 'ethereum', wallet_address: '0xeth-wallet', chain_account_status: 'verified' },
          ],
          balances: [
            { asset: 'USDC', address: '0xusdc', amount: '25.0', symbol: 'USDC' },
          ],
          updated_at: '2026-04-08T17:35:45Z',
        },
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              id: 90,
              type: 'deposit',
              amount: '10',
              symbol: 'USDC',
              network: 'ethereum',
              status: 'processed',
              transaction_tx: '0xexisting',
              created_at: '2026-04-08T17:36:45Z',
              updated_at: '2026-04-08T17:36:45Z',
            },
          ],
        },
        headers: new Headers(),
      });

    const store = useRepositoryEvm();
    await store.getEvmWalletByProfile(1124, [{
      profileId: 1124,
      symbol: 'USDC',
      name: 'USDC Earn',
      stakedAmountUsd: 5,
      transactions: [
        { id: 91, type: 'deposit', amountUsd: 3, status: 'completed', txId: '0xearn' },
      ],
    }]);

    expect(store.getEvmWalletState.data?.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 90, transaction_tx: '0xexisting' }),
      expect.objectContaining({ id: 91, transaction_tx: '0xearn', type_display: 'Earn Supply' }),
    ]));
    expect(store.getEvmWalletState.data?.balances).toEqual([
      expect.objectContaining({
        address: '0xusdc',
        amount: 20,
      }),
    ]);
  });
});
