import { ref, computed, watch, unref } from 'vue';
import { storeToRefs } from 'pinia';
import { useClipboard } from '@vueuse/core';
import { useRepositoryEvm, type WalletChain } from 'InvestCommon/data/evm/evm.repository';
import type { IEvmWalletDataFormatted } from 'InvestCommon/data/evm/evm.types';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

type DepositNetworkOption = {
  value: string;
  text: string;
  address: string;
  warningLabel: string;
};

const getNetworkPresentation = (chain: string) => {
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

export function useVFormAddFundsCrypto() {
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState } = storeToRefs(evmRepository);
  const profilesStore = useProfilesStore();

  const evmData = computed(() => getEvmWalletState.value.data as IEvmWalletDataFormatted | undefined);
  const supportedChains = computed(() =>
    (evmRepository.depositWalletChains ?? ['ethereum', 'polygon', 'base', 'ethereum-sepolia']) as Exclude<WalletChain, 'all'>[]
  );
  const selectedNetwork = ref<Exclude<WalletChain, 'all'>>('ethereum');
  const fetchedNetworkAddresses = ref<Partial<Record<Exclude<WalletChain, 'all'>, string>>>({});
  const isNetworkAddressLoading = ref(false);

  const chainAddressMap = computed(() => {
    const chains = Array.isArray(evmData.value?.chains) ? evmData.value.chains : [];

    return chains.reduce<Record<string, string>>((acc, chain) => {
      const chainKey = String(chain.chain ?? '').trim().toLowerCase();
      const address = String(chain.wallet_address ?? '').trim();
      if (chainKey && address) {
        acc[chainKey] = address;
      }
      return acc;
    }, {});
  });

  const networkOptions = computed<DepositNetworkOption[]>(() =>
    supportedChains.value.map((chain) => {
      const presentation = getNetworkPresentation(chain);
      return {
        value: chain,
        text: presentation.selectLabel,
        address: chainAddressMap.value[chain] ?? fetchedNetworkAddresses.value[chain] ?? '',
        warningLabel: presentation.warningLabel,
      };
    })
  );

  const loadSelectedNetworkAddress = async () => {
    const currentChains = Array.isArray(evmData.value?.chains) ? evmData.value.chains : [];
    if (currentChains.some((chain) => String(chain.wallet_address ?? '').trim())) {
      return;
    }
    const profileId = Number(unref(profilesStore.selectedUserProfileId) ?? 0);
    const currentNetwork = selectedNetwork.value;
    if (!profileId || !currentNetwork) {
      return;
    }
    if (fetchedNetworkAddresses.value[currentNetwork] !== undefined) {
      return;
    }
    isNetworkAddressLoading.value = true;

    try {
      const network = await evmRepository.getDepositNetworkByProfile(profileId, currentNetwork);
      fetchedNetworkAddresses.value = {
        ...fetchedNetworkAddresses.value,
        [currentNetwork]: String(network.wallet_address ?? '').trim(),
      };
    } catch (error) {
      fetchedNetworkAddresses.value = {
        ...fetchedNetworkAddresses.value,
        [currentNetwork]: '',
      };
      reportError(error, 'Failed to load crypto deposit networks');
    } finally {
      isNetworkAddressLoading.value = false;
    }
  };

  const selectedNetworkOption = computed(() =>
    networkOptions.value.find((option) => option.value === selectedNetwork.value)
  );
  const addressRef = computed(() => {
    if (selectedNetworkOption.value?.address) {
      return selectedNetworkOption.value.address;
    }

    const fallbackAddress = String(evmData.value?.address ?? '').trim();
    const hasChains = Array.isArray(evmData.value?.chains) && evmData.value.chains.length > 0;
    if (!hasChains && selectedNetwork.value === 'ethereum' && fallbackAddress) {
      return fallbackAddress;
    }

    return undefined;
  });

  const qrCodeDataURL = ref<string>('');
  const isGeneratingQR = ref<boolean>(true);
  const { copy, copied } = useClipboard({ legacy: true });

  const generateQR = async () => {
    isGeneratingQR.value = true;
    try {
      if (!addressRef.value) {
        qrCodeDataURL.value = '';
        return;
      }
      const { default: QRCode } = await import('qrcode');
      qrCodeDataURL.value = await QRCode.toDataURL(addressRef.value, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      reportError(error, 'Failed to generate QR code');
    } finally {
      isGeneratingQR.value = false;
    }
  };

  watch(
    () => addressRef.value,
    () => {
      if (addressRef.value) {
        generateQR();
      } else {
        qrCodeDataURL.value = '';
      }
    },
    { immediate: true },
  );

  const onCopyClick = () => {
    if (addressRef.value) {
      copy(addressRef.value);
    }
  };

  const assetOptions = computed(() => {
    const balances = Array.isArray(evmData.value?.balances) ? evmData.value.balances : [];
    const hasUsdc = balances.some((b: { symbol?: string }) => b?.symbol?.toUpperCase() === 'USDC');

    // Always expose only USDC option for wallet add-funds flow
    return [
      {
        value: 'USDC',
        text: 'USDC',
        disabled: !hasUsdc,
      },
    ];
  });

  const selectedAsset = ref<string>('USDC');
  // Ensure selectedAsset stays USDC even if options change
  watch(assetOptions, () => {
    selectedAsset.value = 'USDC';
  }, { immediate: true });

  watch(networkOptions, (options) => {
    if (!options.length) {
      return;
    }

    if (!options.some((option) => option.value === selectedNetwork.value)) {
      selectedNetwork.value = options[0].value as Exclude<WalletChain, 'all'>;
    }
  }, { immediate: true });

  watch(
    () => [
      profilesStore.selectedUserProfileId,
      evmData.value?.address,
      JSON.stringify(evmData.value?.chains ?? []),
      selectedNetwork.value,
    ],
    () => {
      void loadSelectedNetworkAddress();
    },
    { immediate: true },
  );

  const depositNetworkLabel = computed(() => selectedNetworkOption.value?.text ?? '');
  const selectedAssetWarning = computed(() =>
    selectedAsset.value
      ? `Send only ${selectedAsset.value} to this address via the ${selectedNetworkOption.value?.warningLabel ?? 'selected'} network. Sending other assets may result in permanent loss.`
      : `Send only the selected token to this address via the ${selectedNetworkOption.value?.warningLabel ?? 'selected'} network. Sending other assets may result in permanent loss.`,
  );

  return {
    qrCodeDataURL,
    isGeneratingQR,
    copied,
    onCopyClick,
    assetOptions,
    selectedAsset,
    selectedAssetWarning,
    depositNetworkLabel,
    networkOptions,
    selectedNetwork,
    isNetworkAddressLoading,
    address: addressRef,
  };
}
