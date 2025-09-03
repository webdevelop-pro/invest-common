export enum EvmWalletStatusTypes {
  created = 'created',
  verified = 'verified',
  error = 'error',
  error_retry = 'error_retry',
  error_document = 'error_document',
  error_pending = 'error_pending',
  error_suspended = 'error_suspended',
}

export enum EvmTransactionStatusTypes {
  processed = 'processed',
  pending = 'pending',
  failed = 'failed',
  cancelled = 'cancelled',
  wait = 'wait',
}

export enum EvmTransactionTypes {
  withdrawal = 'withdrawal',
  deposit = 'deposit',
  exchange = 'exchange',
}

// Backend may return balances as a map keyed by token address
export type IEvmWalletBalancesMap = Record<string, {
  address: string;
  amount: number | string;
  symbol: string;
  name?: string;
}>;

export interface IEvmWalletDataResponse {
  id: number;
  status: EvmWalletStatusTypes;
  balance: number;
  pending_incoming_balance: number;
  pending_outcoming_balance: number;
  address: string;
  balances: IEvmWalletBalancesMap;
}

export interface IEvmWalletDataFormatted extends IEvmWalletDataResponse {
  isStatusCreated: boolean;
  isStatusVerified: boolean;
  isStatusError: boolean;
  isStatusErrorRetry: boolean;
  isStatusErrorDocument: boolean;
  isStatusErrorPending: boolean;
  isStatusErrorSuspended: boolean;
  isStatusAnyError: boolean;
  currentBalance: number;
  totalBalance: number;
}

export interface IEvmWalletAmount {
  value: string;
  currency: string;
}

export interface IEvmTransactionDataResponse {
  id: number;
  status: EvmTransactionStatusTypes;
  type: EvmTransactionTypes;
  amount: IEvmWalletAmount;
  source_wallet_id: number;
  dest_wallet_id: number;
  entity_id: number;
  updated_at: string;
  created_at: string;
}

export interface IEvmTransactionDataFormatted extends IEvmTransactionDataResponse {
  isStatusPending: boolean;
  isStatusProcessed: boolean;
  isStatusFailed: boolean;
  isStatusCancelled: boolean;
  isTypeDeposit: boolean;
  isTypeWithdraw: boolean;
  isTypeInvestment: boolean;
  isTypeDistribution: boolean;
  isTypeFee: boolean;
  isTypeSale: boolean;
  isTypeReturn: boolean;
  isTypeMarket: boolean;
}

export interface IEvmWithdrawRequestBody {
  amount: number;
  token: string; // token address or symbol depending on backend contract
  to: string; // destination wallet address
  wallet_id: number;
}

export interface IEvmExchangeRequestBody {
  from: string; // source token address or symbol
  to: string; // destination token address or symbol
  amount: number; // amount to exchange
  wallet_id: number;
}

export interface IEvmExchangeResponse {
  transaction_id: string;
  from_token: string;
  to_token: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  status: EvmTransactionStatusTypes;
  estimated_gas_fee?: number;
}
