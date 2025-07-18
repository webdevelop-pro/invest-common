export enum WalletTransactionStatusTypes {
  processed = 'processed',
  pending = 'pending',
  failed = 'failed',
  cancelled = 'cancelled',
  wait = 'wait',
}

export enum WalletAddTransactionTypes {
  withdrawal = 'withdrawal',
  deposit = 'deposit',
  investment = 'investment',
  distribution = 'distribution',
  fee = 'fee',
  market = 'market',
  sale = 'sale',
  return = 'return',
}

export enum WalletTypes {
  created = 'created',
  error = 'error',
  verified = 'verified',
  error_retry = 'error_retry',
  error_document = 'error_document',
  error_pending = 'error_pending',
  error_suspended = 'error_suspended',
}

export interface IFundingSourceDataResponse {
  id: number;
  name: string;
  type: string;
  status: string;
  bank_name: string;
}

export interface IFundingSourceDataFormatted {
  id: number;
  name: string;
  type: string;
  status: string;
  bank_name: string;
  isAttachmentMethodManual: boolean;
  isAttachmentMethodAutomatic: boolean;
  isStatusPending: boolean;
}

export interface IWalletDataResponse {
  id: number;
  status: string;
  balance: number;
  pending_incoming_balance: number;
  pending_outcoming_balance: number;
  funding_source: IFundingSourceDataResponse[];
}

export interface IWalletDataFormatted {
  id: number;
  status: string;
  balance: number;
  pending_incoming_balance: number;
  pending_outcoming_balance: number;
  funding_source: IFundingSourceDataFormatted[];
  isSomeLinkedBankAccount: boolean;
  isWalletStatusCreated: boolean;
  isWalletStatusVerified: boolean;
  isWalletStatusError: boolean;
  isWalletStatusErrorRetry: boolean;
  isWalletStatusErrorDocument: boolean;
  isWalletStatusErrorPending: boolean;
  isWalletStatusErrorSuspended: boolean;
}

export interface ITransactionDataResponse {
  id: number;
  source_wallet_id: number;
  dest_wallet_id: number;
  entity_id: number;
  status: WalletTransactionStatusTypes;
  type: WalletAddTransactionTypes;
  amount: number;
  updated_at: string;
  created_at: string;
}

export interface ITransactionDataFormatted extends ITransactionDataResponse {
  amountFormatted?: string;
  tagColor?: string | null;
  updated_at_date?: string;
  updated_at_time?: string;
  submited_at_date?: string;
  submited_at_time?: string;
  isTypeDeposit?: boolean;
  isTypeInvestment?: boolean;
  statusFormated?: {
    text: string;
    tooltip?: string;
  };
}

export interface IPlaidLinkTokenResponse {
  expiration: string;
  link_token: string;
  request_id: string;
}

export interface IPlaidLinkExchange {
  accounts: [];
  access_token: string;
}

export interface IPlaidLinkProcess {
  additional: any;
  token: string;
}

interface IFundingTextStatus {
  text: string;
  tooltip?: string;
}

export const FundingStatuses: Record<WalletTransactionStatusTypes, IFundingTextStatus> = {
  [WalletTransactionStatusTypes.pending]: {
    text: 'In progress',
    tooltip: 'Your funds transaction is in progress. Usually it takes up to 3 days for us to receive them',
  },
  [WalletTransactionStatusTypes.processed]: {
    text: 'Processed',
    tooltip: 'We received your funds. No actions needed',
  },
  [WalletTransactionStatusTypes.failed]: {
    text: 'Failed',
    tooltip: 'Your funds transaction is failed. Please check if all is correct. If you still have troubles, contact us.',
  },
  [WalletTransactionStatusTypes.cancelled]: {
    text: 'Canceled',
    tooltip: 'Your transaction is canceled',
  },
  [WalletTransactionStatusTypes.wait]: {
    text: 'Wait',
    tooltip: '',
  },
};
