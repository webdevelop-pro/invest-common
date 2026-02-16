import { 
  IEvmTransactionDataResponse, 
  IEvmTransactionDataFormatted, 
  EvmTransactionStatusTypes,
  EvmTransactionTypes
} from '../evm.types';
import defaultImage from 'InvestCommon/shared/assets/images/default.svg?url';
import env from 'InvestCommon/domain/config/env';

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

const STATUS_CONFIG = {
  [EvmTransactionStatusTypes.processed]: { color: 'secondary-light', text: 'Completed' },
  [EvmTransactionStatusTypes.pending]: { color: 'default', text: 'Pending' },
  [EvmTransactionStatusTypes.failed]: { color: 'red-light', text: 'Failed' },
  [EvmTransactionStatusTypes.cancelled]: { color: 'red-light', text: 'Cancelled' },
  [EvmTransactionStatusTypes.wait]: { color: 'primary', text: 'Waiting' },
} as const;

export class EvmTransactionFormatter {
  private data: IEvmTransactionDataResponse;

  constructor(data: IEvmTransactionDataResponse) {
    this.data = data;
  }

  get isTypeWithdrawal() {
    return this.data?.type === EvmTransactionTypes.withdrawal;
  }

  get isTypeDeposit() {
    return this.data?.type === EvmTransactionTypes.deposit;
  }

  get isTypeExchange() {
    return this.data?.type === EvmTransactionTypes.exchange;
  }

  get typeFormatted() {
    return this.data?.type ? this.data.type[0]?.toUpperCase() + this.data.type?.slice(1) : '';
  }

  get amountFormatted() {
    const currencyTicker = this.data?.ticker || this.data?.symbol;
    if (!this.data?.amount) return currencyTicker ? `0 ${currencyTicker}` : '0';
    const amount = Number(this.data.amount);
    const formattedAmount = amount.toLocaleString();
    const suffix = currencyTicker ? ` ${currencyTicker}` : '';
    if (this.isTypeDeposit) return `+ ${formattedAmount}${suffix}`.trim();
    return `- ${formattedAmount}${suffix}`.trim();
  }

  get networkFormatted() {
    return this.data?.network ? this.data.network[0]?.toUpperCase() + this.data.network?.slice(1) : '';
  }

  get tagBackground() {
    if (this.isTypeDeposit) return 'secondary-light';
    if (this.isTypeWithdrawal) return 'red-light';
    if (this.isTypeExchange) return 'purple-light';
    return 'default';
  }

  get txShort(): string {
    const tx = this.data?.transaction_tx;
    if (!tx || tx.length < 14) return tx ?? '';
    return `${tx.slice(0, 6)}...${tx.slice(-6)}`;
  }

  get typeDisplay(): string {
    if (this.data?.type_display) return this.data.type_display;
    if (!this.data?.type) return '';
    switch (this.data.type) {
      case EvmTransactionTypes.deposit:
        return 'Crypto Deposit';
      case EvmTransactionTypes.withdrawal:
        return 'Crypto Withdrawal';
      case EvmTransactionTypes.exchange:
        return 'Token Issuance';
      default:
        return this.typeFormatted ?? '';
    }
  }

  get description(): string {
    if (this.data?.description) return this.data.description;
    const id = this.data?.investment_id;
    const name = this.data?.name ?? '';
    if (this.isTypeDeposit) {
      return id
        ? `Distribution from investment ID ${id} to crypto wallet balance.`
        : 'Deposit to crypto wallet balance.';
    }
    if (this.isTypeWithdrawal) {
      return 'Withdrawal from crypto wallet balance.';
    }
    if (this.isTypeExchange) {
      return id
        ? `Token issuance from investment ID ${id}${name ? ` in ${name}` : ''}.`
        : 'Token exchange in wallet.';
    }
    return '';
  }

  get scanTxUrl(): string {
    const tx = this.data?.transaction_tx;
    if (!tx) return '';
    const base = env.CRYPTO_WALLET_SCAN_URL as string;
    return base ? `${base}/tx/${tx}` : '';
  }

  getImage(iconLinkId?: number | string, icon?: string, metaSize: 'big' | 'small' | 'medium' = 'small'): string {
    // Handle iconLinkId as number or string (number as string)
    const iconId = typeof iconLinkId === 'string' ? Number(iconLinkId) : iconLinkId;
    if (iconId && (iconId > 0)) {
      return `${env.FILER_URL}/public/files/${iconId}?size=${metaSize}`;
    }
    // If iconLinkId is a string that looks like a URL, use it
    if (typeof iconLinkId === 'string' && (iconLinkId.startsWith('http') || iconLinkId.startsWith('/'))) {
      return iconLinkId;
    }
    if (icon) {
      return icon;
    }
    return defaultImage;
  }

  format(): IEvmTransactionDataFormatted {
    return {
      ...this.data,
      icon: this.data.image_link_id ? this.getImage(this.data.image_link_id) : undefined,
      isStatusPending: this.data.status === EvmTransactionStatusTypes.pending,
      isStatusProcessed: this.data.status === EvmTransactionStatusTypes.processed,
      isStatusFailed: this.data.status === EvmTransactionStatusTypes.failed,
      isStatusCancelled: this.data.status === EvmTransactionStatusTypes.cancelled,
      isStatusWait: this.data.status === EvmTransactionStatusTypes.wait,

      submitted_at_date: this.data.created_at ? formatToFullDate(new Date(this.data.created_at).toISOString()) : '-',
      submitted_at_time: this.data.created_at ? getTimeFormat(this.data.created_at) : '-',
      updated_at_date: this.data.updated_at ? formatToFullDate(new Date(this.data.updated_at).toISOString()) : '-',
      updated_at_time: this.data.updated_at ? getTimeFormat(this.data.updated_at) : '-',
      
      statusColor: EvmTransactionFormatter.getStatusColor(this.data.status),
      statusText: EvmTransactionFormatter.getStatusText(this.data.status),
      
      // New formatted fields for type, amount, and network
      isTypeWithdrawal: this.isTypeWithdrawal,
      isTypeDeposit: this.isTypeDeposit,
      isTypeExchange: this.isTypeExchange,
      typeFormatted: this.typeFormatted,
      amountFormatted: this.amountFormatted,
      networkFormatted: this.networkFormatted,
      tagColor: this.tagBackground,

      txShort: this.txShort,
      typeDisplay: this.typeDisplay,
      description: this.description,
      scanTxUrl: this.scanTxUrl,
    };
  }

  static getStatusColor(status?: EvmTransactionStatusTypes): string {
    return status ? STATUS_CONFIG[status]?.color ?? 'default' : 'default';
  }

  static getStatusText(status?: EvmTransactionStatusTypes): string {
    return status ? STATUS_CONFIG[status]?.text ?? status : 'Unknown';
  }
}
