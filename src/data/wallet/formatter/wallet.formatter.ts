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

  get isWalletStatusAnyError() {
    return this.isWalletStatusError || this.isWalletStatusErrorRetry || this.isWalletStatusErrorDocument
      || this.isWalletStatusErrorPending || this.isWalletStatusErrorSuspended;
  }

  get currentBalance() {
    return this.wallet.balance || 0;
  }

  get pendingIncomingBalance() {
    return this.wallet.pending_incoming_balance || 0;
  }

  get pendingOutcomingBalance() {
    return this.wallet.pending_outcoming_balance || 0;
  }

  get totalBalance() {
    return this.currentBalance + this.pendingIncomingBalance - this.pendingOutcomingBalance;
  }

  get isCurrentBalanceZero() {
    return this.currentBalance === 0;
  }

  get isTotalBalanceZero() {
    return this.totalBalance === 0;
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
      currentBalance: this.currentBalance,
      currentBalanceFormatted: currency(this.currentBalance),
      pendingIncomingBalance: this.pendingIncomingBalance,
      pendingIncomingBalanceFormatted: currency(this.pendingIncomingBalance),
      pendingOutcomingBalance: this.pendingOutcomingBalance,
      pendingOutcomingBalanceFormatted: currency(this.pendingOutcomingBalance),
      totalBalance: this.totalBalance,
      totalBalanceFormatted: currency(this.totalBalance),
      isCurrentBalanceZero: this.isCurrentBalanceZero,
      isTotalBalanceZero: this.isTotalBalanceZero,
      isWalletStatusAnyError: this.isWalletStatusAnyError,
    };
  }
}
