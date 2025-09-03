import { 
  IEvmTransactionDataResponse, 
  IEvmTransactionDataFormatted, 
  EvmTransactionStatusTypes
} from '../evm.types';

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
  [EvmTransactionStatusTypes.pending]: { color: 'purple-light', text: 'Pending' },
  [EvmTransactionStatusTypes.failed]: { color: 'red-light', text: 'Failed' },
  [EvmTransactionStatusTypes.cancelled]: { color: 'default', text: 'Cancelled' },
  [EvmTransactionStatusTypes.wait]: { color: 'primary', text: 'Waiting' },
} as const;

export class EvmTransactionFormatter {
  private data: IEvmTransactionDataResponse;

  constructor(data: IEvmTransactionDataResponse) {
    this.data = data;
  }

  format(): IEvmTransactionDataFormatted {
    return {
      ...this.data,
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
    };
  }

  static getStatusColor(status?: EvmTransactionStatusTypes): string {
    return status ? STATUS_CONFIG[status]?.color ?? 'default' : 'default';
  }

  static getStatusText(status?: EvmTransactionStatusTypes): string {
    return status ? STATUS_CONFIG[status]?.text ?? status : 'Unknown';
  }
}
