import { computed, ref, watch } from 'vue';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';

export interface VDialogWalletProps {
  transactionType: EvmTransactionTypes;
}

export function useVDialogWallet(props: Readonly<VDialogWalletProps>) {
  const isTypeDeposit = ref(props.transactionType === EvmTransactionTypes.deposit);
  const isTypeExchange = ref(props.transactionType === EvmTransactionTypes.exchange);

  const title = computed(() => {
    if (isTypeDeposit.value) return 'Add Funds';
    if (isTypeExchange.value) return 'Exchange Tokens';
    return 'Withdraw';
  });

  watch(
    () => props.transactionType,
    (newVal: EvmTransactionTypes) => {
      isTypeDeposit.value = newVal === EvmTransactionTypes.deposit;
      isTypeExchange.value = newVal === EvmTransactionTypes.exchange;
    },
  );

  return {
    isTypeDeposit,
    isTypeExchange,
    title,
  };
}

