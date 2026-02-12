import {
  IEvmWalletDataResponse,
  IEvmWalletDataFormatted,
  EvmWalletStatusTypes,
  IEvmWalletBalances,
  IEvmTransactionDataFormatted,
} from '../evm.types';
import { EvmTransactionFormatter } from './transactions.formatter';
import defaultImage from 'InvestCommon/shared/assets/images/default.svg?url';
import env from 'InvestCommon/domain/config/env';
import { currency } from 'InvestCommon/helpers/currency';

export class EvmWalletFormatter {
  private data: IEvmWalletDataResponse;

  constructor(data: IEvmWalletDataResponse) {
    this.data = data;
  }

  get isStatusCreated() {
    return this.data.status === EvmWalletStatusTypes.created;
  }

  get isStatusVerified() {
    return this.data.status === EvmWalletStatusTypes.verified;
  }

  get isStatusError() {
    return this.data.status === EvmWalletStatusTypes.error;
  }

  get isStatusErrorRetry() {
    return this.data.status === EvmWalletStatusTypes.error_retry;
  }

  get isStatusErrorDocument() {
    return this.data.status === EvmWalletStatusTypes.error_document;
  }

  get isStatusErrorPending() {
    return this.data.status === EvmWalletStatusTypes.error_pending;
  }

  get isStatusErrorSuspended() {
    return this.data.status === EvmWalletStatusTypes.error_suspended;
  }

  get isStatusAnyError() {
    return this.isStatusError || this.isStatusErrorRetry || this.isStatusErrorDocument
      || this.isStatusErrorPending || this.isStatusErrorSuspended;
  }

  get currentBalance() {
    return Number(this.data.balance) || 0;
  }

  get totalBalance() {
    return (this.currentBalance + this.pendingIncomingBalance - this.pendingOutcomingBalance) || 0;
  }

  get fundingBalance() {
    // Sum of all stablecoin balances
    const rawBalances: any = (this.data as any).balances;
    const balancesArray = Object.values(rawBalances);
    
    // Define stablecoin symbols
    const stablecoinSymbols = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'LUSD', 'SUSD', 'GUSD'];
    
    return balancesArray.reduce((sum: number, balance: any) => {
      const symbol = String(balance.symbol || '').toUpperCase();
      const isStablecoin = stablecoinSymbols.includes(symbol);
      const amount = Number(balance.amount ?? 0);
      return isStablecoin ? sum + amount : sum;
    }, 0);
  }

  get rwaValue() {
    // Sum of all non-stablecoin balances by USD value (amount * price_per_usd)
    const rawBalances: any = (this.data as any).balances;
    const balancesArray = Object.values(rawBalances);
    const stablecoinSymbols = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'LUSD', 'SUSD', 'GUSD'];
    return balancesArray.reduce((sum: number, balance: any) => {
      const symbol = String(balance.symbol || '').toUpperCase();
      const isStablecoin = stablecoinSymbols.includes(symbol);
      const amount = Number(balance.amount ?? 0);
      const pricePerUsd = Number(balance.price_per_usd ?? 0);
      const valueUsd = amount * pricePerUsd;
      return !isStablecoin ? sum + valueUsd : sum;
    }, 0);
  }

  get pendingIncomingBalance() {
    return Number(this.data.inc_balance) || 0;
  }

  get pendingOutcomingBalance() {
    return Number(this.data.out_balance) || 0;
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

  format(): IEvmWalletDataFormatted {
    // Normalize balances to an array regardless of backend shape (array or map)
    let balancesArray: IEvmWalletBalances[] = [];
    const rawBalances: any = (this.data as any).balances;
    balancesArray = Object.values(rawBalances)
      .map((b: any) => {
        const amount = Number(b.amount ?? 0);

        // Token value (Book Value) in USD, preformatted for UI
        // - If amount is missing or 0 => show value as 0
        // - If amount > 0 but price_per_usd is missing/invalid => keep value undefined
        let tokenValue: string | undefined;
        if (!amount) {
          tokenValue = currency(0);
        } else if (b.price_per_usd !== undefined && b.price_per_usd !== null) {
          const priceNum = Number(b.price_per_usd);
          if (Number.isFinite(priceNum)) {
            tokenValue = currency(amount * priceNum);
          }
        }

        return {
          ...b,
          address: String(b.address),
          amount,
          symbol: String(b.symbol ?? ''),
          name: b.name ? String(b.name) : undefined,
          icon: b.icon ? this.getImage(b.icon) : undefined,
          tokenValue,
        };
      })
      // Hide zero-amount balances except USDC
      .filter((b: IEvmWalletBalances) => {
        const isUsdc = (b.symbol || '').toUpperCase() === 'USDC';
        return isUsdc || (Number(b.amount) > 0);
      });

    // Format transactions using the transaction formatter
    const formattedTransactions: IEvmTransactionDataFormatted[] = this.data.transactions?.map(transaction => 
      new EvmTransactionFormatter(transaction).format()
    );

    return {
      ...(this.data as any),
      balances: balancesArray,
      isStatusCreated: this.isStatusCreated,
      isStatusVerified: this.isStatusVerified,
      isStatusError: this.isStatusError,
      isStatusErrorRetry: this.isStatusErrorRetry,
      isStatusErrorDocument: this.isStatusErrorDocument,
      isStatusErrorPending: this.isStatusErrorPending,
      isStatusErrorSuspended: this.isStatusErrorSuspended,
      isStatusAnyError: this.isStatusAnyError,
      currentBalance: this.currentBalance,
      totalBalance: this.totalBalance,
      fundingBalance: this.fundingBalance,
      rwaValue: this.rwaValue,
      pendingIncomingBalance: this.pendingIncomingBalance,
      pendingOutcomingBalance: this.pendingOutcomingBalance,
      formattedTransactions,
    };
  }
}
