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

const getTableCurrencyFormat = (item: ITransactionDataFormatted) => {
  if (item.isTypeDeposit) return `+ ${currency(Number(item.amount), 0)}`;
  return `- ${currency(Number(item.amount), 0)}`;
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

  get tagBackground() {
    if (this.isTypeDeposit) return 'secondary-light';
    if (this.isTypeInvestment) return 'purple-light';
    return null;
  }

  format(): ITransactionDataFormatted {
    return {
      ...this.transaction,
      amountFormatted: getTableCurrencyFormat(this.transaction),
      submited_at_date: formatToFullDate(new Date(this.transaction.created_at || '').toISOString()),
      submited_at_time: getTimeFormat(this.transaction.created_at),
      updated_at_date: formatToFullDate(new Date(this.transaction.updated_at || '').toISOString()),
      updated_at_time: getTimeFormat(this.transaction.updated_at),
      isTypeDeposit: this.isTypeDeposit,
      isTypeInvestment: this.isTypeInvestment,
      tagColor: this.tagBackground,
      statusFormated: {
        text: FundingStatuses[this.transaction.status]?.text,
        tooltip: FundingStatuses[this.transaction.status]?.tooltip,
      },
    };
  }
}
