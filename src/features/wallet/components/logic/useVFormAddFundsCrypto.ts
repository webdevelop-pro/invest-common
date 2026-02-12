import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import QRCode from 'qrcode';
import { useClipboard } from '@vueuse/core';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import type { IEvmWalletDataFormatted } from 'InvestCommon/data/evm/evm.types';

export function useVFormAddFundsCrypto() {
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState } = storeToRefs(evmRepository);
  
  const evmData = computed(() => getEvmWalletState.value.data as IEvmWalletDataFormatted | undefined);
  const addressRef = computed(() => evmData.value?.address);
  
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
      console.error('Error generating QR code:', error);
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

  const depositNetworkLabel = 'ETH Ethereum (ERC20)';
  const selectedAssetWarning = computed(() =>
    selectedAsset.value
      ? `Send only ${selectedAsset.value} to this address via the Ethereum (ERC20) network. Sending other assets may result in permanent loss.`
      : 'Send only the selected token to this address via the Ethereum (ERC20) network. Sending other assets may result in permanent loss.',
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
    address: addressRef,
  };
}

