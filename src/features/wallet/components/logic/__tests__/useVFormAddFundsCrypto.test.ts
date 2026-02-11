import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const mockEvmData = {
  id: 1,
  address: '0xCABBAc435948510D24820746Ee29706a05A54369',
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

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
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

describe('useVFormAddFundsCrypto', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getEvmWalletStateRef.value = {
      data: { ...mockEvmData },
      loading: false,
      error: null,
    };
    mockCopy.mockClear();
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
  });

  it('address is derived from evm wallet state', () => {
    const api = useVFormAddFundsCrypto();
    expect(api.address.value).toBe('0xCABBAc435948510D24820746Ee29706a05A54369');
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

  it('depositNetworkLabel is ETH Ethereum (ERC20)', () => {
    const api = useVFormAddFundsCrypto();
    expect(api.depositNetworkLabel).toBe('ETH Ethereum (ERC20)');
  });

  it('selectedAssetWarning includes selected asset and network', () => {
    const api = useVFormAddFundsCrypto();
    expect(api.selectedAssetWarning.value).toContain('USDC');
    expect(api.selectedAssetWarning.value).toContain('Ethereum (ERC20)');
  });

  it('onCopyClick copies address when present', () => {
    const api = useVFormAddFundsCrypto();
    api.onCopyClick();
    expect(mockCopy).toHaveBeenCalledWith('0xCABBAc435948510D24820746Ee29706a05A54369');
  });
});
