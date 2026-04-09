import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';

const mockEvmData = {
  id: 1,
  address: '0xCABBAc435948510D24820746Ee29706a05A54369',
  deposit_instructions: {
    chain: 'ethereum-sepolia',
    address: '0xDEPOSIT-SEPOLIA',
  },
  chains: [
    { chain: 'ethereum', wallet_address: '0xETH', chain_account_status: 'verified' },
    { chain: 'base', wallet_address: '0xBASE', chain_account_status: 'verified' },
  ],
  balances: [
    { id: 1, symbol: 'USDC', name: 'USD Coin', address: '0xusdc', amount: 1000 },
    { id: 2, symbol: 'ETH', name: 'Ether', address: '0xeth', amount: 0.5 },
  ],
  fundingBalance: 2500,
  rwaValue: 500,
};

const getEvmWalletStateRef = ref({
  data: mockEvmData,
  loading: false,
  error: null as Error | null,
});
const getDepositNetworkByProfile = vi.fn().mockResolvedValue({ chain: 'ethereum-sepolia', wallet_address: '', chain_account_status: 'verified' });

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    getDepositNetworkByProfile,
    depositWalletChains: ['ethereum', 'polygon', 'base', 'ethereum-sepolia'],
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: ref(1),
  }),
}));

const mockCopy = vi.fn();
vi.mock('@vueuse/core', () => ({
  useClipboard: () => ({
    copy: mockCopy,
    copied: ref(false),
  }),
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
  },
}));

import { useVFormAddFundsCrypto } from '../useVFormAddFundsCrypto';
import { DEFAULT_WALLET_NETWORK, useWalletNetwork } from '../../../logic/useWalletNetwork';

describe('useVFormAddFundsCrypto', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useWalletNetwork().selectedNetwork.value = DEFAULT_WALLET_NETWORK;
    getEvmWalletStateRef.value = {
      data: { ...mockEvmData },
      loading: false,
      error: null,
    };
    mockCopy.mockClear();
    getDepositNetworkByProfile.mockClear();
  });

  it('returns address, QR, clipboard, asset options, and labels', () => {
    const api = useVFormAddFundsCrypto();
    expect(api.address).toBeDefined();
    expect(api.qrCodeDataURL).toBeDefined();
    expect(api.isGeneratingQR).toBeDefined();
    expect(api.copied).toBeDefined();
    expect(api.onCopyClick).toBeDefined();
    expect(api.assetOptions).toBeDefined();
    expect(api.selectedAsset).toBeDefined();
    expect(api.selectedAssetWarning).toBeDefined();
    expect(api.depositNetworkLabel).toBeDefined();
    expect(api.networkOptions).toBeDefined();
    expect(api.selectedNetwork).toBeDefined();
  });

  it('prefers deposit instructions address for the selected network', () => {
    const api = useVFormAddFundsCrypto();
    expect(api.selectedNetwork.value).toBe('ethereum-sepolia');
    expect(api.address.value).toBe('0xDEPOSIT-SEPOLIA');
    api.selectedNetwork.value = 'base';
    expect(api.address.value).toBe('0xBASE');
    getEvmWalletStateRef.value = { data: null, loading: false, error: null };
    const api2 = useVFormAddFundsCrypto();
    expect(api2.address.value).toBeUndefined();
  });

  it('assetOptions exposes only USDC, disabled when no USDC in balances', () => {
    const api = useVFormAddFundsCrypto();
    expect(api.assetOptions.value).toHaveLength(1);
    expect(api.assetOptions.value[0]).toEqual({
      value: 'USDC',
      text: 'USDC',
      disabled: false,
    });
    getEvmWalletStateRef.value = {
      data: { ...mockEvmData, balances: [{ symbol: 'ETH', name: 'Ether' }] },
      loading: false,
      error: null,
    };
    const apiNoUsdc = useVFormAddFundsCrypto();
    expect(apiNoUsdc.assetOptions.value[0].disabled).toBe(true);
  });

  it('selectedAsset defaults to USDC', () => {
    const api = useVFormAddFundsCrypto();
    expect(api.selectedAsset.value).toBe('USDC');
  });

  it('builds selectable network options from created wallet addresses', () => {
    const api = useVFormAddFundsCrypto();
    expect(api.networkOptions.value).toEqual([
      {
        value: 'ethereum',
        text: 'ETH Ethereum (ERC20)',
        address: '0xETH',
        warningLabel: 'Ethereum (ERC20)',
      },
      {
        value: 'polygon',
        text: 'POL Polygon',
        address: '',
        warningLabel: 'Polygon',
      },
      {
        value: 'base',
        text: 'BASE Base',
        address: '0xBASE',
        warningLabel: 'Base',
      },
      {
        value: 'ethereum-sepolia',
        text: 'ETH Ethereum Sepolia',
        address: '',
        warningLabel: 'Ethereum Sepolia',
      },
    ]);
    expect(api.depositNetworkLabel.value).toBe('ETH Ethereum Sepolia');
  });

  it('selectedAssetWarning follows the selected network', () => {
    const api = useVFormAddFundsCrypto();
    expect(api.selectedAssetWarning.value).toContain('USDC');
    expect(api.selectedAssetWarning.value).toContain('Ethereum Sepolia');
    api.selectedNetwork.value = 'base';
    expect(api.selectedAssetWarning.value).toContain('Base');
  });

  it('onCopyClick copies address when present', () => {
    const api = useVFormAddFundsCrypto();
    api.onCopyClick();
    expect(mockCopy).toHaveBeenCalledWith('0xDEPOSIT-SEPOLIA');
  });

  it('falls back to the legacy single wallet address for ethereum-sepolia when chains are unavailable', async () => {
    getEvmWalletStateRef.value = {
      data: {
        ...mockEvmData,
        deposit_instructions: undefined,
        chains: undefined,
      },
      loading: false,
      error: null,
    };

    const api = useVFormAddFundsCrypto();
    await Promise.resolve();
    await nextTick();
    expect(api.networkOptions.value).toHaveLength(4);
    expect(api.address.value).toBe('0xCABBAc435948510D24820746Ee29706a05A54369');
  });

  it('uses deposit instructions when they match a non-default selected network', () => {
    getEvmWalletStateRef.value = {
      data: {
        ...mockEvmData,
        deposit_instructions: {
          chain: 'base',
          address: '0xBASE-DEPOSIT',
        },
      },
      loading: false,
      error: null,
    };

    const api = useVFormAddFundsCrypto();
    api.selectedNetwork.value = 'base';

    expect(api.address.value).toBe('0xBASE-DEPOSIT');
  });

  it('loads the selected network address on demand when chains are missing in wallet state', async () => {
    getDepositNetworkByProfile
      .mockResolvedValueOnce({
        chain: 'ethereum-sepolia',
        wallet_address: '',
        chain_account_status: 'verified',
      })
      .mockResolvedValueOnce({
        chain: 'base',
        wallet_address: '0xBASE-FETCHED',
        chain_account_status: 'verified',
      });
    getEvmWalletStateRef.value = {
      data: {
        ...mockEvmData,
        address: '',
        chains: undefined,
      },
      loading: false,
      error: null,
    };

    const api = useVFormAddFundsCrypto();
    api.selectedNetwork.value = 'base';
    await nextTick();
    await Promise.resolve();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(getDepositNetworkByProfile).toHaveBeenNthCalledWith(1, 1, 'ethereum-sepolia');
    expect(getDepositNetworkByProfile).toHaveBeenNthCalledWith(2, 1, 'base');
  });

  it('does not fetch when chain addresses are already present in wallet state', async () => {
    useVFormAddFundsCrypto();
    await Promise.resolve();
    await nextTick();

    expect(getDepositNetworkByProfile).not.toHaveBeenCalled();
  });
});
