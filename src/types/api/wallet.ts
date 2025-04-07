export enum WalletTransactionStatusTypes {
  processed = 'processed',
  pending = 'pending',
  failed = 'failed',
  cancelled = 'cancelled',
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
  funding_source: IFundingSourceDataResponse;
}

export interface IWalletDataFormatted {
  id: number;
  status: string;
  balance: number;
  pending_incoming_balance: number;
  pending_outcoming_balance: number;
  funding_source: IFundingSourceDataFormatted;
}

export interface ITransactionDataResponse {
  id: number;
  status: WalletTransactionStatusTypes;
  type: WalletAddTransactionTypes;
  amount: {
    value: string;
    currency: string;
  };
  source: IFundingSourceDataResponse;
  dest: IFundingSourceDataResponse;
  updated_at: string;
  submited_at: string;
}

export interface ITransactionDataFormatted {
  id: number;
  status: WalletTransactionStatusTypes;
  type: WalletAddTransactionTypes;
  amount: {
    value: string;
    currency: string;
  };
  source: IFundingSourceDataFormatted;
  dest: IFundingSourceDataFormatted;
  updated_at_date: string;
  updated_at_time: string;
  submited_at_date: string;
  submited_at_time: string;
    isStatusPending: boolean;
    isStatusProcessed: boolean;
    isStatusFailed: boolean;
    isStatuscancelled: boolean;
    isTypeDeposit: boolean;
    isTypeWithdraw: boolean;
    isTypeInvestment: boolean;
    isTypeDistribution: boolean;
    isTypeFee: boolean;
    isTypeSale: boolean;
    isTypeReturn: boolean;
    isTypeMarket: boolean;
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
