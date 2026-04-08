import { describe, expect, it } from 'vitest';
import { EvmWalletStatusTypes } from '../evm.types';
import {
  extractDepositAddressFromWalletInfo,
  isEvmWalletLegacyResponse,
  normalizeEvmWalletInfoResponse,
} from '../evm.helpers';

describe('evm.helpers', () => {
  it('keeps the legacy wallet info payload unchanged', () => {
    const payload = {
      id: 10,
      status: EvmWalletStatusTypes.verified,
      balance: '123.45',
      inc_balance: 1,
      out_balance: 2,
      address: '0xabc',
      balances: {},
      transactions: [],
      created_at: '2026-04-08T17:35:45Z',
      updated_at: '2026-04-08T17:35:45Z',
    };

    expect(isEvmWalletLegacyResponse(payload)).toBe(true);
    expect(normalizeEvmWalletInfoResponse(payload)).toEqual(payload);
  });

  it('normalizes the new status-only wallet info payload into the legacy wallet shape', () => {
    const payload = {
      profile_id: 1124,
      wallet_status: 'created',
      chains: [
        { chain: 'ethereum', wallet_address: '', chain_account_status: 'pending' },
        { chain: 'polygon', wallet_address: '', chain_account_status: 'pending' },
      ],
      updated_at: '2026-04-08T17:35:45Z',
    };

    expect(normalizeEvmWalletInfoResponse(payload)).toEqual({
      id: 1124,
      status: EvmWalletStatusTypes.created,
      balance: '0',
      inc_balance: 0,
      out_balance: 0,
      address: '',
      chains: [
        { chain: 'ethereum', wallet_address: '', chain_account_status: 'pending' },
        { chain: 'polygon', wallet_address: '', chain_account_status: 'pending' },
      ],
      balances: {},
      transactions: [],
      created_at: '2026-04-08T17:35:45Z',
      updated_at: '2026-04-08T17:35:45Z',
    });
  });

  it('falls back to the first available chain wallet address', () => {
    const payload = {
      profile_id: 1124,
      wallet_status: 'verified',
      chains: [
        { chain: 'ethereum', wallet_address: '', chain_account_status: 'verified' },
        { chain: 'base', wallet_address: '0xbase', chain_account_status: 'verified' },
      ],
      updated_at: '2026-04-08T17:35:45Z',
    };

    expect(normalizeEvmWalletInfoResponse(payload).address).toBe('0xbase');
  });

  it('keeps normalized chain addresses for downstream network selection', () => {
    const payload = {
      profile_id: 1124,
      wallet_status: 'verified',
      chains: [
        { chain: 'ethereum', wallet_address: '0xeth', chain_account_status: 'verified' },
        { chain: 'base', wallet_address: '0xbase', chain_account_status: 'verified' },
      ],
      updated_at: '2026-04-08T17:35:45Z',
    };

    expect(normalizeEvmWalletInfoResponse(payload).chains).toEqual([
      { chain: 'ethereum', wallet_address: '0xeth', chain_account_status: 'verified' },
      { chain: 'base', wallet_address: '0xbase', chain_account_status: 'verified' },
    ]);
  });

  it('prefers deposit instructions address when present', () => {
    const payload = {
      profile_id: 1124,
      wallet_status: 'verified',
      deposit_instructions: {
        chain: 'ethereum',
        address: '0xinstructions',
      },
      balances: [
        { asset: 'USDC', address: '0xusdc-balance', amount: '0' },
      ],
      updated_at: '2026-04-08T17:35:45Z',
    };

    expect(extractDepositAddressFromWalletInfo(payload)).toBe('0xinstructions');
  });

  it('falls back to the USDC balance address when deposit instructions are empty', () => {
    const payload = {
      profile_id: 1124,
      wallet_status: 'verified',
      chain: 'ethereum',
      deposit_instructions: {
        chain: 'ethereum',
        address: '',
      },
      balances: [
        { asset: 'ETH', address: '0xeth-balance', amount: '1' },
        { asset: 'USDC', address: '0xusdc-balance', amount: '0' },
      ],
      updated_at: '2026-04-08T17:35:45Z',
    };

    expect(extractDepositAddressFromWalletInfo(payload)).toBe('0xusdc-balance');
  });
});
