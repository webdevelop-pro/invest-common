import { ref, computed } from 'vue';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';
import { useVFormAddFundsCrypto } from './useVFormAddFundsCrypto';
import { useVFormWalletAddTransaction, type DepositMethodType } from './useVFormWalletAddTransaction';

export type { DepositMethodType };

type DepositMethodOption = {
  value: string;
  text: string;
  disabled?: boolean;
};

export function useVFormAddFunds(onClose: () => void) {
  const depositMethod = ref<DepositMethodType>('crypto');

  const {
    qrCodeDataURL,
    isGeneratingQR,
    copied,
    onCopyClick,
    assetOptions,
    selectedAsset,
    selectedAssetWarning,
    depositNetworkLabel,
    address: cryptoAddress,
  } = useVFormAddFundsCrypto();

  const transactionType = computed(() => WalletAddTransactionTypes.deposit);
  const {
    model: fiatModel,
    fundingSourceFormatted,
    isDisabledButton: isFiatSubmitDisabled,
    saveHandler: fiatSubmitHandler,
    numberFormatter,
    addTransactionState,
    maxFiatAmount,
    maxFiatAmountFormatted,
    getWalletState,
    errorData,
    isFieldRequired,
    getErrorText,
  } = useVFormWalletAddTransaction(transactionType, onClose);

  const hasBankAccounts = computed(() => fundingSourceFormatted.value.length > 0);

  const depositMethodOptions = computed<DepositMethodOption[]>(() => ([
    {
      value: 'fiat',
      text: 'Fiat',
      disabled: !hasBankAccounts.value,
    },
    {
      value: 'crypto',
      text: 'Crypto',
    },
  ]));

  return {
    depositMethod,
    depositNetworkLabel,
    // Fiat-related values from wallet transaction composable
    fiatModel,
    fundingSourceFormatted,
    isFiatSubmitDisabled,
    fiatSubmitHandler,
    numberFormatter,
    addTransactionState,
    maxFiatAmount,
    maxFiatAmountFormatted,
    errorData,
    isFieldRequired,
    getErrorText,
    depositMethodOptions,
    // Crypto-related values from crypto composable
    qrCodeDataURL,
    isGeneratingQR,
    copied,
    onCopyClick,
    assetOptions,
    selectedAsset,
    selectedAssetWarning,
    cryptoAddress,
    getWalletState,
  };
}
