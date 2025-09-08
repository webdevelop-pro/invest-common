import {
  IEvmWalletDataResponse, IEvmWalletDataFormatted, EvmWalletStatusTypes, IEvmWalletBalances,
  IEvmTransactionDataFormatted,
} from '../evm.types';
import { EvmTransactionFormatter } from './transactions.formatter';

export class EvmWalletFormatter {
  private data: IEvmWalletDataResponse;

  constructor(data: IEvmWalletDataResponse) {
    this.data = data;
  }

  get isStatusCreated() {
    return this.data.status === EvmWalletStatusTypes.created;
  }

  get isStatusVerified() {
    return this.data.status === EvmWalletStatusTypes.verified;
  }

  get isStatusError() {
    return this.data.status === EvmWalletStatusTypes.error;
  }

  get isStatusErrorRetry() {
    return this.data.status === EvmWalletStatusTypes.error_retry;
  }

  get isStatusErrorDocument() {
    return this.data.status === EvmWalletStatusTypes.error_document;
  }

  get isStatusErrorPending() {
    return this.data.status === EvmWalletStatusTypes.error_pending;
  }

  get isStatusErrorSuspended() {
    return this.data.status === EvmWalletStatusTypes.error_suspended;
  }

  get isStatusAnyError() {
    return this.isStatusError || this.isStatusErrorRetry || this.isStatusErrorDocument
      || this.isStatusErrorPending || this.isStatusErrorSuspended;
  }

  get currentBalance() {
    return Number(this.data.balance) || 0;
  }

  get totalBalance() {
    return (this.currentBalance + this.pendingIncomingBalance - this.pendingOutcomingBalance) || 0;
  }

  get pendingIncomingBalance() {
    return Number(this.data.inc_balance) || 0;
  }

  get pendingOutcomingBalance() {
    return Number(this.data.out_balance) || 0;
  }

  format(): IEvmWalletDataFormatted {
    // Normalize balances to an array regardless of backend shape (array or map)
    let balancesArray: IEvmWalletBalances[] = [];
    const rawBalances: any = (this.data as any).balances;
    balancesArray = Object.values(rawBalances).map((b: any) => ({
      ...b,
      address: String(b.address),
      amount: Number(b.amount ?? 0),
      symbol: String(b.symbol ?? ''),
      name: b.name ? String(b.name) : undefined,
      icon: b.icon ? String(b.icon) : undefined,
    }));

    // Format transactions using the transaction formatter
    const formattedTransactions: IEvmTransactionDataFormatted[] = this.data.transactions.map(transaction => 
      new EvmTransactionFormatter(transaction).format()
    );

    return {
      ...(this.data as any),
      balances: balancesArray,
      isStatusCreated: this.isStatusCreated,
      isStatusVerified: this.isStatusVerified,
      isStatusError: this.isStatusError,
      isStatusErrorRetry: this.isStatusErrorRetry,
      isStatusErrorDocument: this.isStatusErrorDocument,
      isStatusErrorPending: this.isStatusErrorPending,
      isStatusErrorSuspended: this.isStatusErrorSuspended,
      isStatusAnyError: this.isStatusAnyError,
      currentBalance: this.currentBalance,
      totalBalance: this.totalBalance,
      pendingIncomingBalance: this.pendingIncomingBalance,
      pendingOutcomingBalance: this.pendingOutcomingBalance,
      formattedTransactions,
    };
  }
}
