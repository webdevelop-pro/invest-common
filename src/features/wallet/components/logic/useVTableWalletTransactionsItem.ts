import { computed } from 'vue';
import type { IEvmTransactionDataFormatted } from 'InvestCommon/data/evm/evm.types';
import type { ITransactionDataFormatted } from 'InvestCommon/data/wallet/wallet.types';

export type VTableWalletTransactionsItemData =
  | IEvmTransactionDataFormatted
  | ITransactionDataFormatted
  | undefined;

export function useVTableWalletTransactionsItem(data: VTableWalletTransactionsItemData) {
  const fullTxOrEntityId = computed(() => {
    const d = data;
    if (!d) return '';
    if ('transaction_tx' in d && d.transaction_tx) return d.transaction_tx;

    const entityId = 'entity_id' in d ? (d as ITransactionDataFormatted).entity_id : undefined;
    if (entityId != null) return String(entityId);

    return '';
  });

  return {
    fullTxOrEntityId,
  };
}

