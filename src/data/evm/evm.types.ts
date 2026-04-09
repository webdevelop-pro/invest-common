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

/** Input for EvmWalletFormatter: balances can be map (API) or array (formatted). */
export type IEvmWalletBalancesInput = IEvmWalletBalancesMap | IEvmWalletBalances[];

/** Wallet-like shape accepted by EvmWalletFormatter (raw response or re-format from formatted). */
export type IEvmWalletDataForFormatter = Omit<IEvmWalletDataResponse, 'balances'> & {
  balances?: IEvmWalletBalancesInput;
};

export interface IEvmWalletBalances {
  id: number;
  asset?: string;
  address: string;
  amount: number;
  symbol: string;
  name?: string;
  icon?: string;
  price_per_usd?: number;
  tokenValue?: string;
}

export interface IEvmWalletChainAccount {
  chain: string;
  wallet_address: string;
  chain_account_status?: string;
}

export interface IEvmWalletDepositInstructions {
  chain?: string;
  address?: string;
}

export interface IEvmWalletDataResponse {
  id: number;
  status: EvmWalletStatusTypes;
  balance: string;
  inc_balance: number;
  out_balance: number;
  address: string;
  deposit_instructions?: IEvmWalletDepositInstructions;
  chains?: IEvmWalletChainAccount[];
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
  rwaValue: number;
  pendingIncomingBalance: number;
  pendingOutcomingBalance: number;
  cryptoChangeFormatted?: string;
  rwaChangeFormatted?: string;
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
  ticker?: string;
  symbol?: string;
  name?: string;
  icon?: string;
  image_link_id?: number | string;
  network: string;
  status: EvmTransactionStatusTypes;
  transaction_tx: string;
  scan_tx_url?: string;
  created_at: string;
  updated_at: string;
  address?: string;
  /** Optional display label (e.g. "Supply to Earn") when type alone is not enough */
  type_display?: string;
  /** Optional description for UI (e.g. mock Earn transactions) */
  description?: string;
}

export interface IEvmWalletTransactionsApiItem {
  id?: number | string;
  user_id?: number | string | null;
  dest_wallet_id?: number | string | null;
  source_wallet_id?: number | string | null;
  investment_id?: number | string | null;
  type?: string | null;
  amount?: number | string | null;
  ticker?: string | null;
  symbol?: string | null;
  name?: string | null;
  icon?: string | null;
  image_link_id?: number | string | null;
  network?: string | null;
  status?: string | null;
  transaction_tx?: string | null;
  tx_hash?: string | null;
  hash?: string | null;
  scan_tx_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  address?: string | null;
  wallet_address?: string | null;
  type_display?: string | null;
  description?: string | null;
}

export type IEvmWalletTransactionsApiResponse =
  | IEvmWalletTransactionsApiItem[]
  | {
      items?: IEvmWalletTransactionsApiItem[] | null;
      transactions?: IEvmWalletTransactionsApiItem[] | null;
      data?: IEvmWalletTransactionsApiItem[] | null;
    };

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
  chain: string;
  asset_address: string;
  amount: string;
  destination_address: string;
  idempotency_key: string;
}

export interface IEvmWalletAuthorizeStartRequestBody {
  chain: string;
  asset_address: string;
  max_amount: string;
  nonce: string;
}

export interface IEvmWalletAuthorizeSignatureRequest {
  type: string;
  data: unknown;
}

export interface IEvmWalletAuthorizeStartResponse {
  profile_id: number;
  wallet_address: string;
  session_id: string;
  chain: string;
  asset: string;
  max_amount: string;
  remaining_amount: string;
  issued_at: string;
  expires_at: string;
  signature_request: IEvmWalletAuthorizeSignatureRequest;
  authorization_status: string;
}

export interface IEvmWalletAuthorizeConfirmRequestBody {
  session_id: string;
  owner_signature: string;
}

export interface IEvmWalletAuthorizeConfirmResponse {
  profile_id: number;
  session_id: string;
  authorization_status: string;
}

export interface IEvmWithdrawResponse {
  id: number;
  status: string;
  tx_hash?: string;
  external_id?: string;
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

/**
 * Minimal shape for Earn position overlay when merging Earn data into EVM wallet.
 * Passed from the feature layer (e.g. useRepositoryEarn().positionsPools) so EVM repo
 * does not depend on Earn repo.
 */
export interface IEvmEarnPositionOverlay {
  profileId: string | number;
  symbol?: string;
  name?: string;
  stakedAmountUsd?: number;
  transactions?: Array<{ id: number; type: string; amountUsd: number; status: string; txId: string }>;
}
