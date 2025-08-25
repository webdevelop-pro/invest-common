import { IEvmWalletDataResponse, IEvmWalletDataFormatted, EvmWalletStatusTypes } from '../evm.types';

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
    return Number(this.data.balance) * 0.1 || 0;
  }

  get totalBalance() {
    return (this.currentBalance + this.pendingIncomingBalance - this.pendingOutcomingBalance) || 0;
  }

  get pendingIncomingBalance() {
    return Number(this.data.pending_incoming_balance) || 0;
  }

  get pendingOutcomingBalance() {
    return Number(this.data.pending_outcoming_balance) || 0;
  }

  format(): IEvmWalletDataFormatted {
    return {
      ...this.data,
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
    };
  }
}
