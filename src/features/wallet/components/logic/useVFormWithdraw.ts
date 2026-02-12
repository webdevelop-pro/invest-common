import { ref, computed } from 'vue';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';
import { useVFormWithdrawCrypto } from './useVFormWithdrawCrypto';
import { useVFormWalletAddTransaction } from './useVFormWalletAddTransaction';

export type WithdrawalMethodType = 'fiat' | 'crypto';

export function useVFormWithdraw(onClose: () => void) {
  const withdrawalMethod = ref<WithdrawalMethodType>('fiat');

  const transactionType = computed(() => WalletAddTransactionTypes.withdrawal);
  const fiatApi = useVFormWalletAddTransaction(transactionType, onClose);

  const {
    model: fiatModel,
    fundingSourceFormatted,
    isDisabledButton: isFiatSubmitDisabled,
    addTransactionState,
    maxFiatAmount,
    maxFiatAmountFormatted,
    getWalletState,
    errorData: fiatErrorData,
    isFieldRequired: fiatIsFieldRequired,
    getErrorText: fiatGetErrorText,
  } = fiatApi;

  const cryptoWithdraw = useVFormWithdrawCrypto(onClose);
  const hasCryptoBalance = computed(() => cryptoWithdraw.tokenFormatted.value.length > 0);

  const baseWithdrawalMethodOptions: { value: string; text: string; disabled?: boolean }[] = [
    { value: 'fiat', text: 'Fiat' },
    { value: 'crypto', text: 'Crypto' },
  ];

  const withdrawalMethodOptions = computed(
    () =>
      baseWithdrawalMethodOptions.map((option) => ({
        ...option,
        disabled: option.value === 'crypto' ? !hasCryptoBalance.value : option.disabled,
      })) as unknown as Record<string, string | number | boolean>[],
  );

  return {
    withdrawalMethod,
    hasCryptoBalance,
    withdrawalMethodOptions,
    // Fiat withdrawal values (mirrors useVFormAddFunds API)
    fiatModel,
    fundingSourceFormatted,
    isFiatSubmitDisabled,
    fiatSubmitHandler: fiatApi.saveHandler,
    addTransactionState,
    maxFiatAmount,
    maxFiatAmountFormatted,
    getWalletState,
    fiatErrorData,
    fiatIsFieldRequired,
    fiatGetErrorText,
    // Crypto withdrawal values
    ...cryptoWithdraw,
  };
}
