import type {
  EarnPositionsResponse,
  EarnPositionTransaction,
} from './earn.repository';

// Currency formatter (copied pattern from investment formatter)
const defaultCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const makeCurrencyFormatter = (digits: number = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
  });

export function currency(
  val: number | undefined,
  digits?: number,
): string {
  const formatter = digits !== undefined
    ? makeCurrencyFormatter(digits)
    : defaultCurrencyFormatter;

  return val || val === 0 ? formatter.format(val) : formatter.format(0);
}

// Date / time helpers for transactions
const DATE_OPTIONS = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
} as const;

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', DATE_OPTIONS);

export function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return DATE_FORMATTER.format(new Date(date));
}

export function formatTime(date: string | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export interface EarnPositionTransactionFormatted {
  id: number;
  date: string;
  time: string;
  amount: string;
  transaction_id: string;
  type: string;
  status: {
    text: string;
    tooltip: string;
  };
  tagColor: string;
}

export interface EarnPositionStatItem {
  label: string;
  amount: number;
  valueInUsd: string;
}

export interface EarnPositionsResponseFormatted {
  poolId: string;
  profileId: string | number;
  symbol: string;
  stakedAmountUsd: number;
  earnedAmountUsd: number;
  stakedAmountFormatted: string;
  earnedAmountFormatted: string;
  stats: EarnPositionStatItem[];
  transactions: EarnPositionTransactionFormatted[];
}

export class EarnPositionFormatter {
  private position: EarnPositionsResponse | undefined;

  constructor(position: EarnPositionsResponse | undefined) {
    this.position = position;
  }

  get amountStakedFormatted(): string {
    return currency(this.position?.stakedAmountUsd);
  }

  get earnedAmountFormatted(): string {
    return currency(this.position?.earnedAmountUsd);
  }

  formatTransaction(tx: EarnPositionTransaction): EarnPositionTransactionFormatted {
    return {
      id: tx.id,
      date: tx.date || formatDate(tx.date),
      time: tx.time || formatTime(tx.time),
      amount: currency(tx.amountUsd),
      transaction_id: tx.txId,
      type: tx.type,
      status: {
        text: tx.status === 'completed' ? 'Completed' : 'Pending',
        tooltip: tx.status === 'completed'
          ? 'Transaction completed'
          : 'Transaction is pending',
      },
      tagColor: tx.type === 'deposit' ? 'green' : 'red',
    };
  }

  get transactionsFormatted(): EarnPositionTransactionFormatted[] {
    if (!this.position) return [];
    return this.position.transactions.map((tx) => this.formatTransaction(tx));
  }

  get statsFormatted(): EarnPositionStatItem[] {
    return [
      {
        label: 'Amount Staked:',
        amount: this.position?.stakedAmountUsd || 0,
        valueInUsd: currency(this.position?.stakedAmountUsd),
      },
      {
        label: 'Earned:',
        amount: this.position?.earnedAmountUsd || 0,
        valueInUsd: currency(this.position?.earnedAmountUsd),
      },
    ];
  }

  format(): EarnPositionsResponseFormatted | undefined {
    if (!this.position) return undefined;

    return {
      poolId: this.position.poolId,
      profileId: this.position.profileId,
      symbol: this.position.symbol,
      stakedAmountUsd: this.position.stakedAmountUsd,
      earnedAmountUsd: this.position.earnedAmountUsd,
      stakedAmountFormatted: this.amountStakedFormatted,
      earnedAmountFormatted: this.earnedAmountFormatted,
      stats: this.statsFormatted,
      transactions: this.transactionsFormatted,
    };
  }
}


