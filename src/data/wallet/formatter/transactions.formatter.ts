import { currency } from 'InvestCommon/helpers/currency';
import {
  ITransactionDataResponse, ITransactionDataFormatted, WalletAddTransactionTypes, FundingStatuses,
} from '../wallet.types';

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
  private transaction: ITransactionDataFormatted;

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
    };
  }
}
