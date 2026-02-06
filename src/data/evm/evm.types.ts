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
  icon?: string;
  price_per_usd?: number;
}>;

export interface IEvmWalletBalances {
  id: number;
  address: string;
  amount: number;
  symbol: string;
  name?: string;
  icon?: string;
  price_per_usd?: number;
}

export interface IEvmWalletDataResponse {
  id: number;
  status: EvmWalletStatusTypes;
  balance: string;
  inc_balance: number;
  out_balance: number;
  address: string;
  balances: IEvmWalletBalancesMap;
  transactions: IEvmTransactionDataResponse[];
  created_at: string;
  updated_at: string;
}

export interface IEvmWalletDataFormatted extends Omit<IEvmWalletDataResponse, 'balances'> {
  balances: IEvmWalletBalances[];
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
  fundingBalance: number;
  rwaBalance: number;
  pendingIncomingBalance: number;
  pendingOutcomingBalance: number;
  formattedTransactions: IEvmTransactionDataFormatted[];
}

export interface IEvmWalletAmount {
  value: string;
  currency: string;
}

export interface IEvmTransactionDataResponse {
  id: number;
  user_id: number;
  dest_wallet_id: number | null;
  source_wallet_id: number | null;
  investment_id: number | null;
  type: EvmTransactionTypes;
  amount: string;
  symbol?: string;
  name?: string;
  icon?: string;
  image_link_id?: number | string;
  network: string;
  status: EvmTransactionStatusTypes;
  transaction_tx: string;
  created_at: string;
  updated_at: string;
  address?: string;
}

export interface IEvmTransactionDataFormatted extends IEvmTransactionDataResponse {
  isStatusPending: boolean;
  isStatusProcessed: boolean;
  isStatusFailed: boolean;
  isStatusCancelled: boolean;
  isStatusWait: boolean;
  submitted_at_date: string;
  submitted_at_time: string;
  updated_at_date: string;
  updated_at_time: string;
  statusColor?: string;
  statusText?: string;
  
  // Type checking helpers
  isTypeWithdrawal: boolean;
  isTypeDeposit: boolean;
  isTypeExchange: boolean;
  
  // Formatted display values
  typeFormatted: string;
  amountFormatted: string;
  networkFormatted: string;
  tagColor?: string;

  // Display helpers for UI
  txShort: string;
  typeDisplay: string;
  description: string;
  scanTxUrl: string;
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
