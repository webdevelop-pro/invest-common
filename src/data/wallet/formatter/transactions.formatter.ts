import { currency } from 'InvestCommon/helpers/currency';
import env from 'InvestCommon/domain/config/env';
import {
  ITransactionDataResponse, ITransactionDataFormatted, WalletAddTransactionTypes, FundingStatuses,
  WalletTransactionStatusTypes,
} from '../wallet.types';

const WALLET_STATUS_COLOR: Record<WalletTransactionStatusTypes, string> = {
  [WalletTransactionStatusTypes.processed]: 'secondary-light',
  [WalletTransactionStatusTypes.pending]: 'default',
  [WalletTransactionStatusTypes.failed]: 'red-light',
  [WalletTransactionStatusTypes.cancelled]: 'red-light',
  [WalletTransactionStatusTypes.wait]: 'primary-light',
};

const BASE_OPTIONS = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
} as const;

const formatToFullDate = (ISOString: string) => (
  new Intl.DateTimeFormat('en-US', BASE_OPTIONS)
    .format(new Date(ISOString))
);

const getTimeFormat = (fullDate: string) => {
  const date = new Date(fullDate);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export class TransactionFormatter {
  private transaction: ITransactionDataResponse;

  constructor(transaction: ITransactionDataResponse) {
    this.transaction = transaction;
  }

  get isTypeInvestment() {
    return this.transaction?.type === WalletAddTransactionTypes.investment;
  }

  get isTypeDeposit() {
    return this.transaction?.type === WalletAddTransactionTypes.deposit;
  }

  get typeFormatted() {
    return this.transaction?.type ? this.transaction.type[0]?.toUpperCase() + this.transaction.type?.slice(1) : '';
  }

  get tagBackground() {
    if (this.isTypeDeposit) return 'secondary-light';
    if (this.isTypeInvestment) return 'purple-light';
    return null;
  }

  get txShort(): string {
    const transactionTx = (this.transaction as ITransactionDataResponse & { transaction_tx?: string })?.transaction_tx;
    const entityId = String(this.transaction?.entity_id);
    const tx = transactionTx || entityId || '';
    if (!tx || tx.length < 14) return tx ?? '';
    return `${tx.slice(0, 6)}...${tx.slice(-6)}`;
  }

  get typeDisplay(): string {
    if (!this.transaction?.type) return '';
    switch (this.transaction.type) {
      case WalletAddTransactionTypes.deposit:
        return 'Deposit';
      case WalletAddTransactionTypes.withdrawal:
        return 'Withdrawal';
      case WalletAddTransactionTypes.investment:
        return 'Investment';
      case WalletAddTransactionTypes.distribution:
        return 'Distribution';
      case WalletAddTransactionTypes.fee:
        return 'Fee';
      case WalletAddTransactionTypes.market:
        return 'Market';
      case WalletAddTransactionTypes.sale:
        return 'Sale';
      case WalletAddTransactionTypes.return:
        return 'Return';
      default:
        return this.typeFormatted ?? '';
    }
  }

  get description(): string {
    const id = this.transaction?.entity_id;
    if (this.isTypeDeposit) {
      return id
        ? `Deposit to wallet (entity ID ${id}).`
        : 'Deposit to wallet balance.';
    }
    if (this.isTypeInvestment) {
      return id
        ? `Investment from wallet (entity ID ${id}).`
        : 'Investment from wallet.';
    }
    if (this.transaction?.type === WalletAddTransactionTypes.withdrawal) {
      return 'Withdrawal from wallet balance.';
    }
    if (this.transaction?.type === WalletAddTransactionTypes.distribution) {
      return id ? `Distribution (entity ID ${id}).` : 'Distribution.';
    }
    return this.typeFormatted ? `${this.typeFormatted} transaction.` : '';
  }

  get scanTxUrl(): string {
    const tx = (this.transaction as ITransactionDataResponse & { transaction_tx?: string })?.transaction_tx;
    if (!tx) return '';
    const base = env.CRYPTO_WALLET_SCAN_URL as string;
    return base ? `${base}/tx/${tx}` : '';
  }

  get tableCurrencyFormat() {
    if (this.isTypeDeposit) return `+ ${currency(Number(this.transaction.amount), 0)}`;
    return `- ${currency(Number(this.transaction.amount), 0)}`;
  }

  format(): ITransactionDataFormatted {
    return {
      ...this.transaction,
      submited_at_date: this.transaction.created_at ? formatToFullDate(new Date(this.transaction.created_at).toISOString()) : '-',
      submited_at_time: this.transaction.created_at ? getTimeFormat(this.transaction.created_at) : '-',
      updated_at_date: this.transaction.updated_at ? formatToFullDate(new Date(this.transaction.updated_at).toISOString()) : '-',
      updated_at_time: this.transaction.updated_at ? getTimeFormat(this.transaction.updated_at) : '-',
      isTypeDeposit: this.isTypeDeposit,
      isTypeInvestment: this.isTypeInvestment,
      typeFormatted: this.typeFormatted,
      amountFormatted: this.tableCurrencyFormat,
      tagColor: this.tagBackground,
      statusFormated: {
        text: FundingStatuses[this.transaction.status]?.text,
        tooltip: FundingStatuses[this.transaction.status]?.tooltip,
      },
      txShort: this.txShort,
      typeDisplay: this.typeDisplay,
      description: this.description,
      scanTxUrl: this.scanTxUrl,
      submitted_at_date: this.transaction.created_at ? formatToFullDate(new Date(this.transaction.created_at).toISOString()) : '-',
      submitted_at_time: this.transaction.created_at ? getTimeFormat(this.transaction.created_at) : '-',
      statusText: FundingStatuses[this.transaction.status]?.text ?? '',
      statusColor: this.transaction.status ? WALLET_STATUS_COLOR[this.transaction.status] ?? 'default' : 'default',
    };
  }
}
