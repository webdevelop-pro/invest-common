import { currency } from 'InvestCommon/helpers/currency';
import {
  WalletTypes, IWalletDataFormatted,
} from '../wallet.types';

export class WalletFormatter {
  private wallet: IWalletDataFormatted;

  constructor(wallet: IWalletDataFormatted) {
    this.wallet = wallet;
  }

  get isSomeLinkedBankAccount() {
    return this.wallet.funding_source?.length > 0;
  }

  get isWalletStatusCreated() {
    return this.wallet.status === WalletTypes.created;
  }

  get isWalletStatusVerified() {
    return this.wallet.status === WalletTypes.verified;
  }

  get isWalletStatusError() {
    return this.wallet.status === WalletTypes.error;
  }

  get isWalletStatusErrorRetry() {
    return this.wallet.status === WalletTypes.error_retry;
  }

  get isWalletStatusErrorDocument() {
    return this.wallet.status === WalletTypes.error_document;
  }

  get isWalletStatusErrorPending() {
    return this.wallet.status === WalletTypes.error_pending;
  }

  get isWalletStatusErrorSuspended() {
    return this.wallet.status === WalletTypes.error_suspended;
  }

  format(): IWalletDataFormatted {
    return {
      ...this.wallet,
      isSomeLinkedBankAccount: this.isSomeLinkedBankAccount,
      isWalletStatusCreated: this.isWalletStatusCreated,
      isWalletStatusVerified: this.isWalletStatusVerified,
      isWalletStatusError: this.isWalletStatusError,
      isWalletStatusErrorRetry: this.isWalletStatusErrorRetry,
      isWalletStatusErrorDocument: this.isWalletStatusErrorDocument,
      isWalletStatusErrorPending: this.isWalletStatusErrorPending,
      isWalletStatusErrorSuspended: this.isWalletStatusErrorSuspended,
    };
  }
}
