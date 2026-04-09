import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

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

  it('hydrates all-chain wallet state with sepolia balances when the aggregate response has none', async () => {
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
      });

    const store = useRepositoryEvm();
    await store.getEvmWalletByProfile(1124, []);

    expect(apiGetMock).toHaveBeenCalledTimes(2);
    expect(apiGetMock).toHaveBeenNthCalledWith(1, '/auth/wallet/1124', {
      params: { chain: 'all' },
    });
    expect(apiGetMock).toHaveBeenNthCalledWith(2, '/auth/wallet/1124', {
      params: { chain: 'ethereum-sepolia' },
    });
    expect(store.getEvmWalletState.data?.chains).toEqual([
      { chain: 'ethereum', wallet_address: '', chain_account_status: 'pending' },
      { chain: 'polygon', wallet_address: '', chain_account_status: 'pending' },
    ]);
    expect(store.getEvmWalletState.data?.address).toBe('0xsep-wallet');
    expect(store.getEvmWalletState.data?.balances).toEqual([
      expect.objectContaining({
        address: '0xusdc',
        symbol: 'USDC',
        amount: 10,
      }),
    ]);
  });

  it('does not perform a sepolia follow-up when the aggregate response already includes balances', async () => {
    apiGetMock.mockResolvedValueOnce({
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
    });

    const store = useRepositoryEvm();
    await store.getEvmWalletByProfile(1124, []);

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(store.getEvmWalletState.data?.balances).toEqual([
      expect.objectContaining({
        address: '0xusdc',
        symbol: 'USDC',
        amount: 5,
      }),
    ]);
  });
});
