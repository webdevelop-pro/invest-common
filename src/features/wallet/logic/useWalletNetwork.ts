import { computed, shallowRef } from 'vue';
import type { WalletChain } from 'InvestCommon/data/evm/evm.repository';

export type WalletNetworkOption = {
  value: Exclude<WalletChain, 'all'>;
  text: string;
  warningLabel: string;
};

export const DEFAULT_WALLET_NETWORK: Exclude<WalletChain, 'all'> = 'ethereum-sepolia';

const WALLET_NETWORKS: Exclude<WalletChain, 'all'>[] = [
  'ethereum',
  'polygon',
  'base',
  'ethereum-sepolia',
];

const selectedWalletNetwork = shallowRef<Exclude<WalletChain, 'all'>>(DEFAULT_WALLET_NETWORK);

export const getWalletNetworkPresentation = (chain: string) => {
  const normalizedChain = chain.trim().toLowerCase();

  switch (normalizedChain) {
    case 'ethereum':
      return {
        selectLabel: 'ETH Ethereum (ERC20)',
        warningLabel: 'Ethereum (ERC20)',
      };
    case 'ethereum-sepolia':
      return {
        selectLabel: 'ETH Ethereum Sepolia',
        warningLabel: 'Ethereum Sepolia',
      };
    case 'polygon':
      return {
        selectLabel: 'POL Polygon',
        warningLabel: 'Polygon',
      };
    case 'base':
      return {
        selectLabel: 'BASE Base',
        warningLabel: 'Base',
      };
    default:
      return {
        selectLabel: chain,
        warningLabel: chain,
      };
  }
};

const networkOptions = computed<WalletNetworkOption[]>(() =>
  WALLET_NETWORKS.map((chain) => {
    const presentation = getWalletNetworkPresentation(chain);

    return {
      value: chain,
      text: presentation.selectLabel,
      warningLabel: presentation.warningLabel,
    };
  })
);

export function useWalletNetwork() {
  return {
    defaultNetwork: DEFAULT_WALLET_NETWORK,
    selectedNetwork: selectedWalletNetwork,
    networkOptions,
  };
}
